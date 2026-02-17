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
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
  console.log(`Server is flying on p0rt ${PORT}`);
});
