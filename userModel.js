var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Define user schema
var userSchema = new Schema({
    _id: Schema.Types.ObjectId, // Unique ID field
    name: String,
    email: String,
    phno: String,
    password: String
});

// Create user model
var User = mongoose.model("User", userSchema);

module.exports = User; // Export the User model for use in other files
