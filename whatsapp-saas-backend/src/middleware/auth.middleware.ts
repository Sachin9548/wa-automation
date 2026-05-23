// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Request interface ko extend kar rahe hain taaki req.user use kar sakein
export interface AuthRequest extends Request {
  user?: any;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): any => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
  

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Isme merchantId hoga jo humne signup ke time daala tha
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token failed or expired' });
  }
};