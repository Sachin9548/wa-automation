// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { brandName, email, phone, password } = req.body;

    // 1. Basic input validation
    if (!brandName || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // 2. Check if user already exists
    const existingMerchant = await prisma.merchant.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingMerchant) {
      return res.status(400).json({ message: 'Email or Phone already registered.' });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create Merchant in DB
    const newMerchant = await prisma.merchant.create({
      data: {
        brandName,
        email,
        phone,
        password: hashedPassword,
      },
    });

    // 5. Generate JWT Token
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in environment variables');
    const token = jwt.sign(
      { merchantId: newMerchant.id, email: newMerchant.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      merchant: {
        id: newMerchant.id,
        brandName: newMerchant.brandName,
        status: newMerchant.status,
      },
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    // 1. Basic input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // 2. Find User
    const merchant = await prisma.merchant.findUnique({ where: { email } });
    if (!merchant) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // 3. Check Password
    const isMatch = await bcrypt.compare(password, merchant.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // 4. Generate Token
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in environment variables');
    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      merchant: {
        id: merchant.id,
        brandName: merchant.brandName,
        status: merchant.status
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};