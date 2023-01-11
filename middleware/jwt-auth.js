'use strict';

const jwt = require('jsonwebtoken');

module.exports = class JwtAuth {

    static async decodeToken(req, res) {

        const accessToken = req.headers['authorization'];
        if (!accessToken) {
            return res.status(403).json({
                statusCode: 403,
                message: 'Authorization token missing'
            })
        }
        try {
            const decoded = jwt.verify(accessToken.replace('Bearer ', ''), process.env.JWT_SECRET_KEY);
            req.user = decoded.userInfo;
        } catch (error) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Unauthorized'
            });
        }
    }

    static async verifyUser(req, res, next) {
        await JwtAuth.decodeToken(req, res);
        if(req.user.isAdmin){
            next();
            return;
        }
        else if (req?.user?.id != req?.params?.id) {
            return res.status(403).json({
                statusCode: 403,
                message: 'Forbidden'
            })
        }
        next();
    }

}