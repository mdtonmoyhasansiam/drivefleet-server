import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import {
  MongoClient,
  ServerApiVersion,
  ObjectId,
} from "mongodb";

import { toNodeHandler } from "better-auth/node";

import { createAuth } from "./auth.js";

const app = express();

const port =
  process.env.PORT || 5000;

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

app.options(
  "*",
  cors(corsOptions)
);

app.use(express.json());

app.use(cookieParser());

// ======================================
// MONGODB URI
// ======================================

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t7vxma3.mongodb.net/drivefleetDB?retryWrites=true&w=majority&appName=Cluster0`;

// ======================================
// MONGODB CLIENT
// ======================================

const client =
  new MongoClient(uri, {
    serverApi: {
      version:
        ServerApiVersion.v1,

      strict: true,

      deprecationErrors: true,
    },
  });

// ======================================
// JWT VERIFY
// ======================================

const verifyToken = (
  req,
  res,
  next
) => {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {

    return res.status(401).send({
      message:
        "Unauthorized Access",
    });
  }

  const token =
    authHeader.split(" ")[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET,

    (error, decoded) => {

      if (error) {

        return res.status(401).send({
          message:
            "Unauthorized Access",
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

    console.log(
      "MongoDB Connected"
    );

    const database =
      client.db(
        "drivefleetDB"
      );

    const auth =
      createAuth(database);

    // temporary debug route

    app.get("/check-google", (req, res) => {
      res.send({
        clientId: !!process.env.GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        betterAuthUrl: process.env.BETTER_AUTH_URL,
      });
    });

    // app.all(
    //   "/api/auth/*",
    //   toNodeHandler(auth)
    // );

    // app.use(
    //   "/api/auth",
    //   toNodeHandler(auth)
    // );

    // app.all("/api/auth/*", async (req, res) => {
    //   console.log("AUTH ROUTE HIT:", req.originalUrl);

    //   const handler = toNodeHandler(auth);

    //   return handler(req, res);
    // });

    app.all(
      "/api/auth/*",
      toNodeHandler(auth)
    );

    app.get("/check-auth", (req, res) => {
      res.send("CHECK AUTH OK");
    });

    app.get(
      "/test-google",
      async (req, res) => {
        res.send("Google Route Test");
      }
    );

    app.get(
      "/test-auth",
      (req, res) => {

        res.send(
          "Auth Route Loaded"
        );
      }
    );

    // app.all("/api/auth/*", async (req, res) => {
    //   const handler =
    //     toNodeHandler(auth);

    //   return handler(req, res);
    // });

    // const database =
    //   client.db(
    //     "drivefleetDB"
    //   );

    // const auth =
    //   createAuth(database);

    // app.all(
    //   "/api/auth/*",
    //   toNodeHandler(auth)
    // );

    const carsCollection =
      database.collection(
        "cars"
      );

    const bookingsCollection =
      database.collection(
        "bookings"
      );

    const usersCollection =
      database.collection(
        "users"
      );

    // ======================================
    // HOME
    // ======================================

    app.get(
      "/",
      async (req, res) => {

        res.send(
          "Server is running"
        );
      }
    );

    // ======================================
    // REGISTER USER
    // ======================================

    app.post(
      "/register",

      async (req, res) => {

        try {

          const {
            name,
            email,
            password,
            photo,
          } = req.body;

          const existingUser =
            await usersCollection.findOne({
              email,
            });

          if (existingUser) {

            return res.status(400).send({
              message:
                "User already exists",
            });
          }

          const user = {
            name,
            email,
            photo,
            password,
          };

          await usersCollection.insertOne(
            user
          );

          res.send({
            success: true,
            message:
              "Registration Successful",
          });

        } catch (error) {

          console.log(error);

          res.status(500).send({
            message:
              "Registration Failed",
          });
        }
      }
    );

    // ======================================
    // LOGIN USER
    // ======================================

    app.post(
      "/login",

      async (req, res) => {

        try {

          const {
            email,
            password,
          } = req.body;

          const user =
            await usersCollection.findOne({
              email,
            });

          if (!user) {

            return res.status(401).send({
              message:
                "Invalid Email",
            });
          }

          if (
            user.password !==
            password
          ) {

            return res.status(401).send({
              message:
                "Invalid Password",
            });
          }

          const token =
            jwt.sign(
              {
                email:
                  user.email,

                displayName:
                  user.name,

                photoURL:
                  user.photo,
              },

              process.env.JWT_SECRET,

              {
                expiresIn:
                  "7d",
              }
            );

          res.send({
            success: true,
            token,
          });

        } catch (error) {

          console.log(error);

          res.status(500).send({
            message:
              "Login Failed",
          });
        }
      }
    );

    // ======================================
    // GOOGLE LOGIN
    // ======================================

    // app.get(
    //   "/auth/google",

    //   passport.authenticate(
    //     "google",
    //     {
    //       scope: [
    //         "profile",
    //         "email",
    //       ],
    //     }
    //   )
    // );

    // ======================================
    // GOOGLE CALLBACK
    // ======================================

    // app.get(
    //   "/auth/google/callback",

    //   passport.authenticate(
    //     "google",
    //     {
    //       failureRedirect:
    //         "/login",

    //       session: false,
    //     }
    //   ),

    //   async (
    //     req,
    //     res
    //   ) => {

    //     try {

    //       const user =
    //         req.user;

    //       // CHECK USER

    //       const existingUser =
    //         await usersCollection.findOne({
    //           email:
    //             user.email,
    //         });

    //       // SAVE USER IF NOT EXISTS

    //       if (!existingUser) {

    //         await usersCollection.insertOne({
    //           name:
    //             user.name,

    //           email:
    //             user.email,

    //           photo:
    //             user.image,
    //         });
    //       }

    //       // JWT TOKEN

    //       const token =
    //         jwt.sign(
    //           {
    //             email:
    //               user.email,

    //             displayName:
    //               user.name,

    //             photoURL:
    //               user.image,
    //           },

    //           process.env.JWT_SECRET,

    //           {
    //             expiresIn:
    //               "7d",
    //           }
    //         );

    //       res.redirect(
    //         `${process.env.CLIENT_URL}/social-login?token=${token}`
    //       );

    //     } catch (error) {

    //       console.log(error);

    //       res.redirect(
    //         `${process.env.CLIENT_URL}/login`
    //       );
    //     }
    //   }
    // );

    // ======================================
    // FEATURED CARS
    // ======================================

    app.get(
      "/featured-cars",

      async (
        req,
        res
      ) => {

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

          res.send(
            result
          );

        } catch (error) {

          res.status(500).send({
            message:
              "Failed to fetch featured cars",
          });
        }
      }
    );

    // ======================================
    // GET ALL CARS
    // ======================================

    app.get(
      "/cars",

      async (
        req,
        res
      ) => {

        try {

          const result =
            await carsCollection
              .find()
              .toArray();

          res.send(
            result
          );

        } catch (error) {

          res.status(500).send({
            message:
              "Failed to fetch cars",
          });
        }
      }
    );

    // ======================================
    // CAR DETAILS
    // ======================================

    app.get(
      "/cars/:id",

      async (
        req,
        res
      ) => {

        try {

          const id =
            req.params.id;

          const query = {
            _id:
              new ObjectId(
                id
              ),
          };

          const result =
            await carsCollection.findOne(
              query
            );

          res.send(
            result
          );

        } catch (error) {

          res.status(500).send({
            message:
              "Failed to fetch car details",
          });
        }
      }
    );

    // ======================================
    // ADD CAR
    // ======================================

    // app.post(
    //   "/add-car",

    //   verifyToken,

    //   async (
    //     req,
    //     res
    //   ) => {

    app.post(
      "/add-car",

      async (req, res) => {

        try {

          const car =
            req.body;

          const result =
            await carsCollection.insertOne(
              car
            );

          res.send(
            result
          );

        } catch (error) {

          res.status(500).send({
            message:
              "Failed to add car",
          });
        }
      }
    );

    // ======================================
    // MY CARS
    // ======================================

    app.get(
      "/my-cars/:email",

      // verifyToken,

      async (
        req,
        res
      ) => {

        try {

          const email =
            req.params.email;

          // if (
          //   req.decoded.email !==
          //   email
          // ) {

          //   return res.status(403).send({
          //     message:
          //       "Forbidden Access",
          //   });
          // }

          const query = {
            userEmail:
              email,
          };

          const result =
            await carsCollection
              .find(query)
              .toArray();

          res.send(
            result
          );

        } catch (error) {

          console.log(error);

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

      // verifyToken,

      async (
        req,
        res
      ) => {

        try {

          const id =
            req.params.id;

          const updatedData =
            req.body;

          const query = {
            _id:
              new ObjectId(
                id
              ),
          };

          const updatedDoc = {
            $set:
              updatedData,
          };

          const result =
            await carsCollection.updateOne(
              query,
              updatedDoc
            );

          res.send(
            result
          );

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

      // verifyToken,

      async (
        req,
        res
      ) => {

        try {

          const id =
            req.params.id;

          const query = {
            _id:
              new ObjectId(
                id
              ),
          };

          const result =
            await carsCollection.deleteOne(
              query
            );

          res.send(
            result
          );

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

    // app.post(
    //   "/bookings",

    //   verifyToken,

    //   async (
    //     req,
    //     res
    //   ) => {

    app.post(
      "/bookings",

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

          res.send(
            result
          );

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

      // verifyToken,

      async (
        req,
        res
      ) => {

        try {

          const email =
            req.params.email;

          // if (
          //   req.decoded.email !==
          //   email
          // ) {

          //   return res.status(403).send({
          //     message:
          //       "Forbidden Access",
          //   });
          // }

          const query = {
            userEmail:
              email,
          };

          const result =
            await bookingsCollection
              .find(query)
              .toArray();

          res.send(
            result
          );

        } catch (error) {

          console.log(error);

          res.status(500).send({
            message:
              "Failed to fetch bookings",
          });
        }
      }
    );

    // ======================================
    // SEARCH CARS
    // ======================================

    app.get(
      "/search-cars",

      async (
        req,
        res
      ) => {

        try {

          const search =
            req.query.search ||
            "";

          const type =
            req.query.type ||
            "";

          let query = {};

          if (search) {

            query.carName = {
              $regex:
                search,

              $options:
                "i",
            };
          }

          if (type) {

            query.carType =
              type;
          }

          const result =
            await carsCollection
              .find(query)
              .toArray();

          res.send(
            result
          );

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

app.listen(
  port,
  () => {

    console.log(
      `Server running on port ${port}`
    );
  }
);