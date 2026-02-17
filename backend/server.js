import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/mongoDB.js";
import devRouter from "./routes/devRouter.js";
import createrRouter from "./routes/createrRouter.js";

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://pdms-admin.vercel.app",
  "https://pdms-creater.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
// --------------------------

app.use(express.json());

await connectDB();

app.get("/", (req, res) => {
  res.send("CDMS Server is walking");
});

app.use("/api/dev", devRouter);
app.use("/api/creater", createrRouter);

app.listen(PORT, () => {
  console.log(`Server is flying on port ${PORT}`);
});
