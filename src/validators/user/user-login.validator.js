// validators/user/user-login.validator.js

import { body } from "express-validator";

/**
 * Validation rules for user login
 * POST /api/user/login
 */
export const validateUserLogin = [
  // Email - required, must be valid format
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format").normalizeEmail().trim(),

  // Password - required (no need to validate format for login)
  body("password").notEmpty().withMessage("Password is required"),
];
