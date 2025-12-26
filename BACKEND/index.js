const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose")
const User = require("./models/user");
const Room = require("./models/room");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();


app.use(express.json())

connectDB();
const jwt = require("jsonwebtoken");
const SECRET_KEY = "mysecretkey123";



const path = require("path");

app.use(express.static(path.join(__dirname, "../FRONTEND")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../FRONTEND/index.html"));
});

app.post("/signup", async (req,res)=>{
    try {
        const { name , email, password, confirmPassword } = req.body;
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
        const token = jwt.sign({ id: newUser._id }, SECRET_KEY, { expiresIn: "1h" });

        res.status(201).json({ message: "You successfully registered" ,token,
            user: { name: newUser.name, email: newUser.email }
        });
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
    

});


app.post("/signin", async (req,res) =>{
    try{
        const { nameOremail, password} = req.body;

        const user = await User.findOne({
            $or: [{ email: nameOremail }, { name: nameOremail }]
        });
        if(!user) {
            return res.status(400).json({message : "account not found"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });


        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });
        res.status(200).json({message: "signin successful",token,
         user: { name: user.name, email: user.email }})
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
        const decoded = jwt.verify(token, SECRET_KEY);

        // Find the user by ID from token
        const user = await User.findById(decoded.id).select("-password"); // remove password
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Invalid token" });
    }
});



//front end fetching profile

// const token = localStorage.getItem("token"); // or wherever you stored it

// fetch("http://localhost:3000/profile", {
//   headers: {
//     "Authorization": "Bearer " + token
//   }
// })
// .then(res => res.json())
// .then(data => {
//     console.log("User profile:", data.user);
//     // Display the user profile in your UI
// })
// .catch(err => console.error(err));


app.post("/rooms", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_KEY);
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
            const decoded = jwt.verify(token, SECRET_KEY);
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
        const decoded = jwt.verify(token, SECRET_KEY);
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



//rooms

// <form id="createRoomForm">
//   <input type="text" id="name" placeholder="Room Name" required />
//   <select id="type">
//     <option value="game">Game</option>
//     <option value="business">Business</option>
//     <option value="coding">Coding</option>
//     <option value="learning">Learning</option>
//     <option value="language">Language</option>
//   </select>
//   <select id="status">
//     <option value="public">Public</option>
//     <option value="private">Private</option>
//   </select>
//   <button type="submit">Create Room</button>
// </form>

// <div id="roomInfo"></div>

// <script>
//   const form = document.getElementById("createRoomForm");
//   const roomInfo = document.getElementById("roomInfo");

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const data = {
//       name: document.getElementById("name").value,
//       type: document.getElementById("type").value,
//       status: document.getElementById("status").value,
//       userId: "USER_ID_HERE" // replace with logged-in user ID
//     };

//     const response = await fetch("/api/rooms", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data)
//     });

//     const result = await response.json();

//     if (result.roomId) {
//       roomInfo.innerHTML = `Private Room Created! Share this ID with your friend: <strong>${result.roomId}</strong>`;
//     } else {
//       roomInfo.innerHTML = "Public Room Created!";
//     }

//     form.reset();
//   });
// </script>














// app.get("/numbers",(req,res)=>{
//     let numbers = "";
//     for(let i=0 ;i<=100 ;i++){
//         numbers += i+" _ "
//     }
// //    
// // res.sendFile(__dirname + "/views/numbers.html")
//     res.render("numbers.ejs",{
//         name:"malak",
//         numbers : numbers,
//     });

// });
// app.put("/test",(req,res)=>{
//     res.send("test");
// });


// app.post("/addcomment",(req,res)=>{
//     res.send("post request on add comment");
// });
// //end point
// app.delete("/delete",(req,res)=>{
//     res.send("deletrequest on add comment");
// });

// app.get("/findSummation/:num1/:num2",(req,res)=>{
//     const num1 = req.params.num1
//     const num2 = req.params.num2
//     const total = Number(num1)+Number(num2)
//     res.send(`the numbers : ${total}`);
    
// })
// app.get("/findSummation2",(req,res)=>{
//     // console.log(req.body)
//     // console.log(req.query)
   
//     // res.send(`heelo ${req.body.name} age is ${req.query.age}`);
//     res.json({
//         name : req.body.name,
//         age:req.query.age,
//         language : "arabic"
//     })
// })

// //database endpoints

// app.post("/articles", async (req,res)=>{
//     const newArticle = new Article();

//     const titleArtcile = req.body.title;
//     const bodyArtcile = req.body.body;
//     newArticle.title = titleArtcile;
//     newArticle.body = bodyArtcile;
//     newArticle.numberOfLikes = 0;
//     //to put it in database
//     await newArticle.save();

//     res.json(newArticle);
// })

// app.get("/articles",async(req,res)=>{
//     //brings me all the articles
//    const articles =  await Article.find()
//     res.json(articles)
// })
// app.get("/articles/:articleId",async(req,res)=>{
//     //brings me all the articles
//     const id = req.params.articleId;
//     const article = await Article.findById(id);
//     res.json(article);
// })
// app.delete("/articles/:articleId",async(req,res)=>{
//     //brings me all the articles
//     const id = req.params.articleId;
//     const article = await Article.findByIdAndDelete(id);
//     res.json(article);
// })

// app.get("/showArticles",async(req,res)=>{
//     const articles = await Article.find()
//     res.render("articles.ejs",{
//     allArticles : articles
// })
// })


app.listen(3000, ()=>{
    console.log("I am listening in port 3000");
});

//post add something
//put patch modify
//delet 
//default reqest --> get
//what u need to give to the client is the localhost "position" , port,path, request