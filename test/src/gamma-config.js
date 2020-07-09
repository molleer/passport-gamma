const GammaStrategy = require("passport-gamma").Strategy;
const axios = require("axios");

module.exports = {
    init(passport) {
        var strategy = new GammaStrategy(
            {
                authorizationURL: "http://localhost:8080/api/oauth/authorize",
                tokenURL: "http://localhost:8080/api/oauth/token",
                profileURL: "http://localhost:8080/api/users/me",
                clientID: "id",
                clientSecret: "secret",
                callbackURL: "http://localhost:3001/auth/callback"
            },
            (accessToken, profile, cb) => {
                console.log("Verifying");
                console.log(profile);
                cb(null, { ...profile, accessToken: accessToken });
            }
        );

        passport.use(strategy);
        passport.deserializeUser(async (obj, cb) => {
            console.log("deserializing");
            const res = await axios.get("http://localhost:8080/api/users/me", {
                headers: {
                    Authorization: `Bearer ${obj.accessToken}`
                }
            });

            return cb(null, { ...res.data, accessToken: obj.accessToken });
        });
        passport.serializeUser(function (user, cb) {
            cb(null, { accessToken: user.accessToken });
        });
    }
};
