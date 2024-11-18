const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser"); // Add cookie-parser to handle cookies

const app = express();
const port = 5500;

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Middleware to parse URL-encoded data (for forms)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Initialize cookie-parser middleware

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Database connection setup
const knex = require("knex")({
    client: "pg",
    connection: {
        host: "localhost",
        user: "kyleebrown",
        password: "Admin",
        database: "budgetsite",
        port: 5432
    }
});

// Routes

// Landing Page
app.get("/", (req, res) => {
    res.render("login"); // Render views/login.ejs
});

// Home route
app.get("/home", (req, res) => {
    res.render("home"); // Render views/home.ejs
});

// Expenses route
app.get("/expenses", (req, res) => {
    res.render("expenses"); // Render views/expenses.ejs
});

// Helpful Tips route
app.get("/helpfultips", (req, res) => {
    res.render("helpfultips"); // Render views/helpfultips.ejs
});

// Settings route - Retrieve the theme color and categories from cookies or settings
app.get("/settings", (req, res) => {
    const themeColor = req.cookies['theme-color'] || '#4e73df'; // Default theme color if not set
    res.render("settings", { themeColor }); // Pass the themeColor to the EJS template
});

// Profile route
app.get("/profile", (req, res) => {
    res.render("profile"); // Render views/profile.ejs
});

// Data route to fetch data from the database
// API route to fetch the data from PostgreSQL using knex
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

// Start the server
app.listen(port, () => console.log(`Express App has started and server is listening on port ${port}!`));


// Route for updating settings
app.post('/update-settings', (req, res) => {
    const themeColor = req.body['theme-color'];
    const expenseCategories = JSON.parse(req.body['expense-categories']);
    const incomeCategories = JSON.parse(req.body['income-categories']);

    // Save the theme color and categories to settings
    // This would ideally be stored in a database, but for now, we store it in cookies
    res.cookie('theme-color', themeColor, { maxAge: 86400000 }); // Cookie expires in 1 day

    // Optionally: Save the categories to a database, for example:
    // knex('settings').insert({ themeColor, expenseCategories, incomeCategories })
    //     .then(() => res.redirect('/settings'))
    //     .catch(err => console.error(err));

    // Redirect back to the settings page
    res.redirect('/settings');
});

// Serve the '403-Project/javascript' folder as static files
app.use('/javascript', express.static('403-Project/javascript'));

