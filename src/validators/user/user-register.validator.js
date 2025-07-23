//validators/user/user-register.validator.js

import { body } from "express-validator";
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateLength,
  validatePhone,
  validateSupabaseStorageUrl,
} from "../common.validator.js";

/**
 * Birthday validator - must be in the past and user must be 18+
 */
const validateBirthday = () =>
  body("birthday")
    .notEmpty()
    .withMessage("Birthday is required")
    .isISO8601()
    .withMessage("Invalid date format. Use YYYY-MM-DD")
    .custom((value) => {
      const birthday = new Date(value);
      const today = new Date();

      // Check if birthday is in the future
      if (birthday > today) {
        throw new Error("Birthday cannot be in the future");
      }

      // Calculate age
      const age = today.getFullYear() - birthday.getFullYear();
      const monthDiff = today.getMonth() - birthday.getMonth();
      const dayDiff = today.getDate() - birthday.getDate();

      // Check if user is at least 18 years old
      const isUnder18 = age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && dayDiff < 0);

      if (isUnder18) {
        throw new Error("User must be at least 18 years old");
      }

      return true;
    });

/**
 * Validation rules for user registration
 * POST /api/users/register
 */
export const validateUserRegister = [
  // Email - required, must be valid format
  validateEmail(),

  // Password - required, must be strong
  validatePassword(),

  // First name - required, 2-50 characters
  validateRequired("fname"),
  validateLength("fname", 2, 50),

  // Last name - required, 2-50 characters
  validateRequired("lname"),
  validateLength("lname", 2, 50),

  // Birthday - required, must be 18+ years old
  validateBirthday(),

  // Address - required, 10-300 characters
  validateRequired("address"),
  validateLength("address", 10, 300),

  // Province/State - required, 2-100 characters
  validateRequired("province"),
  validateLength("province", 2, 100),

  // Primary phone - required
  validatePhone("phone1"),

  // Secondary phone - optional
  validatePhone("phone2").optional({ nullable: true, checkFalsy: true }),

  // User image - optional
  validateSupabaseStorageUrl("user_image", false),
];
