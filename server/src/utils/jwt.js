import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// Generate Access Token
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.accessTokenKey, {
    expiresIn: config.accessTokenLife
  });
};

// Generate Refresh Token
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.refreshTokenKey, {
    expiresIn: config.refreshTokenLife
  });
};

// Verify Access Token
export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.accessTokenKey);
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.refreshTokenKey);
};

// Generate Token Pair
export const generateTokenPair = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  return {
    accessToken,
    refreshToken
  };
};