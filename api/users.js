const router = require('express').Router();
const bcrypt = require('bcryptjs');
const ObjectId = require('mongodb').ObjectId;

const { generateAuthToken, requireAuthentication } = require('../lib/auth');

router.get('/', function (req, res) {
  console.log("lol");
  res.send("lol");
});










exports.router = router;
