const jwt = require('jsonwebtoken');


function generateAuthToken(userID) {
  return new Promise((resolve, reject) => {
    const payload = { sub: userID };
    jwt.sign(payload, userID, { expiresIn: '24h' }, function (err, token) {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
}

function requireAuthentication (req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');
  const userID = req.params.userID;
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;
  jwt.verify(token, userID, function (err, payload) {
    if (!err && payload.sub == userID ) {
      req.user = payload.sub;
      next();
    } else {
      res.status(401).json({
        error: "Invalid authentication token"
      });
    }
  });
}

exports.generateAuthToken = generateAuthToken;
exports.requireAuthentication = requireAuthentication;
