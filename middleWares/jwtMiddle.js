const jsonWebToken = require('jsonwebtoken');


const validateCookie = (cookieName) => {
    return (req, res, next) => {
        const cookieVal = req.cookies[cookieName];
        if(!cookieVal) {
            return next();
        }
        try {
            const payLoad = jsonWebToken.verify(cookieVal, 'JaiShreeRam');
            req.user=payLoad;
        } catch (error) {}
        return next();
    };
}

module.exports = validateCookie;