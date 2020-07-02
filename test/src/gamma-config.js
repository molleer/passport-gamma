const GammaStrategy = require("./strategies/gamma/strategy");

module.exports = {
    init(passport) {
        var strategy = new GammaStrategy(
            {
                authorizationURL: "http://localhost/api/oauth/authorize",
                tokenURL: "http://localhost/api/oauth/token",
                profileURL: "http://localhost/api/users/me",
                clientID: "id",
                clientSecret: "secret",
                callbackURL: "http://localhost:3001/auth/callback"
            },
            (accessToken, profile, cb) => {
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
