const mongoose = require("mongoose")
//schema
const Schema = mongoose.Schema

const userSchema = new Schema({
    name : { type: String, required: true ,unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
})

//table
const User = mongoose.model("User", userSchema);
module.exports = User;
