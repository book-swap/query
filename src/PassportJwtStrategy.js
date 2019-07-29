const JwtStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  issuer: "auth.bookswap",
  audience: "BookSwap"
};

module.exports = new JwtStrategy(opts, (jwtPayload, done) => {
  done(null, true);
});
