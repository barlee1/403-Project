const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser"); // Add cookie-parser to handle cookies
const bcrypt = require('bcryptjs'); // Add bcrypt for password hashing

const app = express();
const port = process.env.PORT || 5500;

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Middleware to parse URL-encoded data (for forms)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Initialize cookie-parser middleware

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

require('dotenv').config(); // Load environment variables from .env

const knex = require("knex")({
  client: 'pg', // Specifies the PostgreSQL client
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432, // Default to 5432 if not set
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
    },
    pool: {
        min: 2, // Minimum number of connections
        max: 10, // Maximum number of connections
        acquireTimeoutMillis: 30000 // Wait time before throwing an error
    }
});

const session = require("express-session");

// Session configuration
app.use(
  session({
    secret: "your-secret-key", // Use a secure random string in production
    resave: false, // Prevent resaving session if it hasn't been modified
    saveUninitialized: false, // Don't save uninitialized sessions
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true, // Prevent client-side access to the cookie
      maxAge: 1000 * 60 * 60, // Session expiration time (e.g., 1 hour)
    },
  })
);


// Test the database connection
(async () => {
    try {
    const result = await knex.raw('SELECT 1+1 AS result'); // Simple query to test connection
    console.log("Database connected successfully:", result.rows);
    } catch (error) {
    console.error("Database connection failed:", error.message);
    }
})();

// ==== Routes ======

// Landing Page
app.get("/", (req, res) => {
    const error = null; 
    res.render("login", { error }); // Pass 'error' to the template
});


app.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
        // Check if the user exists
        const user = await knex("users").where({ email }).first();
        if (!user) {
            return res.render("login", { error: { type: "login", message: "Email not found." } });
        }
    
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render("login", { error: { type: "login", message: "Invalid password." } });
        }
    
        // Successful login
        // Set the user ID in a cookie
        res.cookie('userId', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        console.log(`User with ID: ${req.cookies.userId} is logged in.`); // secure: true in production environments
    
        // Redirect to home
        res.redirect("/home");
        } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send("An error occurred during login.");
    }
  });
  

