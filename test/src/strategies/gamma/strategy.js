// Load modules.
const axios = require("axios");
const querystring = require("querystring");
var Base64 = require("js-base64").Base64;

/**
 * `Strategy` constructor.
 *
 * Options:
 *   - `clientID`      the application's App ID
 *   - `clientSecret`  the application's App Secret
 *   - `callbackURL`   URL to which Gamma will redirect the user after granting authorization
 *
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
    options = options || {};

    options.authorizationURL =
        options.authorizationURL ||
        "https://gamma.chalmers.it/api/oauth/authorize";
    options.tokenURL =
        options.tokenURL || "https://gamma.chalmers.it/api/oauth/token";
    options.scopeSeparator = options.scopeSeparator || " ";

    this._verify = verify;
    this._options = options;
    this.name = "gamma";
    this._profileURL =
        options.profileURL || "https://gamma.chalmers.it/api/users/me";
    this._clientID = options.clientID;
    this._clientSecret = options.clientSecret;
    this._callbackURL = options.callbackURL;
}

/**
 * Authenticate request by delegating to Gamma using OAuth 2.0.
 *
 * @param {http.IncomingMessage} req
 * @param {object} options
 * @access protected
 */
Strategy.prototype.authenticate = function (req, options) {
    if (req.query && req.query.error) {
        return this.error(req.query.error_description);
    }

    if (req.query && req.query.code) {
        this._exchange(req.query.code)
            .then(res =>
                this.userProfile(res.data.access_token, (err, user) => {
                    if (err) {
                        this.fail(err);
                        return;
                    }

                    this._verify(
                        res.data.access_token,
                        user,
                        (error, profile) => {
                            if (error) {
                                this.fail(err);
                                return;
                            }
                            this.success(profile, null);
                        }
                    );
                })
            )
            .catch(err => this.error(err));
        return;
    }

    var uri = new URL(this._options.authorizationURL);
    uri.searchParams.append("response_type", "code");
    uri.searchParams.append("client_id", this._clientID);
    uri.searchParams.append("redirect_uri", this._callbackURL);
    this.redirect(uri.href);
};

Strategy.prototype._exchange = function (code) {
    return axios.post(
        this._options.tokenURL,
        querystring.stringify({
            grant_type: "authorization_code",
            redirect_uri: this._callbackURL,
            code: code
        }),
        {
            headers: {
                Authorization:
                    "Basic " +
                    Base64.encode(this._clientID + ":" + this._clientSecret)
            }
        }
    );
};

Strategy.prototype.authorizationParams = function (options) {
    return {};
};

Strategy.prototype.userProfile = function (accessToken, done) {
    axios
        .get(this._profileURL, {
            headers: {
                Authorization: "Bearer " + accessToken
            }
        })
        .then(res => done(null, res.data))
        .catch(err => done(err, null));
};

Strategy.prototype.parseErrorResponse = function (body, status) {
    var json = JSON.parse(body);
    return new Error(json);
};

// Expose constructor.
module.exports = Strategy;
