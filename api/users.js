const router = require('express').Router();
const bcrypt = require('bcryptjs');
const ObjectId = require('mongodb').ObjectId;

const { generateAuthToken, requireAuthentication } = require('../lib/auth');

function validateUserObject(user) {
  return user && user.username && user.password;
}

function getDateString() {
  const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
  var today = new Date();
  var dateString = monthNames[today.getMonth()] + " " + today.getFullYear();
  return dateString;
}

function insertNewUser(user, mongoDB) {
  return bcrypt.hash(user.password, 8)
    .then((passwordHash) => {
      var randomRating = Math.floor(Math.random() * 6);
      var joinDateString = getDateString();
      var isVerified = false;
      if (user.phone || user.email) {
        isVerified = true;
      }
      const userDocument = {
        username: user.username,
        password: passwordHash,
        email: user.email,
        phone: user.phone,
        rating: randomRating,
        joinDate: joinDateString,
        verified: isVerified,
        admin: false
      };
      const usersCollection = mongoDB.collection('users');
      return usersCollection.insertOne(userDocument);
    })
    .then((result) => {
      return Promise.resolve(result.insertedId);
    });
}

router.post('/', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  if (validateUserObject(req.body)) {
    insertNewUser(req.body, mongoDB)
      .then((id) => {
        res.status(201).json({
          _id: id,
          links: {
            user: `/users/${id}`
          }
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "Failed to insert new user."
        });
      });
  } else {
    res.status(400).json({
      error: "Request doesn't contain a valid user."
    })
  }
});

router.get('/', function (req, res) {
  console.log("lol");
  res.send("lol");
});










exports.router = router;
