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
        // Render the page with the selectedType and categories
        res.render('expenses', { categories, selectedType, selectedCategory, themeColor, userId  });
    })
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
        // Render the page with the selected values
        res.render('expenses', { categories, selectedType, selectedCategory, themeColor, userId });
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

// POST route to save expense category
/*app.post('/save-expense-category', async (req, res) => {
    const { expenseEmoji, categoryName, budgetGoal } = req.body;

    try {
        // Create a new category or update the existing one in the database
        const newCategory = new Category({
            emoji: expenseEmoji,
            category: categoryName,
            budgetGoal: parseFloat(budgetGoal) || 0,  // Ensure it's a number
        });

        await newCategory.save();

        // Redirect or send a response back indicating success
        res.redirect('/settings'); // Redirect to settings page or wherever you want
    } catch (error) {
        console.error('Error saving category:', error);
        res.status(500).send('Error saving category');
    }
});

// POST route to save income category
router.post('/save-income-category', async (req, res) => {
    const { expenseEmoji, categoryName, budgetGoal } = req.body;

    try {
        // Create a new category or update the existing one in the database
        const newCategory = new Category({
            emoji: expenseEmoji,
            category: categoryName,
            budgetGoal: parseFloat(budgetGoal) || 0,  // Ensure it's a number
        });

        await newCategory.save();

        // Redirect or send a response back indicating success
        res.redirect('/settings'); // Redirect to settings page or wherever you want
    } catch (error) {
        console.error('Error saving category:', error);
        res.status(500).send('Error saving category');
    }
});*/

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


// Serve static files from the "Javascript" folder
app.use('/js', express.static(path.join(__dirname, 'Javascript')));

// Port is listening
app.listen(port, () => console.log(`Express App has started and server is listening on port ${port}!`));
