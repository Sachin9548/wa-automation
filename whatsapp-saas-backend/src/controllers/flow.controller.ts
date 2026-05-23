// src/controllers/flow.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

// 1. Merchant ke saare flows get karna
export const getFlows = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;
    const flows = await prisma.automationFlow.findMany({
      where: { merchantId },
      orderBy: { delayMinutes: 'asc' }
    });
    res.status(200).json({ flows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flows' });
  }
};

// 2. Naya Flow Create/Update karna
export const saveFlow = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;
    const { type, delayMinutes, template, isActive } = req.body; 
    // type = "ABANDONED_CART" or "ORDER_CONFIRM"

    if (!type || !template || delayMinutes === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Upsert (Agar type ka flow already hai toh update, nahi toh create)
    const flow = await prisma.automationFlow.upsert({
      where: {
        merchantId_type: { merchantId, type } // Prisma schema ka unique constraint
      },
      update: {
        delayMinutes: parseInt(delayMinutes),
        template,
        isActive
      },
      create: {
        merchantId,
        type,
        delayMinutes: parseInt(delayMinutes),
        template,
        isActive
      }
    });

    res.status(200).json({ message: 'Flow saved successfully!', flow });
  } catch (error) {
    console.error('Save Flow Error:', error);
    res.status(500).json({ message: 'Error saving flow' });
  }
};

// 3. Flow ko ON/OFF karna (Master Toggle)
export const toggleFlow = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    // 🚨 FIX 1: Ensure flowId is strictly a string
    const flowId = typeof req.params.flowId === 'string' ? req.params.flowId : undefined;
    const { isActive } = req.body;
    const merchantId = req.user.merchantId;

    if (!flowId) {
      return res.status(400).json({ message: 'Flow ID is required' });
    }

    // 🚨 FIX 2: Use updateMany for composite filtering (Security Check)
    const result = await prisma.automationFlow.updateMany({
      where: { 
        id: flowId, 
        merchantId: merchantId // Security check: Sirf is merchant ka flow update ho
      }, 
      data: { isActive }
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Flow not found or unauthorized' });
    }

    res.status(200).json({ message: `Flow turned ${isActive ? 'ON' : 'OFF'}!` });
  } catch (error) {
    console.error('Toggle Flow Error:', error);
    res.status(500).json({ message: 'Error toggling flow' });
  }
};