import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./db/db.js";
import staffRoutes from "./routes/staffRoutes.js";
import { errorHandler } from "./error.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import session from "express-session";
import residentRoutes from "./routes/residentRoutes.js";
import groupHomeRoutes from "./routes/grouphomeRoutes.js";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const port = process.env.PORT || 3001;
dotenv.config();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.set("db", db);
app.use(cookieParser());
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not defined in environment variables.");
}
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

//routes
app.use("/api/staff-route", staffRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resident-route", residentRoutes);
app.use("/api/grouphome-route", groupHomeRoutes);
app.use("/api/task-route", taskRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
app.use(errorHandler);
