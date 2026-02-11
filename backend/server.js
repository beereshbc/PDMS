import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/mongoDB.js";
import devRouter from "./routes/devRouter.js";
import createrRouter from "./routes/createrRouter.js";
const app = express();

const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
await connectDB();

app.get("/", (req, res) => {
  res.send("CDMS Server is walking");
});

app.use("/api/dev", devRouter);
app.use("/api/creater", createrRouter);

app.listen(PORT, (req, res) => {
  console.log(`Server is flying on port ${PORT}`);
});