// Sign-Up Route
app.post("/signup", async (req, res) => {
    const { email, password, confirm_password } = req.body;

    try {
        // Check if passwords match
        if (password !== confirm_password) {
            return res.render("login", { error: { type: 'signup', message: 'Passwords do not match.' } });
        }

        // Check if the email is already in use
        const existingUser = await knex("users").where({ email }).first();
        if (existingUser) {
            return res.render("login", { error: { type: 'signup', message: 'Email already in use.' } });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        await knex("users").insert({ email, password: hashedPassword });

        // Successful sign-up
        res.redirect("/home");
    } catch (err) {
        console.error("Error during sign-up:", err);
        res.status(500).send("An error occurred during sign-up.");
    }
});

// Home route 
app.get("/home", (req, res) => {
    //This just allows the currently logged in user's id to be accessed for things like filtering in tableau. 
    const userId = req.cookies.userId; // Retrieve the user ID from the cookie
    const themeColor = req.cookies['theme-color'] || '#4e73df'; //retrieves the theme color

    if (!userId) {
        // If userId doesn't exist in the cookie, redirect to login
        return res.redirect('/');
    }
    res.render("home", {themeColor, userId}); // Render views/home.ejs
});

app.route('/expenses')
    .get(async (req, res) => {
        // Default to a type if no type is selected
        let selectedType = req.query.type || 'X';  // Use query or default to 'X'
        let selectedCategory = req.query.category || ''; // Default empty category or set from previous submit

        // Fetch categories based on selectedType
        const categories = await knex('category')
            .select('categoryid', 'categoryname')
            .where('type', selectedType)
            .andWhere('userId', req.cookies.userId);
        
        //This just allows the currently logged in user's id to be accessed for things like filtering in tableau. 
        const userId = req.cookies.userId; // Retrieve the user ID from the cookie
        const themeColor = req.cookies['theme-color'] || '#4e73df'; //retrieves the theme color

        if (!userId) {
            // If userId doesn't exist in the cookie, redirect to login
            return res.redirect('/');
        }

                // pull current entries
                try {
                    // Fetch data from entryinfo table using Knex
                    const entries = await knex('entryinfo')
                    .join('category', 'entryinfo.categoryid', 'category.categoryid')
                    .select('amount', 'datecreated', 'category.categoryname', 'description')
                    .select(knex.raw("TO_CHAR(datecreated, 'MM/DD/YYYY') AS formattedDate"))
                    .where('userId', req.cookies.userId);
                    
                    // Format datecreated field manually
                    const formattedEntries = entries.map(entry => {
                        const formattedDate = new Date(entry.datecreated).toLocaleDateString('en-US');
                        return { 
                            ...entry, 
                            formattedDate 
                        };
                    });

                    // Render the view with the entries data
                    res.render('expenses', { categories, selectedType, selectedCategory, themeColor, userId, entries: formattedEntries });
                  } catch (error) {
                    console.error('Error fetching entries:', error);
                    res.status(500).json({ error: 'Database error' });
                  }
    })

// Route to fetch all expense/income entries
    .post(async (req, res) => {
        // Handle form submission (update logic)
        let selectedType = req.body.type;  // Get type from submitted form
        let selectedCategory = req.body.category;  // Get selected category

        // Fetch categories based on selectedType
        const categories = await knex('category')
            .select('categoryid', 'categoryname')
            .where('type', selectedType)
            .andWhere('userId', req.cookies.userId);
        
        const userId = req.cookies.userId; // Retrieve the user ID from the cookie
        const themeColor = req.cookies['theme-color'] || '#4e73df'; //retrieves the theme color

        if (!userId) {
            // If userId doesn't exist in the cookie, redirect to login
            return res.redirect('/');
        }


        try {
            // Fetch entries from the database
            const entries = await knex('entryinfo')
                .join('category', 'entryinfo.categoryid', 'category.categoryid')
                .select('amount', 'datecreated', 'category.categoryname', 'description')
                .select(knex.raw("TO_CHAR(datecreated, 'MM/DD/YYYY') AS formattedDate"))
                .where('userId', req.cookies.userId);
    
            // Format datecreated field manually
            const formattedEntries = entries.map(entry => {
                const formattedDate = new Date(entry.datecreated).toLocaleDateString('en-US');
                return { 
                    ...entry, 
                    formattedDate 
                };
            });
    
            // Render the template with the fetched data
            res.render('expenses', { 
                categories, 
                selectedType, 
                selectedCategory, 
                themeColor, 
                userId, 
                entries: formattedEntries 
            });
        } catch (error) { // Missing catch block added here
            console.error('Error fetching entries:', error);
            res.status(500).json({ error: 'Database error' });
        } // Missing closing brace for try...catch
    });

//Search
app.get('/search-expenses', async (req, res) => {
        const { year, month, day } = req.query;
        const userId = req.cookies.userId;
        const themeColor = req.cookies['theme-color'] || '#4e73df';
        const selectedType = req.query.type || 'X';
    
        if (!userId) {
            return res.redirect('/');
        }
    
        try {
            const categories = await knex('category')
                .select('categoryid', 'categoryname')
                .where('type', selectedType)
                .andWhere('userId', userId);
    
            let query = knex('entryinfo')
                .join('category', 'entryinfo.categoryid', 'category.categoryid')
                .select('amount', 'datecreated', 'category.categoryname', 'description')
                .where('entryinfo.userid', userId);
    
            if (year) query.andWhere(knex.raw("EXTRACT(YEAR FROM datecreated) = ?", [year]));
            if (month) query.andWhere(knex.raw("EXTRACT(MONTH FROM datecreated) = ?", [month]));
            if (day) query.andWhere(knex.raw("EXTRACT(DAY FROM datecreated) = ?", [day]));
    
            console.log('Filters:', { year, month, day });
            console.log('Query:', query.toString());
    
            const results = await query;
            console.log('Results:', results);
    
            const formattedResults = results.map(entry => ({
                ...entry,
                formattedDate: new Date(entry.datecreated).toLocaleDateString('en-US'),
            }));
            console.log('Formatted Results:', formattedResults);
    
            res.render('expenses', {
                entries: formattedResults,
                categories,
                selectedType,
                themeColor,
                userId,
                searchFilters: { year, month, day },
            });
        } catch (error) {
            console.error('Error searching expenses:', error);
            res.status(500).send('An error occurred while searching for expenses.');
        }
    });

// Helpful Tips route
app.get("/helpfultips", (req, res) => {
            const themeColor = req.cookies['theme-color'] || '#4e73df'; //retrieves the theme color
    res.render("helpfultips", {themeColor}); // Render views/helpfultips.ejs
});

// Settings route - Retrieve the theme color and categories from cookies or settings
app.get("/settings", (req, res) => {
                            //This just allows the currently logged in user's id to be accessed for things like filtering in tableau. 
                            const userId = req.cookies.userId; // Retrieve the user ID from the cookie
                            const themeColor = req.cookies['theme-color'] || '#4e73df'; //retrieves the theme color
                            console.log(themeColor);
                            console.log(userId);
                            if (!userId) {
                                // If userId doesn't exist in the cookie, redirect to login
                                return res.redirect('/');
                            }
    res.render("settings", { themeColor, userId }); // Pass the themeColor to the EJS template
});

app.post('/update-color', async (req, res) => {
    const userId = req.cookies.userId;
    const selectedColor = req.body.selectedColor;
    
    if (!userId) {
        return res.redirect('/login');
    }

    console.log(`Selected Color: ${selectedColor}`);

    try {
        await knex('users')
            .where({ id: userId })
            .update({ theme_color: selectedColor });

        res.cookie('theme-color', selectedColor, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.redirect('/settings');
    } catch (err) {
        console.error('Error updating theme color:', err);
        res.render("settings", { error: { message: 'Error updating theme color. Please try again.' } });
    }
});

// POST route to save categories
app.post('/save-category', async (req, res) => {
    const {icon, categoryname, budget, type } = req.body;
    const userId = req.cookies.userId; // Assuming userId is stored in the session

    console.log(categoryname, icon, budget, type, userId);

    if (!userId) {
        return res.status(400).send('User ID not found.');
    }

    try {
        // Use Knex to insert the data into the database
        await knex('category').insert({
            icon: icon,
            categoryname: categoryname,
            budget: parseFloat(budget) || 0, // Ensure it's a number
            type: type,
            userId: userId
        });

        // Redirect or send a response back indicating success
        res.redirect('/settings'); // Redirect to settings page or another relevant page
    } catch (error) {
        console.error('Error saving category:', error);
        res.status(500).send('Error saving category.');
    }
});

// Profile route
app.get("/profile", (req, res) => {
            //This just allows the currently logged in user's id to be accessed for things like filtering in tableau. 
            const userId = req.cookies.userId; // Retrieve the user ID from the cookie
            const themeColor = req.cookies['theme-color'] || '#4e73df'; //retrieves the theme color

            if (!userId) {
                // If userId doesn't exist in the cookie, redirect to login
                return res.redirect('/');
            }
    res.render("profile", { themeColor, userId }); // Render views/profile.ejs
});

// POST Route to save Entry Information
app.post('/entry-submit', (req, res) => {
    // Extract data from the submitted form
    const { entryDate, category, amount, description, userId } = req.body;
    
    // Format the amount to remove dollar sign and commas (optional step)
    const formattedAmount = amount.replace(/[^0-9.-]+/g, ''); // Removes any non-numeric characters (like $)

    // Insert data into the database
    knex('entryinfo')
    .insert({
            datecreated: entryDate,      // Date of the entry
            categoryid: category,     // Category ID
            amount: formattedAmount,  // The numeric amount
            description: description,  // Description (optional)
            userid: userId
        })
    .then (() => { 
        res.redirect('/expenses');
    })
    .catch (error =>  {
        console.error("Error inserting data:", error);
        res.status(500).send("An error occurred while saving your entry.");
    });
});


// Serve static files from the "Javascript" folder
app.use('/js', express.static(path.join(__dirname, 'Javascript')));

// Port is listening
app.listen(port, () => console.log(`Express App has started and server is listening on port ${port}!`));
