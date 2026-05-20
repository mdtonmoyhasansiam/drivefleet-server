const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
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


// JWT VERIFY MIDDLEWARE
const verifyToken = (req, res, next) => {

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (error, decoded) => {

      if (error) {
        return res.status(401).send({
          message: "Unauthorized Access",
        });
      }

      req.decoded = decoded;

      next();
    }
  );
};


async function run() {

  try {

    await client.connect();

    const database = client.db("drivefleetDB");

    const carsCollection =
      database.collection("cars");

    const bookingsCollection =
      database.collection("bookings");



    // HOME ROUTE
    app.get("/", (req, res) => {
      res.send("Server is running");
    });



    // JWT TOKEN CREATE
    app.post("/jwt", async (req, res) => {

      const user = req.body;

      const token = jwt.sign(
        user,
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
        })
        .send({
          success: true,
        });
    });



    // LOGOUT
    app.post("/logout", async (req, res) => {

      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
        })
        .send({
          success: true,
        });
    });



    // GET ALL CARS
    app.get("/cars", async (req, res) => {

      const result = await carsCollection
        .find()
        .toArray();

      res.send(result);
    });



    // PRIVATE ROUTE TEST
    app.get(
      "/private",
      verifyToken,
      async (req, res) => {

        res.send({
          success: true,
          message: "Private Route Access Success",
        });
      }
    );



    console.log("MongoDB Connected");

  } finally {

  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});