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
    console.log("User ID:", req.cookies.userId);
    const userId = req.cookies.userId; // Retrieve the user ID from the cookie
    const themeColor = req.cookies['theme-color'] || '#4e73df'; // Retrieve theme color from cookie

    if (!userId) {
        // If no userId, redirect to login
        return res.redirect('/');
    }
    // Render the home view and pass the userId and themeColor
    res.render("home", { themeColor, userId });
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

app.get("/settings", async (req, res) => {
    // Retrieve user ID and theme color from cookies
    const userId = req.cookies.userId;
    const themeColor = req.cookies['theme-color'] || '#4e73df'; // Default to #4e73df if not set
    
    console.log(themeColor);
    console.log(userId);
    
    if (!userId) {
        // Redirect to login if no user ID is found in the cookies
        return res.redirect('/');
    }

    try {
        // Use Knex to query the categories table for the user's categories
        const categories = await knex('category')
            .select('categoryid', 'icon', 'categoryname', 'budget', 'type')
            .where('userId', userId);


        // Split categories by type
        const typeXCategories = categories.filter(category => category.type === 'X');
        const typeICategories = categories.filter(category => category.type === 'I');

        // Render the settings page with theme color, user ID, and categories
        res.render("settings", { themeColor, userId, typeXCategories, typeICategories });

    } catch (error) {
        console.error("Error retrieving categories:", error);
        res.status(500).send("Internal Server Error");
    }
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

// DELETE route to delete a category
app.post('/delete-category', async (req, res) => {
    const { categoryid } = req.body;
    const userId = req.cookies.userId; // Assuming userId is stored in the cookies

    console.log('Deleting category with ID:', categoryid, 'for user:', userId);

    if (!userId) {
        return res.status(400).send('User ID not found.');
    }

    if (!categoryid) {
        return res.status(400).send('Category ID not provided.');
    }

    try {
        // Delete from the entryinfo table (if any entries exist)
        const deletedEntries = await knex('entryinfo')
            .where({ categoryid: categoryid, userid: userId }) // Matching categoryID and userID
            .del();

        // Log the result of deletion, but don't return an error if no entries were deleted
        if (deletedEntries > 0) {
            console.log(`Deleted ${deletedEntries} entry(s) from entryinfo table.`);
        } else {
            console.log('No entries found in entryinfo table for the given category and user.');
        }

        // Now, delete the category itself from the category table
        const deletedCategory = await knex('category')
            .where({ categoryid: categoryid, userId: userId })
            .del();

        // If no category is deleted, return a 404 response
        if (deletedCategory === 0) {
            return res.status(404).send('Category not found or you do not have permission to delete it.');
        }

        // Redirect to the settings page after successful deletion
        res.redirect('/settings');
    } catch (error) {
        console.error('Error deleting category:', error);

        // Check if the error is a foreign key violation (error code 23503)
        if (error.code === '23503') {
            return res.status(400).send('Cannot delete category because it is referenced by other entries.');
        }

        // Generic error response
        res.status(500).send('Error deleting category.');
    }
});



// Profile route
app.get("/profile", async (req, res) => {
    const userId = req.cookies.userId; // Retrieve the user ID from the cookie
    const themeColor = req.cookies['theme-color'] || '#4e73df'; // Retrieve the theme color
    if (!userId) {
        // If userId doesn't exist in the cookie, redirect to login
        return res.redirect('/');
    }

    try {
        // Fetch the current user's profile picture from the users table
        const userInfo = await knex('users')
            .select('profilepic')
            .where('id', userId)
            .first();

        const profilePicture = userInfo?.profilepic || 'browncow.png'; // Default picture fallback

        // Render the profile page with the current profile picture
        res.render("profile", { themeColor, userId, profilePicture });
    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).send("Error loading profile page");
    }
});

// Route to update profile picture
app.post("/profile/update-picture", async (req, res) => {
    const userId = req.cookies.userId; // Retrieve the user ID from the cookie
    const { profilepic } = req.body; // New profile picture ID from the form

    if (!userId) {
        // If userId doesn't exist in the cookie, redirect to login
        return res.redirect('/');
    }

    try {
        // Update the user's profile picture in the users table
        const updateResult = await knex('users')
            .where('id', userId)
            .update({ profilepic });

        if (updateResult === 0) {
            return res.status(404).send('User not found or no associated profile!');
        }

        res.redirect("/profile"); // Redirect back to the profile page after update
    } catch (error) {
        console.error("Error updating profile picture:", error);
        res.status(500).send("Error updating profile picture");
    }
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

// Chart for home page routes
app.get('/chart-data', async (req, res) => {
    try {
        const userId = req.session.userId; // Replace with your user authentication logic

        const incomeData = await knex('entryinfo')
            .join('category', 'entryinfo.categoryid', 'category.categoryid')
            .select(
                knex.raw("DATE_TRUNC('month', entryinfo.datecreated) AS month"),
                knex.raw('SUM(entryinfo.amount) AS total')
            )
            .where({ 'entryinfo.userid': 1, 'category.type': 'I' })
            .groupByRaw("DATE_TRUNC('month', entryinfo.datecreated)")
            .orderByRaw("DATE_TRUNC('month', entryinfo.datecreated)");

        const expenseData = await knex('entryinfo')
            .join('category', 'entryinfo.categoryid', 'category.categoryid')
            .select(
                knex.raw("DATE_TRUNC('month', entryinfo.datecreated) AS month"),
                knex.raw('SUM(entryinfo.amount) AS total')
            )
            .where({ 'entryinfo.userid': 1, 'category.type': 'X' })
            .groupByRaw("DATE_TRUNC('month', entryinfo.datecreated)")
            .orderByRaw("DATE_TRUNC('month', entryinfo.datecreated)");

        res.json({
            incomeData,
            expenseData,
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching chart data');
    }
});



// Serve static files from the "Javascript" folder
app.use('/js', express.static(path.join(__dirname, 'Javascript')));

// Port is listening
app.listen(port, () => console.log(`Express App has started and server is listening on port ${port}!`));
