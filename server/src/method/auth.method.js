import jwt from 'jsonwebtoken';
import { generate } from 'rand-token';
import { config } from '../config/env.js';

export const generateJwt = (payload) => {
    const accessTokenKey = config.accessTokenKey
	const accessTokenLife = config.accessTokenLife
    return jwt.sign(payload, 
    accessTokenKey,
    {
        algorithm: 'HS256',
        expiresIn: accessTokenLife
    })
}