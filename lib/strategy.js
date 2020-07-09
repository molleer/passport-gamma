// Load modules.
const request = require("request");
const qs = require("querystring");
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
class Strategy {
    constructor(options, verify) {
        options = options || {};
        this.options = {
            authorizationURL: "https://gamma.chalmers.it/api/oauth/authorize",
            tokenURL: "https://gamma.chalmers.it/api/oauth/token",
            profileURL: "https://gamma.chalmers.it/api/users/me",
            ...options
        };

        this._verify = verify;
        this.name = "gamma";
    }

    /**
     * Authenticate request by delegating to Gamma using OAuth 2.0.
     *
     * @param {http.IncomingMessage} req
     * @param {object} options
     * @access protected
     */
    authenticate = function (req, options) {
        if (req.query && req.query.error) {
            return this.error(req.query.error_description);
        }

        if (req.query && req.query.code) {
            this._exchange(req.query.code, (err, res, body) => {
                if (err) {
                    this.error(err);
                    return;
                }

                this._loadProfile(JSON.parse(body).access_token);
            });
            return;
        }

        this._redirectToLogin();
    };

    _loadProfile = function (accessToken) {
        const self = this;
        var done = (err, profile, info) => {
            if (err) {
                self.error(err);
                return;
            }
            if (!profile) {
                self.fail(info);
                return;
            }
            self.success(profile, null);
        };

        var verify = (err, user) => {
            if (err) {
                self.error(err);
                return;
            }
            self._verify(accessToken, user, done);
        };

        self.userProfile(accessToken, verify);
    };

    _redirectToLogin = function () {
        var uri = new URL(this.options.authorizationURL);
        uri.searchParams.append("response_type", "code");
        uri.searchParams.append("client_id", this.options.clientID);
        uri.searchParams.append("redirect_uri", this.options.callbackURL);
        this.redirect(uri.href);
    };

    _exchange = function (code, callback) {
        return request.post(
            this.options.tokenURL +
                "?" +
                qs.stringify({
                    grant_type: "authorization_code",
                    redirect_uri: this.options.callbackURL,
                    code: code
                }),
            {
                headers: {
                    Authorization:
                        "Basic " +
                        Base64.encode(
                            this.options.clientID +
                                ":" +
                                this.options.clientSecret
                        )
                }
            },
            callback
        );
    };

    userProfile = function (accessToken, done) {
        request.get(
            this.options.profileURL,
            {
                headers: {
                    Authorization: "Bearer " + accessToken
                }
            },
            (err, res, body) => {
                if (err) {
                    done(err, null);
                    return;
                }
                done(null, JSON.parse(body));
            }
        );
    };
}
// Expose constructor
module.exports = { Strategy };
