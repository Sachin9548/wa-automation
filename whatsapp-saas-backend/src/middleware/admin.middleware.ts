// src/middleware/admin.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const adminProtect = (req: Request, res: Response, next: NextFunction): any => {
  const apiKey = req.headers['x-admin-api-key'];

  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ message: 'Forbidden: Invalid Admin API Key' });
  }

  next();
};

