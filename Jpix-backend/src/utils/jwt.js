'use strict';
const jwt = require('jsonwebtoken');

const signAccessToken = (payload, options = {}) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    ...options
  });
};

const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');
  return jwt.verify(token, secret);
};

module.exports = { signAccessToken, verifyAccessToken };
