const jwt = require("jsonwebtoken");

module.exports = function verifyJwt(req, res, next) {
    const authToken = req.headers.authorization;
    if (!authToken) {
        return res.status(401).send({ message: "unauthorized access" });
    }
    const token = authToken.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    })

}