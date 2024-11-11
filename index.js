const express = require("express");
const path = require("path");

const app = express();
const port = 5500;

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Middleware to parse URL-encoded data (for forms)
app.use(express.urlencoded({ extended: true }));

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
    res.render("index"); // Render views/index.ejs
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

// Settings route
app.get("/settings", (req, res) => {
    res.render("settings"); // Render views/settings.ejs
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
