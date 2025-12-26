const mongoose = require("mongoose")
const { v4: uuidv4 } = require("uuid");
//schema
const Schema = mongoose.Schema

const roomSchema = new Schema({
    name : { type: String, required: true ,unique: true },
    type : { type: String, enum: ["game","business","coding","learning","language"], required: true },
    status : { type: String, required: true, enum: ["private", "public"] },
    roomId: { type: String, default: uuidv4 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now }
})

//table
const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
