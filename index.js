var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var session = require('express-session'); // Import express-session middleware
var User = require("./userModel"); // Require the user model
// const PORT = 4000; // Specify the port number you want to use


// Define the coin model schema
var coinSchema = new mongoose.Schema({
    name: String,
    priceUsd: Number,
    changePercent24Hr: Number,
    rank: Number
});

// Create coin model
var Coin = mongoose.model("Coin", coinSchema);

// Define the Transaction model schema
const transactionSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: String,
    coinName: String,
    quantity: Number,
    totalPrice: Number, // New field to store the total price
    tid: String,
    price: Number, // New field to store the total price
    buyType: Number,
});

const Transaction = mongoose.model("Transaction", transactionSchema); // Create Transaction model

// Define the Portfolio model schema
const portfolioSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: String,
    coinName: String,
    totalp: Number
});

// Create Portfolio model
const Portfolio = mongoose.model("Portfolio", portfolioSchema);

// Define the ContactUs model schema
const contactUsSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    message: String
});

// Create ContactUs model
const ContactUs = mongoose.model("ContactUs", contactUsSchema);


const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended:true
}));

app.set('view engine', 'ejs'); // Set EJS as the view engine
app.set('views', __dirname + '/views'); // Set the directory for EJS views

// Configure express-session middleware
app.use(session({
    secret: 'secret', // Change this to a more secure secret in production
    resave: false,
    saveUninitialized: true
}));

