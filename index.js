const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
} = require("mongodb");

require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000;

// ======================================
// CORS CONFIG
// ======================================

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://drivefleet-rouge.vercel.app",
  ],
  credentials: true,
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use(express.json());

app.use(cookieParser());

// ======================================
// MONGODB URI
// ======================================

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mongodb.net/drivefleetDB?retryWrites=true&w=majority&appName=Cluster0`;

// ======================================
// MONGODB CLIENT
// ======================================

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ======================================
// JWT VERIFY
// ======================================

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

// ======================================
// RUN FUNCTION
// ======================================

async function run() {
  try {
    await client.connect();

    console.log("MongoDB Connected");

    const database =
      client.db("drivefleetDB");

    const carsCollection =
      database.collection("cars");

    const bookingsCollection =
      database.collection("bookings");

    // ======================================
    // HOME
    // ======================================

    app.get("/", async (req, res) => {
      res.send("Server is running");
    });

    // ======================================
    // JWT
    // ======================================

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

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite:
            process.env.NODE_ENV ===
            "production"
              ? "none"
              : "lax",
        })
        .send({
          success: true,
        });
    });

    // ======================================
    // LOGOUT
    // ======================================

    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite:
            process.env.NODE_ENV ===
            "production"
              ? "none"
              : "lax",
        })
        .send({
          success: true,
        });
    });

    // ======================================
    // PRIVATE ROUTE
    // ======================================

    app.get(
      "/private",
      verifyToken,
      async (req, res) => {
        res.send({
          success: true,
          message:
            "Private Route Access Success",
        });
      }
    );

    // ======================================
    // GET ALL CARS
    // ======================================

    app.get("/cars", async (req, res) => {
      try {
        const result =
          await carsCollection
            .find()
            .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message:
            "Failed to fetch cars",
        });
      }
    });

    // ======================================
    // FEATURED CARS
    // ======================================

    app.get(
      "/featured-cars",
      async (req, res) => {
        try {
          const result =
            await carsCollection
              .aggregate([
                {
                  $sample: {
                    size: 6,
                  },
                },
              ])
              .toArray();

          res.send(result);
        } catch (error) {
          res.status(500).send({
            message:
              "Failed to fetch featured cars",
          });
        }
      }
    );

    // ======================================
    // ADD CAR
    // ======================================

    app.post(
      "/add-car",
      verifyToken,
      async (req, res) => {
        try {
          const car = req.body;

          const result =
            await carsCollection.insertOne(
              car
            );

          res.send(result);
        } catch (error) {
          res.status(500).send({
            message:
              "Failed to add car",
          });
        }
      }
    );

    // ======================================
    // CAR DETAILS
    // ======================================

    app.get(
      "/cars/:id",
      async (req, res) => {
        try {
          const id =
            req.params.id;

          const query = {
            _id:
              new ObjectId(id),
          };

          const result =
            await carsCollection.findOne(
              query
            );

          res.send(result);
        } catch (error) {
          res.status(500).send({
            message:
              "Failed to fetch car details",
          });
        }
      }
    );

    // ======================================
    // MY CARS
    // ======================================

    app.get(
      "/my-cars/:email",
      verifyToken,
      async (req, res) => {
        try {
          const email =
            req.params.email;

          const query = {
            userEmail: email,
          };

          const result =
            await carsCollection
              .find(query)
              .toArray();

          res.send(result);
        } catch (error) {
          res.status(500).send({
            message:
              "Failed to fetch my cars",
          });
        }
      }
    );

    // ======================================
    // UPDATE CAR
    // ======================================

    app.put(
      "/update-car/:id",
      verifyToken,
      async (req, res) => {
        try {
          const id =
            req.params.id;

          const updatedData =
            req.body;

          const query = {
            _id:
              new ObjectId(id),
          };

          const updatedDoc = {
            $set: updatedData,
          };

          const result =
            await carsCollection.updateOne(
              query,
              updatedDoc
            );

          res.send(result);
        } catch (error) {
          res.status(500).send({
            message:
              "Failed to update car",
          });
        }
      }
    );

    // ======================================
    // DELETE CAR
    // ======================================

    app.delete(
      "/delete-car/:id",
      verifyToken,
      async (req, res) => {
        try {
          const id =
            req.params.id;

          const query = {
            _id:
              new ObjectId(id),
          };

          const result =
            await carsCollection.deleteOne(
              query
            );

          res.send(result);
        } catch (error) {
          res.status(500).send({
            message:
              "Failed to delete car",
          });
        }
      }
    );

    // ======================================
    // BOOK CAR
    // ======================================

    app.post(
      "/bookings",
      verifyToken,
      async (req, res) => {
        try {
          const booking =
            req.body;

          const result =
            await bookingsCollection.insertOne(
              booking
            );

          await carsCollection.updateOne(
            {
              _id:
                new ObjectId(
                  booking.carId
                ),
            },
            {
              $inc: {
                booking_count: 1,
              },
            }
          );

          res.send(result);
        } catch (error) {
          res.status(500).send({
            message:
              "Failed to book car",
          });
        }
      }
    );

    // ======================================
    // MY BOOKINGS
    // ======================================

    app.get(
      "/my-bookings/:email",
      verifyToken,
      async (req, res) => {
        try {
          const email =
            req.params.email;

          const query = {
            userEmail: email,
          };

          const result =
            await bookingsCollection
              .find(query)
              .toArray();

          res.send(result);
        } catch (error) {
          res.status(500).send({
            message:
              "Failed to fetch bookings",
          });
        }
      }
    );

    // ======================================
    // SEARCH + FILTER CARS
    // ======================================

    app.get(
      "/search-cars",
      async (req, res) => {
        try {
          const search =
            req.query.search || "";

          const type =
            req.query.type || "";

          let query = {};

          if (search) {
            query.carName = {
              $regex: search,
              $options: "i",
            };
          }

          if (type) {
            query.carType = type;
          }

          const result =
            await carsCollection
              .find(query)
              .toArray();

          res.send(result);
        } catch (error) {
          res.status(500).send({
            message:
              "Failed to search cars",
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
}

run().catch(console.dir);

// ======================================
// SERVER LISTEN
// ======================================

app.listen(port, () => {
  console.log(
    `Server running on port ${port}`
  );
});

module.exports = app;