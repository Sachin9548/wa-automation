// src/controllers/auth.controller.ts
import express,  { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { brandName, email, phone, password } = req.body;

    // 1. Check if user already exists
    const existingMerchant = await prisma.merchant.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingMerchant) {
      return res.status(400).json({ message: 'Email or Phone already registered.' });
    }

    // 2. Hash Password (Security)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create Merchant in DB (Wallet gets ₹200 automatically from Prisma Schema)
    const newMerchant = await prisma.merchant.create({
      data: {
        brandName,
        email,
        phone,
        password: hashedPassword,
      },
    });

    // 4. Generate JWT Token
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

    // 1. Find User
    const merchant = await prisma.merchant.findUnique({ where: { email } });
    if (!merchant) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, merchant.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // 3. Generate Token
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
        status: merchant.status,
        walletBalance: merchant.walletBalance
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};