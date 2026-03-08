import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/mongoDB.js";
import devRouter from "./routes/devRouter.js";
import createrRouter from "./routes/createrRouter.js";
import cdCreaterRouter from "./routes/cdCreaterRouter.js";
import adminRouter from "./routes/adminRouter.js";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://pdms-creater.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // FIX IS HERE: Added "devtoken" to the list
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "creatertoken",
      "token",
      "admintoken",
      "devtoken",
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

await connectDB();

app.get("/", (req, res) => {
  res.send("CDMS Server is active and flying.");
});

app.use("/api/dev", devRouter);
app.use("/api/creater", createrRouter);
app.use("/api/creater/cd", cdCreaterRouter);
app.use("/api/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`Server is flying on port ${PORT}`);
});
