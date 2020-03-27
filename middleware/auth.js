const jwt = require('jsonwebtoken');
const config = require('config');
const jwksClient = require('jwks-rsa');
const userService = require('../services/User')

module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const client = jwksClient({
    jwksUri: config.get('discoverJwtTokenUrl')
  });

  // get secret from B2C
  function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
      var signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  }

  // Verify token
  try {
    await jwt.verify(token, getKey, async (error, decoded) => {
      if (error) {
        res.status(401).json({ msg: 'Token is not valid' });
      }
      else {
        // user id is not provided by B2C
        // we need to check if email provided by B2C already exists in db, if not we need to create a new user
        let user = await User.findOne({ email: decoded.emails[0] });
        let curentUserId = 0;

        // if email exists in the database set current user context
        if (user) {
          curentUserId = user._id;
        } else {
          // if email doesn't exists in the db, this means this user access the app for the first time
          // we need to created a new account in the db

          console.log("heres the name" + decoded.name);

          let newUser = await userService.createUser(decoded.name, decoded.emails[0]);
          curentUserId = newUser.id;
        }

        const userContext = {
          id: curentUserId.toString()
        };

        req.user = userContext;

        next();
      }
    });
  } catch (err) {
    console.error('something wrong with auth middleware')
    res.status(500).json({ msg: 'Server Error' });
  }
  console.log("verified")
};
