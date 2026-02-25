import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/mongoDB.js";
import devRouter from "./routes/devRouter.js";
import createrRouter from "./routes/createrRouter.js";

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Robust CORS to prevent pre-flight blocks
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// 2. High-limit Parsers for JSON/URL-encoded data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Connect to Database
await connectDB();

app.get("/", (req, res) => {
  res.send("CDMS Server is active and flying.");
});

// Routes
app.use("/api/dev", devRouter);
app.use("/api/creater", createrRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is flying on port ${PORT}`);
});
