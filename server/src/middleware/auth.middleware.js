import jwt from 'jsonwebtoken';
import response from '../helpers/response.js';
import { config } from '../config/env.js';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null)
        return response.sendError(res, "Unauthenticated", 401)

    jwt.verify(token, config.accessTokenKey, (err, user) => {
        if (err)
            return response.sendError(res, "BadRequest", 403);
        //Assign user info from JWT to next req. 
        req.email = user.email
        next()
    })
}