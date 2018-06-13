const router = require('express').Router();
const validation = require('../lib/validation');
const auth = require('../lib/auth')

exports.router = router;

const reviewSchema = {
  userid: { required: true },
  driverid: { required: true },
  rideid: { required: true },
  stars: { required: true },
  description: { required: false }
}

//Route to grab all of the tests

router.get('/', function(req, res) {
  if (req.query.user) {
    mysqlPool.query("SELECT * FROM reviews WHERE UserID=?",[req.query.user], function (err, result) {
      res.status(200).send(result)
    });
  } else {
    mysqlPool.query("SELECT * FROM reviews", function (err, result) {
      res.status(200).send(result)
    });
  }
});

router.get("/:reviewid", function(req,res) {
  mysqlPool.query("SELECT * FROM reviews WHERE ReviewID=?",[req.params.reviewid], function (err, result) {
    res.status(200).send(result)
  });
})

router.post("/", function(req,res) {
  if(validation.validateAgainstSchema(req.body, reviewSchema) && req.body.description) {
    mysqlPool.query('INSERT INTO reviews (UserID, DriverID, RideID, Stars, Description) VALUES (?, ?, ?, ?, ?);',[req.body.UserID, req.body.DriverID, req.body.RideID, req.body.stars, req.body.description], function (err, result) {
      if (err) {
        res.status(400).json({
          "error": err
        })
      } else
        res.status(201).send();
    });
  } else if(validation.validateAgainstSchema(req.body, reviewSchema)) {
    mysqlPool.query('INSERT INTO reviews (UserID, DriverID, RideID, Stars) VALUES (?, ?, ?, ?);',[req.body.UserID, req.body.DriverID, req.body.RideID, req.body.stars], function (err, result) {
      if (err) {
        res.status(400).json({
          "error": err
        })
      } else
        res.status(201).send();
    });
  } else
    res.status(400).json({
      err: "body is not a valid review object"
    })
})

router.put('/:reviewID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const reviewID = parseInt(req.params.reviewID);
  requireAuthentication(req,res,function() {
    if(validation.validateAgainstSchema(req.body, reviewSchema) && req.body.description) {
      mysqlPool.query("UPDATE reviews SET ? WHERE reviewid = ?", [ req.body, reviewID ], function (err, result) {
        if (err) {
          res.status(500).json({
            "error": err
          })
        } else {
          res.status(201).json({
            links: {
              business: `/reviews/${reviewID}`
            }
          });
        }
      });
    } else {
      res.status(400).json({
        error: "Request body is not a valid review object"
      });
    }
  });
});

router.delete('/:reviewID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const reviewID = parseInt(req.params.reviewID);
  requireAuthentication(req,res,function() {
    mysqlPool.query("DELETE reviews WHERE reviewid = ?", [ req.body, reviewID ], function (err, result) {
        if (err) {
          res.status(500).json({
            "error": err
          })
        } else {
          res.status(200).send()
        }
      });
  });
});