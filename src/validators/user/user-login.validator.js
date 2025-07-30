// validators/user/user-login.validator.js

import { validateEmail, validateRequired } from "../common.validator.js";

/**
 * Validation rules for user login
 * POST /api/user/login
 */
export const validateUserLogin = [
  // Email - required, must be valid format
  validateEmail("email"),

  // Password - required (no need to validate format for login)
  validateRequired("password"),
];
