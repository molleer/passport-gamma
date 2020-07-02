const FacebookStrategy = require("passport-facebook");

module.exports = {
    init(passport) {
        var strategy = new FacebookStrategy(
            {
                clientID: process.env.clientID,
                clientSecret: process.env.clientSecret,
                callbackURL: process.env.callbackURL,
                profileFields: ["id"]
            },
            (accessToken, refreshToken, profile, cb) => {
                console.log("Verifying");
                console.log(profile);
                cb(null, profile);
            }
        );

        passport.use(strategy);
        passport.serializeUser(function (user, cb) {
            cb(null, user);
        });

        passport.deserializeUser(function (obj, cb) {
            cb(null, obj);
        });
    }
};
