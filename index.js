let express = require("express");

//creating an express object
let app = express();

//creating an object for the path and bringin git in
let path = require("path");

// assinging a number to the port, const because we aren't going to change
const port = 5500;

// allows you to use ejs to write embedded javascript in the html file
app.set("view engine", "ejs");

// ejs uses views and we are telling it where the views are going to be included
app.set("views", path.join(__dirname, "views"));

//
app.use(express.urlencoded({extended: true}));

// make a varaible 
const knex = require("knex") ({
    client : "pg",
    connection : {
        host : "localhost",
        user : "kyleebrown",
        password : "Admin",
        database : "Employees",
        port : 5432
    }
})

// This is a route
app.get("/", (req, res) =>
{
});

app.get("/expenses", (req, res) => {
    res.render("expenses"); // This will render views/expenses.ejs
});

app.get("/home", async (req, res) => {
    try {
        const data = await knex.select("*").from("Order_Details"); // Replace with your table name
        res.json(data);
    } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).send("Error fetching data");
    }
});


//Tells you that the express app has started
app.listen(port, () => console.log("Express App has started and server is listening!"));