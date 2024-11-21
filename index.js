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



// Test the database connection
(async () => {
    try {
    const result = await knex.raw('SELECT 1+1 AS result'); // Simple query to test connection
    console.log("Database connected successfully:", result.rows);
    } catch (error) {
    console.error("Database connection failed:", error.message);
    }
})();

// Routes

// Landing Page
app.get("/", (req, res) => {
    const error = null; // Or get this from a specific source, like flash messages
    res.render("login", { error }); // Pass 'error' to the template
});


// Login Route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await knex("users").where({ email }).first();
        if (!user) {
            return res.render("login", { error: { type: 'login', message: 'Email not found.' } });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render("login", { error: { type: 'login', message: 'Invalid password.' } });
        }

        // Successful login
                        // Set the user ID in a cookie
                        res.cookie('userId', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
                        console.log(`User with ID: ${req.cookies.userId} is logged in.`); // secure: true in production environments
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

// Expenses route
app.get("/expenses", (req, res) => {
                        //This just allows the currently logged in user's id to be accessed for things like filtering in tableau. 
                        const userId = req.cookies.userId; // Retrieve the user ID from the cookie
                        const themeColor = req.cookies['theme-color'] || '#4e73df'; //retrieves the theme color


                        if (!userId) {
                            // If userId doesn't exist in the cookie, redirect to login
                            return res.redirect('/');
                        }
    res.render("expenses", {themeColor, userId}); // Render views/expenses.ejs
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

// Route to handle the form submission (updating settings)
app.post('/update-settings', async (req, res) => {
    const userId = req.cookies.userId;  // Assuming you're storing userId in the session
    const selectedColor = req.body.selectedColor;  // Extract themeColor from the form input

    if (!userId) {
        return res.redirect('/'); // Ensure user is logged in
    }

    // Log themeColor to confirm the value
    console.log(`Theme Color: ${selectedColor}`);

    try {
        // Update the theme color for the user
        await knex('users')
            .where({ id: userId })
            .update({ theme_color: selectedColor});

        console.log('Theme color updated successfully');
        
        // Update the cookie with the new theme color
        res.cookie('theme-color', selectedColor, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        // Redirect back to settings page with success message
        res.redirect('/settings');
    } catch (err) {
        console.error('Error updating theme color:', err);
        // Redirect to settings page with an error message
        res.render("settings", { error: { message: 'Error updating theme color. Please try again.' } });
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

// Data route to fetch data from the database
app.get('/expenses-by-month', async (req, res) => {
    try {
        const result = await knex('expenseinfo')
            .select(knex.raw("TO_CHAR(DATE_TRUNC('month', expensedatecreated), 'YYYY-MM') AS month"))
            .avg('expenseamount AS avg_expense')
            .groupBy(knex.raw("DATE_TRUNC('month', expensedatecreated)"))
            .orderBy('month');

        // Send the data in a JSON format
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching data from database');
    }
});

app.get('/income-by-month', async (req, res) => {
    try {
        const result = await knex('incomeinfo')
            .select(knex.raw("TO_CHAR(DATE_TRUNC('month', incomedatecreated), 'YYYY-MM') AS month"))
            .sum('incomeamount AS total_income')
            .groupBy(knex.raw("DATE_TRUNC('month', incomedatecreated)"))
            .orderBy('month');

        // Send the data in a JSON format
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching income data from database');
    }
});


// Route to fetch the expenses page
app.get('/expenses', (req, res) => {
    //This just allows the currently logged in user's id to be accessed for things like filtering in tableau. 
    const userId = req.cookies.userId; // Retrieve the user ID from the cookie
    const themeColor = req.cookies['theme-color'] || '#4e73df'; //retrieves the theme color

    if (!userId) {
        // If userId doesn't exist in the cookie, redirect to login
        return res.redirect('/');
    }
    res.render("expenses", { themeColor, userId });
});


// Serve static files from the "Javascript" folder
app.use('/js', express.static(path.join(__dirname, 'Javascript')));

app.listen(port, () => console.log(`Express App has started and server is listening on port ${port}!`));
