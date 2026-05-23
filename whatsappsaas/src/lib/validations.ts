// src/lib/validations.ts
import { z } from "zod";

// Signup ke rules
export const signupSchema = z.object({
  brandName: z.string().min(2, "Choosing a brand name with more than two characters"),
  email: z.string().email("Enter the valid email Address"),
  phone: z.string().min(10, "Phone number minimum 10 digits required"),
  password: z.string().min(8, "Password is minimum 8 characters required"),
});

// Login ke rules
export const loginSchema = z.object({
  email: z.string().email("Enter the valid email Address"),
  password: z.string().min(1, "Password is required"),
});

// TypeScript Types (Ye automatically schema se type nikal lega)
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;