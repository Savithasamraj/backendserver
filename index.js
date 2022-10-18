const express = require("express");
const app = express();
const cors=require("cors")
const bcrypt=require("bcryptjs")
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config();

const URL = process.env.db;
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
let authenticate = function (request, response, next) {
  if (request.headers.authorization) {
    let verify = jwt.verify(request.headers.authorization, process.env.SECRET);
    console.log(verify);
    if (verify) {
      request.userid = verify.id;

      next();
    } else {
      response.status(401).json({
        message: "Unauthorized",
      });
    }
  } else {
    response.status(401).json({
      message: "Unauthorized",
    });
  }
};
let authenticateUser = function (request, response, next) {
  // console.log(request.headers);
  if (request.headers.authorization) {
    let verify = jwt.verify(
  request.headers.authorization,
      process.env.SECRET 
    );
    console.log(verify);
    if (verify) {
      request.userid = verify.id;
      console.log(request.role);
      if (verify.role === "User") {
        next();
      } else {
        response.status(401).json({
          message: "Unauthorized",
        });
      }
    } else {
      response.status(401).json({
        message: "Unauthorized",
      });
    }
  } else {
    response.status(401).json({
      message: "Unauthorized",
    });
  }
};
let authenticateAdmin = function (request, response, next) {
  // console.log(request.headers);
  if (request.headers.authorization) {
    let verify = jwt.verify(
      request.headers.authorization,
      process.env.SECRET 
    );
    console.log(verify);
    if (verify) {
      request.userid = verify.id;
      console.log(request.role);
      if (verify.role === "Admin") {
        next();
      } else {
        response.status(401).json({
          message: "Unauthorized",
        });
      }
    } else {
      response.status(401).json({
        message: "Unauthorized",
      });
    }
  } else {
    response.status(401).json({
      message: "Unauthorized",
    });
  }
};
app.post("/register",async function (request, response) {
  try {
    console.log(request);
    const connection = await mongoClient.connect(URL);
    const db = connection.db("bookshow");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(request.body.password, salt);
    request.body.password = hash;
     const users=await db.collection("users").insertOne(request.body);
    console.log(users)
    await connection.close();
    response.json({
      message: "User Registered!",
    
    });
  } catch (error) {
    console.log(error);
  }
});
app.post("/", async function (request, response) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("bookshow");
    const user = await db
      .collection("users")
      .findOne({ username: request.body.username });

    if (user) {
      const match = await bcrypt.compare(request.body.password, user.password);
      if (match) {
        //Token
        const token = jwt.sign(
          { id: user._id, username: user.username },
          process.env.SECRET
        );

        response.json({
          message: "Successfully Logged In!!",
          token,
        });
      } else {
        response.json({
          message: "Password is incorrect!!",
        });
      }
    } else {
      response.json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.log(error);
  }
});
app.post("/admin", async function (request, response) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("bookshow");
    request.body.userid = mongodb.ObjectId(request.userid);
    await db.collection("movies").insertOne(request.body);
    await connection.close();
    response.json({
      message: "Movie Added!!",
    });
  } catch (error) {
    console.log(error);
  }
});
app.get("/admin",async function (request, response) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("bookshow");
    let movies = await db
      .collection("movies")
      .find({ userid: mongodb.ObjectId(request.userid) })
      
    await connection.close();
    response.json(movies);
  } catch (error) {
    console.log(error);
  }
});
app.get("/dashboard", async function (request, response) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("bookshow");
    let movies = await db.collection("movies").find().toArray();
    
    await connection.close();
    response.json(movies);
  } catch (error) {
    console.log(error);
  }
  
});
app.put("/admin/:id", authenticateAdmin, async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("bookshow");
    await db
      .collection("movies")
      .updateOne({ _id: mongodb.ObjectId(req.params.id) }, { $set: req.body });
    await connection.close();
    res.json({ message: "Edited Successfully!!" });
  } catch (error) {
    console.log(error);
  }
});
app.delete(
  "/admin/:id",
  authenticateAdmin,
  async function (req, res) {
    try {
      const connection = await mongoClient.connect(URL);
      const db = connection.db("bookMyShow");
      await db
        .collection("movies")
        .deleteOne({ _id: mongodb.ObjectId(req.params.id) });
      await connection.close();
      res.json({ message: "Deleted Successfully!!" });
    } catch (error) {
      console.log(error);
    }
  }
)
app.listen(process.env.PORT||4000);