mongoose.connect('mongodb://127.0.0.1:27017/mydb',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

db.on('error',()=>console.log("Error in Connecting to Database"));
db.once('open',()=>console.log("Connected to Database"));


// Sign-up endpoint
app.post("/sign_up",(req,res)=>{
    var name = req.body.name;
    var email = req.body.email;
    var phno = req.body.phno;
    var password = req.body.password;

    var newUser = new User({ // Create a new user instance using the User model
        _id: new mongoose.Types.ObjectId(), // Generate a new unique ObjectId
        name: name,
        email: email,
        phno: phno,
        password: password
    });

    newUser.save() // Save the new user to the database
        .then(user => {
            console.log("Record Inserted Successfully");
            // Send response with JavaScript code to display pop-up message and redirect
            return res.send(
                `<script>alert('Signup successful!'); window.location.href = '/';</script>`
            );
        })
        .catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
});

// Login endpoint
app.post("/login",(req,res)=>{
    var email = req.body.email_login;
    var password = req.body.password_login;

    // Find a user with the provided email and password
    User.findOne({ email: email, password: password })
    .then(user => {
        if (!user) {
            return res.redirect('/index.html?message=User not found');
        } else {
            req.session.userId = user._id;
            req.session.userName = user.name;
            return res.redirect(`/`); // Redirect to the root URL after login
        }
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    });
});


// Save coins endpoint
app.post("/save_coins", (req, res) => {
    const coinsData = req.body.coinsData; // Get the cryptocurrency data from the request body
    if (!coinsData || !Array.isArray(coinsData)) {
        return res.status(400).json({ error: "Invalid cryptocurrency data" });
    }

    // Update name and priceUsd for each coin based on rank
    coinsData.forEach(coin => {
        const rank = coin.rank;
        const name = coin.name;
        const priceUsd = parseFloat(coin.priceUsd);
        const changePercent24Hr = parseFloat(coin.changePercent24Hr);
        
        // Update the name and priceUsd for the coin with the corresponding rank in the coins collection
        Coin.findOneAndUpdate({ rank: rank }, { name: name, priceUsd: priceUsd, changePercent24Hr: changePercent24Hr }, { new: true, upsert: true })
            .then(updatedCoin => {
                return updatedCoin;
            })
            .catch(err => {
                console.error("Error updating coin data:", err);
            });
    });

    return res.status(200).json({ message: "Cryptocurrency data updated successfully" });
});


// Create a new endpoint to handle transactions
app.post("/buy_crypto", async (req, res) => {
    try {
        const { email, cryptocurrency, quantity, totalPrice } = req.body;

        // Generate a unique transaction ID
        const tid = new mongoose.Types.ObjectId();
        const price = totalPrice / quantity;

        // Create a new transaction
        const newTransaction = new Transaction({
            _id: tid,
            email: email,
            coinName: cryptocurrency,
            quantity: quantity,
            totalPrice: totalPrice,
            tid: tid,
            price: price,
            buyType: 1
        });

        // Save the transaction to the database
        await newTransaction.save();

        // Update or create portfolio entry
        const portfolioEntry = await Portfolio.findOneAndUpdate(
            { email: email, coinName: cryptocurrency },
            { $inc: { totalp: totalPrice } }, // Increment totalp by totalPrice
            { upsert: true, new: true }
        );

        // Respond with a success message and transaction details
        res.status(200).json({
            message: "Transaction successful",
            tid: tid,
            email: email,
            coinName: cryptocurrency,
            quantity: quantity,
            totalPrice: totalPrice,
            price: price,
            buyType: 1
        });
    } catch (error) {
        // Handle errors
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Create a new endpoint to handle sell transactions
// app.post("/sell_crypto", async (req, res) => {
//     try {
//         const { email_sell, cryptocurrency_sell, quantity_sell, totalPrice_sell } = req.body;

//         // Generate a unique transaction ID
//         const tid = new mongoose.Types.ObjectId();
//         const price = totalPrice_sell / quantity_sell;

//         // Create a new transaction
//         const newTransaction = new Transaction({
//             _id: tid,
//             email: email_sell,
//             coinName: cryptocurrency_sell,
//             quantity: quantity_sell,
//             totalPrice: totalPrice_sell,
//             tid: tid,
//             price: price,
//             buyType: 0 // Set buyType to 0 for sell transactions
//         });

//         // Save the transaction to the database
//         await newTransaction.save();

//         // Find portfolio entry
//         const portfolioEntry = await Portfolio.findOne({ email: email_sell, coinName: cryptocurrency_sell });

//         // If no portfolio entry found or insufficient balance
//         if (!portfolioEntry || portfolioEntry.totalp < totalPrice_sell) {
//             // Respond with a message indicating insufficient balance
//             const errorMessage = "You do not have enough crypto";
//             console.log(errorMessage); // Print error message to console
//             return res.status(400).json({ error: errorMessage });
//         }

//         // If sufficient balance, update portfolio entry
//         portfolioEntry.totalp -= totalPrice_sell;

//         // Save the updated portfolio entry to the database
//         await portfolioEntry.save();

//         // Respond with success message
//         res.status(200).json({ message: "Crypto Sold Successfully" });

//     } catch (error) {
//         // Handle errors
//         console.error("Error selling crypto:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });


// app.post("/sell_crypto", async (req, res) => {
//     try {
//         const { email_sell, cryptocurrency_sell, quantity_sell, totalPrice_sell } = req.body;

//         // Generate a unique transaction ID
//         const tid = new mongoose.Types.ObjectId();
//         const price = totalPrice_sell / quantity_sell;

//         // Create a new transaction
//         const newTransaction = new Transaction({
//             _id: tid,
//             email: email_sell,
//             coinName: cryptocurrency_sell,
//             quantity: quantity_sell,
//             totalPrice: totalPrice_sell,
//             tid: tid,
//             price: price,
//             buyType: 0 // Set buyType to 0 for sell transactions
//         });

//         // Save the transaction to the database
//         await newTransaction.save();

//         // Find portfolio entry
//         const portfolioEntry = await Portfolio.findOne({ email: email_sell, coinName: cryptocurrency_sell });

//         // If no portfolio entry found or insufficient balance
//         if (!portfolioEntry || portfolioEntry.totalp < totalPrice_sell) {
//             // Respond with a message indicating insufficient balance
//             const errorMessage = "You do not have enough crypto";
//             console.log(errorMessage); // Print error message to console
//             return res.status(400).json({ error: errorMessage });
//         }

//         // If sufficient balance, update portfolio entry
//         portfolioEntry.totalp -= totalPrice_sell;

//         // Save the updated portfolio entry to the database
//         await portfolioEntry.save();

//         // Respond with success message
//         res.status(200).json({ message: "Crypto Sold Successfully" });

//     } catch (error) {
//         // Handle errors
//         console.error("Error selling crypto:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });
app.post("/sell_crypto", async (req, res) => {
    try {
        const { email_sell, cryptocurrency_sell, quantity_sell, totalPrice_sell } = req.body;

        // Generate a unique transaction ID
        const tid = new mongoose.Types.ObjectId();
        const price = totalPrice_sell / quantity_sell;

        console.log("Transaction ID:", tid); // Debugging message

        // Create a new transaction for selling
        const newTransaction = new Transaction({
            _id: tid,
            email: email_sell,
            coinName: cryptocurrency_sell,
            quantity: quantity_sell,
            totalPrice: totalPrice_sell,
            tid: tid,
            price: price,
            buyType: 0 // Set buyType to 0 for sell transactions
        });

        // Save the transaction to the database
        await newTransaction.save();
        console.log("Transaction saved:", newTransaction); // Debugging message

        // Find portfolio entry for the user and cryptocurrency
        const portfolioEntry = await Portfolio.findOne({ email: email_sell, coinName: cryptocurrency_sell });

        console.log("Portfolio entry found:", portfolioEntry); // Debugging message

        // If no portfolio entry found or insufficient balance
        if (!portfolioEntry || portfolioEntry.totalp < totalPrice_sell) {
            // Respond with a message indicating insufficient balance
            const errorMessage = "You do not have enough crypto";
            console.log(errorMessage); // Print error message to console
            return res.status(400).json({ error: errorMessage });
        }

        // If sufficient balance, update portfolio entry
        portfolioEntry.totalp -= totalPrice_sell;

        // Save the updated portfolio entry to the database
        await portfolioEntry.save();

        console.log("Portfolio entry updated:", portfolioEntry); // Debugging message

        // Respond with success message
        res.status(200).json({ message: "Crypto Sold Successfully" });

    } catch (error) {
        // Handle errors
        console.error("Error selling crypto:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});





// Logout endpoint
app.get("/logout", (req, res) => {
    // Destroy session
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.redirect('/'); // Redirect to home page after logout
    });
});



// Define route handler for saving contact form entries
app.post("/submit_contact_form", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Create a new instance of ContactUs model
        const newEntry = new ContactUs({
            _id: new mongoose.Types.ObjectId(),
            name: name,
            email: email,
            message: message
        });

        // Save the new entry to the database
        await newEntry.save();

        // Send a success response back to the client
        res.status(200).send("Form submission successful!");
    } catch (error) {
        // Handle errors
        console.error("Error submitting contact form:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Handle portfolio email submission and retrieval of portfolio data
app.post("/submit_portfolio_email", async (req, res) => {
    try {
        const { email } = req.body;

        console.log("Email received in server:", email); // Print email received in server

        // Query the database to find all instances of the email in the Portfolio collection
        const portfolioData = await Portfolio.find({ email: email });

        console.log("Portfolio data:", portfolioData); // Print portfolio data

        if (portfolioData.length === 0) {
            // If no portfolio data found, send a message
            return res.status(200).json({ message: "No Crypto Available", data: [] });
        }

        // Extract coinName and totalp from each portfolio entry
        const cryptoData = portfolioData.map(entry => {
            return {
                coinName: entry.coinName,
                totalp: entry.totalp
            };
        });

        console.log("cryptoData:", cryptoData); // Print portfolio data

        // Send the extracted data back to the client
        res.status(200).json({ message: "Crypto Data Found", data: cryptoData });
    } catch (error) {
        console.error("Error submitting portfolio email:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Define route handler for serving the "markets" page
app.get("/markets", (req, res) => {
    const userName = req.session.userName; // Retrieve user's name from session
    res.render('markets', { userName: userName }); // Render contact_us.ejs and pass user's name
});

// Define route handler for serving the "markets" page
app.get("/portfolio", (req, res) => {
    const userName = req.session.userName; // Retrieve user's name from session
    res.render('portfolio', { userName: userName }); // Render contact_us.ejs and pass user's name
});


// Define route handler for serving the "markets" page
app.get("/about_us", (req, res) => {
    const userName = req.session.userName; // Retrieve user's name from session
    res.render('about_us', { userName: userName }); // Render contact_us.ejs and pass user's name
});


// Define route handler for serving the contact us page
app.get("/contact_us", (req, res) => {
    const userName = req.session.userName; // Retrieve user's name from session
    res.render('contact_us', { userName: userName }); // Render contact_us.ejs and pass user's name
});


// Serve "/" on the root URL
app.get("/", (req, res) => {
    const userName = req.session.userName; // Retrieve user's name from session
    res.render('index', { userName: userName }); // Render index.ejs and pass user's name
});



// console.log("Listening on PORT 3000");

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});