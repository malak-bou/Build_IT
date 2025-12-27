const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose")
const User = require("./models/user");
const Room = require("./models/room");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
app.use(express.json())

connectDB();
const jwt = require("jsonwebtoken");




const path = require("path");

app.use(express.static(path.join(__dirname, "FRONTEND")));



app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }
        const existingName = await User.findOne({ name });
        if (existingName) {
            return res.status(400).json({ message: "Name already exist" });
        }
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already used" });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "1h" });

        res.status(201).json({
            message: "You successfully registered", token,
            user: { name: newUser.name, email: newUser.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }


});


app.post("/signin", async (req, res) => {
    try {
        const { nameOremail, password } = req.body;

        const user = await User.findOne({
            $or: [{ email: nameOremail }, { name: nameOremail }]
        });
        if (!user) {
            return res.status(400).json({ message: "account not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });


        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({
            message: "signin successful", token,
            user: { name: user.name, email: user.email }
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
})


//profile


app.get("/profile", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "No token provided" });

        const token = authHeader.split(" ")[1]; // "Bearer <token>"
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find the user by ID from token
        const user = await User.findById(decoded.id).select("-password"); // remove password
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Invalid token" });
    }
});





app.post("/rooms", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const { name, type, status } = req.body;

        const newRoom = new Room({
            name,
            type,
            status,
            createdBy: userId,
            allowedUsers: status === "private" ? [userId] : [] // only creator allowed initially
        });

        await newRoom.save();

        res.status(201).json({
            message: "Room created successfully",
            roomId: status === "private" ? newRoom.roomId : null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

app.get("/rooms", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let userId = null;
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            userId = decoded.id;
        }

        const rooms = await Room.find({
            $or: [
                { status: "public" },
                { status: "private", allowedUsers: userId } // only show private rooms you are allowed
            ]
        });

        res.json(rooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


app.post("/join-room", async (req, res) => {
    try {
        const { roomId } = req.body;

        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ message: "Room not found" });

        if (room.status === "private") {
            // add user to allowedUsers if not already there
            if (!room.allowedUsers.includes(userId)) {
                room.allowedUsers.push(userId);
                await room.save();
            }
            return res.status(200).json({ message: "Private room access granted", room });
        } else {
            return res.status(200).json({ message: "Public room access granted", room });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


app.listen(PORT, () => {
    console.log(`I am listening in port ${PORT}`);
});

