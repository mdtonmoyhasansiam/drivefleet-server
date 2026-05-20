const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t7vxma3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {

    await client.connect();

    const database = client.db("drivefleetDB");

    const carsCollection =
      database.collection("cars");

    const bookingsCollection =
      database.collection("bookings");

    app.get("/", (req, res) => {
      res.send("Server is running");
    });

    app.get("/cars", async (req, res) => {
      const result = await carsCollection
        .find()
        .toArray();

      res.send(result);
    });

    console.log("MongoDB Connected");

  } finally {

  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});