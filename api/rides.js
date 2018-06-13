const router = require('express').Router();
const validation = require('../lib/validation');
const auth = require('../lib/auth')

exports.router = router;

const rideSchema = {
  driverid: { required: true },
  price: { required: true },
  cardescription: { required: true },
  departureid: { required: true },
  passengers: {required: false},
  cities: {required:true}
}

//Route to grab all of the tests

function getPassengersByRideID(rideID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT UserID FROM CurrentPassengers WHERE RideID = ?',
      [ rideID ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function getCitiesByRideID(rideID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT CityID FROM CitiesPassedThrough WHERE RideID = ?',
      [ rideID ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function getRideByID(rideID, mysqlPool) {
  /*
   * Execute three sequential queries to get all of the info about the
   * specified business, including its reviews and photos.  If the original
   * request to fetch the business doesn't match a business, send null through
   * the promise chain.
   */
  let returnride = {};
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT * FROM rides WHERE RideID = ?', [ rideID ], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  }).then((ride) => {
    if (ride) {
      returnride = ride;
      return getPassengersByRideID(rideID, mysqlPool);
    } else {
      return Promise.resolve(null);
    }
  }).then((passengers) => {
    if (passengers) {
      var returnpassengers = [];
      console.log("passengers = ", passengers)
      for (p in passengers) {
        console.log("p = ", p)
        returnpassengers.push(passengers[p]["UserID"])
      }
      returnride.passengers = returnpassengers
      return getCitiesByRideID(rideID, mysqlPool);
    } else {
      return Promise.resolve(null);
    }
  }).then((cities) => {
    if (cities) {
      var returncities = [];
      console.log("cities = ", cities)
      for (c in cities) {
        console.log("c = ", c)
        returncities.push(cities[c]["CityID"])
      }
      returnride.cities = returncities;
      return Promise.resolve(returnride);
    } else {
      return Promise.resolve(null);
    }
  })
}

async function getRidesWrapper(rides, mysqlPool) {
  var rideResult = []
  try {
    for (let r of rides) {
      console.log(r.RideID)
      rideResult.push(await getRideByID(r.RideID,mysqlPool))
    }
    return rideResult
  } catch(err) {
    console.log(err)
    throw err
  }
}

router.get('/', function(req, res) {
  const mysqlPool = req.app.locals.mysqlPool;
  if (req.query.arrivalCity && req.query.departCity) {
    mysqlPool.query("SELECT rides.RideID FROM rides INNER JOIN CitiesPassedThrough on rides.rideID = CitiesPassedThrough.rideID WHERE DepartureID = ? AND CityID = ?",[req.query.departCity,req.query.arrivalCity], function (err, result) {
      if (err) {
        res.status(500).json({
          "error": err
        })
        return 0
      } else {
        rides = result;
        console.log(rides)
        getRidesWrapper(rides, mysqlPool)
        .then( rideResult => {
          res.status(200).json(rideResult)
        })
        .catch( err => {
          res.status(500).json({
            "error": err
          })
        })
      }
    });
  } else {
    res.status(400).json({
      "err": "You need an arrival and a departure city "
    })
  }
});

router.get("/:rideid", function(req,res) {
  const mysqlPool = req.app.locals.mysqlPool;
  getRideByID(req.params.rideid, mysqlPool)
  .then( rideResult => {
    res.status(200).json(rideResult)
  })
  .catch( err => {
    res.status(500).json({
      "error": err
    })
  })
})

router.post("/", function(req,res) {
  const mysqlPool = req.app.locals.mysqlPool;
  if(validation.validateAgainstSchema(req.body, rideSchema)) {
    mysqlPool.query('INSERT INTO rides (DriverID, price, CarDescription, DepartureID) VALUES (?, ?, ?, ?);',[req.body.driverid, req.body.price, req.body.cardescription, req.body.departureid], function (err, result) {
      if (err) {
        res.status(400).json({
          "error": err
        })
      } else {
        var rideID = result.insertId
        var values = []
        for (let c in req.body.cities) {
          console.log(c)
          values.push([req.body.cities[c],rideID])
        }
          mysqlPool.query('INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES ?', [values], function (err, result) {
            if (err) {
              res.status(400).json({
                "error": err
              })
            } else {
              values = []
              console.log(req.body.passengers)
              for (let p in req.body.passengers) {
                console.log(p)
                values.push([req.body.passengers[p],rideID])
              }
              console.log(values)
              if (values.length != 0) {
                mysqlPool.query('INSERT INTO CurrentPassengers (UserID, RideID) VALUES ? ', [values], function (err, result) {
                  if (err) {
                    res.status(400).json({
                      "error": err
                    });
                  } else {
                    res.status(201).json({
                      "link": "/rides/" + rideID
                    })
                  }
                })
              } else {
                res.status(201).json({
                  "link": "/rides/" + rideID
                })
              }
            }
          }) 
      }
    });
  } else
      res.status(400).json({
        err: "body is not a valid review object"
      })
  })

router.put('/:rideID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const rideID = parseInt(req.params.rideID);
  requireAuthentication(req,res,function() {
    if(validation.validateAgainstSchema(req.body, rideSchema)) {
      mysqlPool.query('UPDATE rides ? WHERE RideID=?',[[req.body.driverid, req.body.price, req.body.cardescription, req.body.departureid], rideID], function (err, result) {
        if (err) {
          res.status(400).json({
            "error": err
          })
        } else {
          var values = []
          for (let c in req.body.cities) {
            console.log(c)
            values.push([req.body.cities[c],rideID])
          }
            mysqlPool.query('UPDATE CitiesPassedThrough ? WHERE RideID=?', [values, rideID], function (err, result) {
              if (err) {
                res.status(400).json({
                  "error": err
                })
              } else {
                values = []
                console.log(req.body.passengers)
                for (let p in req.body.passengers) {
                  console.log(p)
                  values.push([req.body.passengers[p],rideID])
                }
                console.log(values)
                if (values.length != 0) {
                  mysqlPool.query('UPDATE CurrentPassengers ? WHERE ? ', [values,rideID], function (err, result) {
                    if (err) {
                      res.status(400).json({
                        "error": err
                      });
                    } else {
                      res.status(201).json({
                        "link": "/rides/" + rideID
                      })
                    }
                  })
                } else {
                  res.status(201).json({
                    "link": "/rides/" + rideID
                  })
                }
              }
            }) 
        }
      });
    } else
      res.status(400).json({
        err: "body is not a valid review object"
      })
  });
});

router.delete('/:userID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const rideID = parseInt(req.params.reviewID);
  requireAuthentication(req,res,function() {
    mysqlPool.query("DELETE rides WHERE RideID = ?", [rideID], function (err, result) {
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