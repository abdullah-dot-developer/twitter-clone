import express from "express"
import cors from "cors"
import path from "path"

import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import postRoutes from "./routes/post.routes.js"
import notificationRoutes from "./routes/notification.routes.js"

import dotenv from "dotenv"
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

const app = express();
app.use(express.json({ limit: "4mb" }));
app.use(cookieParser())
dotenv.config()
app.use(cors({
    origin: 'http://localhost:3000', // your frontend URL
    credentials: true // allows cookies to be sent with requests
}))
// console.log(process.env.MONGO_URI)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PORT = process.env.PORT;
const __dirname = path.resolve();



app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/notifications", notificationRoutes)
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "frontend", "dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
    })
}

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}!`)
    connectMongoDB();
})