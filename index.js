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

const port =
  process.env.PORT || 5000;



app.use(
  cors({
    origin: [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t7vxma3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(
  uri,
  {
    serverApi: {
      version:
        ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  }
);



// JWT VERIFY
const verifyToken = (
  req,
  res,
  next
) => {

  const token =
    req.cookies.token;

  if (!token) {

    return res.status(401).send({
      message:
        "Unauthorized Access",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (
      error,
      decoded
    ) => {

      if (error) {

        return res.status(401).send({
          message:
            "Unauthorized Access",
        });
      }

      req.decoded =
        decoded;

      next();
    }
  );
};



async function run() {

  try {

    await client.connect();

    const database =
      client.db(
        "drivefleetDB"
      );

    const carsCollection =
      database.collection(
        "cars"
      );

    const bookingsCollection =
      database.collection(
        "bookings"
      );



    // HOME
    app.get(
      "/",
      async (
        req,
        res
      ) => {

        res.send(
          "Server is running"
        );
      }
    );



    // JWT
    app.post(
      "/jwt",
      async (
        req,
        res
      ) => {

        const user =
          req.body;

        const token =
          jwt.sign(
            user,
            process.env.JWT_SECRET,
            {
              expiresIn:
                "7d",
            }
          );

        res
          .cookie(
            "token",
            token,
            {
              httpOnly: true,

              secure:
                process.env
                  .NODE_ENV ===
                "production",

              sameSite:
                process.env
                  .NODE_ENV ===
                  "production"
                  ? "none"
                  : "lax",
            }
          )
          .send({
            success: true,
          });
      }
    );



    // LOGOUT
    app.post(
      "/logout",
      async (
        req,
        res
      ) => {

        res
          .clearCookie(
            "token",
            {
              httpOnly: true,

              secure:
                process.env
                  .NODE_ENV ===
                "production",

              sameSite:
                process.env
                  .NODE_ENV ===
                  "production"
                  ? "none"
                  : "lax",
            }
          )
          .send({
            success: true,
          });
      }
    );



    // PRIVATE ROUTE
    app.get(
      "/private",
      verifyToken,
      async (
        req,
        res
      ) => {

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

    app.get(
      "/cars",
      async (
        req,
        res
      ) => {

        const result =
          await carsCollection
            .find()
            .toArray();

        res.send(
          result
        );
      }
    );



    // ======================================
    // FEATURED CARS
    // RANDOM 6/9 CARS
    // ======================================

    app.get(
      "/featured-cars",
      async (
        req,
        res
      ) => {

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
      }
    );



    // ======================================
    // ADD CAR
    // ======================================

    app.post(
      "/add-car",
      verifyToken,
      async (
        req,
        res
      ) => {

        const car =
          req.body;

        const result =
          await carsCollection.insertOne(
            car
          );

        res.send(
          result
        );
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
      }
    );



    // ======================================
    // MY CARS
    // ======================================

    app.get(
      "/my-cars/:email",
      verifyToken,
      async (
        req,
        res
      ) => {

        const email =
          req.params.email;

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
      }
    );



    // ======================================
    // UPDATE CAR
    // ======================================

    app.put(
      "/update-car/:id",
      verifyToken,
      async (
        req,
        res
      ) => {

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

        const updatedDoc =
        {
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
      }
    );



    // ======================================
    // DELETE CAR
    // ======================================

    app.delete(
      "/delete-car/:id",
      verifyToken,
      async (
        req,
        res
      ) => {

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
      }
    );



    // ======================================
    // BOOK CAR
    // ======================================

    app.post(
      "/bookings",
      verifyToken,
      async (
        req,
        res
      ) => {

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
      }
    );



    // ======================================
    // MY BOOKINGS
    // ======================================

    app.get(
      "/my-bookings/:email",
      verifyToken,
      async (
        req,
        res
      ) => {

        const email =
          req.params.email;

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
      }
    );



    // ======================================
    // SEARCH + FILTER CARS
    // ======================================

    app.get(
      "/search-cars",
      async (
        req,
        res
      ) => {

        const search =
          req.query
            .search || "";

        const type =
          req.query.type ||
          "";

        let query = {};

        if (search) {

          query.carName =
          {
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
      }
    );

    // INSERT DEMO CARS
    app.get(
      "/add-demo-cars",
      async (req, res) => {

        const demoCars = [

          {
            carName: "BMW X5",
            carType: "SUV",
            dailyRentalPrice: 120,
            image: "https://images.unsplash.com/photo-1555215695-3004980ad54e",
            location: "Dhaka",
            description: "Luxury BMW SUV",
            booking_count: 0,
          },

          {
            carName: "Audi R8",
            carType: "Sports",
            dailyRentalPrice: 180,
            image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
            location: "Chittagong",
            description: "Premium sports car",
            booking_count: 0,
          },

          {
            carName: "Mercedes C300",
            carType: "Luxury",
            dailyRentalPrice: 150,
            image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b",
            location: "Sylhet",
            description: "Elegant luxury sedan",
            booking_count: 0,
          },

          {
            carName: "Tesla Model S",
            carType: "Electric",
            dailyRentalPrice: 170,
            image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89",
            location: "Dhaka",
            description: "Future electric car",
            booking_count: 0,
          },

          {
            carName: "Lamborghini Huracan",
            carType: "Sports",
            dailyRentalPrice: 250,
            image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c",
            location: "Khulna",
            description: "Super fast luxury sports car",
            booking_count: 0,
          },

          {
            carName: "Toyota Prado",
            carType: "SUV",
            dailyRentalPrice: 110,
            image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8",
            location: "Rajshahi",
            description: "Reliable SUV",
            booking_count: 0,
          },

          {
            carName: "Porsche 911",
            carType: "Sports",
            dailyRentalPrice: 220,
            image: "https://images.unsplash.com/photo-1502877338535-766e1452684a",
            location: "Dhaka",
            description: "Legendary sports car",
            booking_count: 0,
          },

          {
            carName: "Range Rover Velar",
            carType: "SUV",
            dailyRentalPrice: 190,
            image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b",
            location: "Barisal",
            description: "Premium SUV",
            booking_count: 0,
          },

          {
            carName: "Ferrari F8",
            carType: "Sports",
            dailyRentalPrice: 300,
            image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d",
            location: "Dhaka",
            description: "Luxury Ferrari sports car",
            booking_count: 0,
          },

          {
            carName: "Honda Civic",
            carType: "Sedan",
            dailyRentalPrice: 80,
            image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
            location: "Comilla",
            description: "Comfortable sedan",
            booking_count: 0,
          },

          {
            carName: "Nissan GTR",
            carType: "Sports",
            dailyRentalPrice: 210,
            image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1",
            location: "Dhaka",
            description: "Iconic sports car",
            booking_count: 0,
          },

          {
            carName: "Chevrolet Camaro",
            carType: "Sports",
            dailyRentalPrice: 160,
            image: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7",
            location: "Khulna",
            description: "Muscle sports car",
            booking_count: 0,
          },

          {
            carName: "Ford Mustang",
            carType: "Sports",
            dailyRentalPrice: 170,
            image: "https://images.unsplash.com/photo-1504215680853-026ed2a45def",
            location: "Dhaka",
            description: "Classic American muscle",
            booking_count: 0,
          },

          {
            carName: "Hyundai Tucson",
            carType: "SUV",
            dailyRentalPrice: 90,
            image: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
            location: "Rangpur",
            description: "Modern SUV",
            booking_count: 0,
          },

          {
            carName: "Kia Sportage",
            carType: "SUV",
            dailyRentalPrice: 95,
            image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
            location: "Dhaka",
            description: "Stylish SUV",
            booking_count: 0,
          },

          {
            carName: "Mazda CX5",
            carType: "SUV",
            dailyRentalPrice: 100,
            image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d",
            location: "Sylhet",
            description: "Smooth driving experience",
            booking_count: 0,
          },

          {
            carName: "Bugatti Chiron",
            carType: "Luxury",
            dailyRentalPrice: 500,
            image: "https://images.unsplash.com/photo-1502877338535-766e1452684a",
            location: "Dhaka",
            description: "Ultimate hypercar",
            booking_count: 0,
          },

          {
            carName: "Rolls Royce Ghost",
            carType: "Luxury",
            dailyRentalPrice: 400,
            image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
            location: "Dhaka",
            description: "Ultra luxury sedan",
            booking_count: 0,
          },

        ];

        const result =
          await carsCollection.insertMany(
            demoCars
          );

        res.send(result);
      }
    );


    console.log(
      "MongoDB Connected"
    );

  } finally {

  }
}

run().catch(
  console.dir
);



app.listen(
  port,
  () => {

    console.log(
      `Server running on port ${port}`
    );
  }
);



module.exports = app;