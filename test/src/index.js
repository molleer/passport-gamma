//Sets process.env to the variables in .env
if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const passport = require("passport");
const { init } = require("./facebook-config");
const session = require("express-session");

//Creates the express app
const app = express();

//Inits passport with the facebook strategy
init(passport);

//Sets up required middleware
app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);
app.use(passport.initialize());
app.use(passport.session());

//Checks if user is authenticated
const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect("/facebook/login");
};

//Normal endpoint without authentication
app.get("/", (req, res) => {
    res.json("Hello there");
    res.status(200).end();
});

//Normal endpoint with authentication
app.get("/protected", checkAuth, (req, res) => {
    res.json({ Message: "Protected endpoint", userId: req.user.id });
    res.status(200).end();
});

//Redirects user to facebook login
app.get("/facebook/login", passport.authenticate("facebook"));

//Authenticates user when the user is returned from
app.get(
    "/facebook/auth/callback",
    passport.authenticate("facebook", { failureRedirect: "/" }),
    function (req, res) {
        // Successful authentication, redirect home.

        console.log("Successful login");
        res.redirect("/");
    }
);

app.listen(3001);
