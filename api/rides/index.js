const router = require('express').Router();
const mysql = require('mysql');
const validation = require('../../lib/validation');


exports.router = router;



const mysqlHost = process.env.MYSQL_HOST;
const mysqlPort = process.env.MYSQL_PORT || '3306';
const mysqlDB = process.env.MYSQL_DATABASE;
const mysqlUser = process.env.MYSQL_USER;
const mysqlPassword = process.env.MYSQL_PASSWORD;

const maxMySQLConnections = 10;
const mysqlPool = mysql.createPool({
  connectionLimit: maxMySQLConnections,
  multipleStatements: true,
  host: mysqlHost,
  port: mysqlPort,
  database: mysqlDB,
  user: mysqlUser,
  password: mysqlPassword
});



//Route to grab all of the tests

router.get('/', function(err, res) {
  mysqlPool.query("SELECT * FROM test", function (err, result) {
  res.send(result)
  });
});
