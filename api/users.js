const router = require('express').Router();
const bcrypt = require('bcryptjs');
const ObjectId = require('mongodb').ObjectId;

const { generateAuthToken, requireAuthentication } = require('../lib/auth');

// Helper Functions ///////////////////////////////////////////////////////////
function validateUserObject(user) {
  return user && user.username && user.password;
}

function validateUserObjectForModifying(user) {
  return user && (user.username || user.password || user.email || user.phone);
}

function getDateString() {
  const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
  var today = new Date();
  var dateString = monthNames[today.getMonth()] + " " + today.getFullYear();
  return dateString;
}

function getUserByUsername(username, mongoDB, includePassword) {
  const usersCollection = mongoDB.collection('users');
  const projection = includePassword ? {} : { password: 0 };
  return usersCollection
    .find({ username: username })
    .project(projection)
    .toArray()
    .then((results) => {
      return Promise.resolve(results[0]);
    });
}

function getUserByID(userID, mongoDB, includePassword) {
  const usersCollection = mongoDB.collection('users');
  const projection = includePassword ? {} : { password: 0 };
  return usersCollection
    .find({ _id: ObjectId(userID) })
    .project(projection)
    .toArray()
    .then((results) => {
      return Promise.resolve(results[0]);
    });
}

function getAllUsers(mongoDB) {
  const usersCollection = mongoDB.collection('users');
  return usersCollection
    .find({})
    .toArray()
    .then((results) => {
      return Promise.resolve(results);
    });
}

function getUserAdminStatus(userID, mongoDB) {
  const usersCollection = mongoDB.collection('users');
  const projection = { admin: 1 };
  return usersCollection
    .find({ _id: ObjectId(userID) })
    .project(projection)
    .toArray()
    .then((results) => {
      return Promise.resolve(results[0]);
    });
}

///////////////////////////////////////////////////////////////////////////////
// Add a User /////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////
// Login //////////////////////////////////////////////////////////////////////
router.post('/login', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  if (req.body && req.body.username && req.body.password) {
    var userID = {};
    getUserByUsername(req.body.username, mongoDB, true)
      .then((user) => {
        if (user) {
          userID = user._id;
          return bcrypt.compare(req.body.password, user.password);
        } else {
          return Promise.reject(401);
        }
      })
      .then((loginSuccessful) => {
        if (loginSuccessful) {
          return generateAuthToken(userID);
        } else {
          return Promise.reject(401);
        }
      })
      .then((token) => {
        res.status(200).json({
          token: token
        });
      })
      .catch((err) => {
        console.log(err);
        if (err === 401) {
          res.status(401).json({
            error: "Invalid credentials."
          });
        } else {
          res.status(500).json({
            error: "Failed to fetch user."
          });
        }
      });
  } else {
    res.status(400).json({
      error: "Request needs a username and password."
    })
  }
});

///////////////////////////////////////////////////////////////////////////////
// Get a User /////////////////////////////////////////////////////////////////
router.get('/:userID', requireAuthentication, function (req, res, next) {
  const mongoDB = req.app.locals.mongoDB;
  getUserAdminStatus(req.user, mongoDB)
    .then((requestedByAdmin) => {
      if ((req.user !== req.params.userID) && !(requestedByAdmin.admin)) {
        res.status(403).json({
          error: "Unauthorized to access that resource"
        });
      } else {
        getUserByID(req.params.userID, mongoDB, false)
          .then((user) => {
            if (user) {
              res.status(200).json(user);
            } else {
              next();
            }
          })
          .catch((err) => {
            res.status(500).json({
              error: "Failed to fetch user."
            });
          });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to fetch user."
      });
    });
});

///////////////////////////////////////////////////////////////////////////////
// Get all Users //////////////////////////////////////////////////////////////
router.get('/', requireAuthentication, function (req, res, next) {
  const mongoDB = req.app.locals.mongoDB;
  getUserAdminStatus(req.user, mongoDB)
    .then((requestedByAdmin) => {
      if ((req.user !== req.params.userID) && !(requestedByAdmin.admin)) {
        res.status(403).json({
          error: "Unauthorized to access that resource"
        });
      } else {
        getAllUsers(mongoDB)
          .then((user) => {
            if (user) {
              res.status(200).json(user);
            } else {
              next();
            }
          })
          .catch((err) => {
            res.status(500).json({
              error: "Failed to fetch users."
            });
          });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to verify authorization."
      });
    });
});

///////////////////////////////////////////////////////////////////////////////
// Modify a User //////////////////////////////////////////////////////////////
function modifyUser(userID, user, mongoDB) {
  var newPassword;
  if (user.password) {
    newPassword = user.password;
  } else {
    newPassword = "";
  }
  return bcrypt.hash(newPassword, 8)
    .then((passwordHash) => {
      userDocument = {};
      if (user.phone || user.email) {
        userDocument.verified = true;
      }
      if (user.username) {
        userDocument.username = user.username;
      }
      if (user.password) {
        userDocument.password = passwordHash;
      }
      if (user.email) {
        userDocument.email = user.email;
      }
      if (user.phone) {
        userDocument.phone = user.phone;
      }
      const usersCollection = mongoDB.collection('users');
      var query = { _id: ObjectId(userID) };
      var newData = { $set: userDocument };
      return usersCollection.updateOne(query, newData);
    })
    .then((result) => {
      return Promise.resolve(userID);
    });
}

router.put('/:userID', requireAuthentication, function (req, res, next) {
  const mongoDB = req.app.locals.mongoDB;
  getUserAdminStatus(req.user, mongoDB)
    .then((requestedByAdmin) => {
      if ((req.user !== req.params.userID) && !(requestedByAdmin.admin)) {
        res.status(403).json({
          error: "Unauthorized to access that resource"
        });
      } else {
        if (validateUserObjectForModifying(req.body)) {
          modifyUser(req.params.userID, req.body, mongoDB)
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
                error: "Failed to modify user."
              });
            });
        } else {
          res.status(400).json({
            error: "Request doesn't contain valid user data."
          })
        }
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to verify authorization."
      });
    });
});

///////////////////////////////////////////////////////////////////////////////
// Delete a User //////////////////////////////////////////////////////////////
function deleteUser(userID, mongoDB) {
  const usersCollection = mongoDB.collection('users');
  var query = { _id: ObjectId(userID) };
  return usersCollection
    .deleteOne(query)
    .then((result) => {
      return Promise.resolve(result.deletedCount > 0);
    });
}

router.delete('/:userID', requireAuthentication, function (req, res, next) {
  const mongoDB = req.app.locals.mongoDB;
  getUserAdminStatus(req.user, mongoDB)
    .then((requestedByAdmin) => {
      if ((req.user !== req.params.userID) && !(requestedByAdmin.admin)) {
        res.status(403).json({
          error: "Unauthorized to access that resource"
        });
      } else {
        deleteUser(req.params.userID, mongoDB)
          .then((deleteSuccessful) => {
            if (deleteSuccessful) {
              res.status(204).end();
            } else {
              next();
            }
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({
              error: "Failed to modify user."
            });
          });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to verify authorization."
      });
    });
});

///////////////////////////////////////////////////////////////////////////////

exports.router = router;
