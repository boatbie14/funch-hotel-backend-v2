import express from "express";
import { validateUserRegister } from "../validators/user/user-register.validator.js";
import { validateUserLogin } from "../validators/user/user-login.validator.js";
import { handleValidationErrors } from "../validators/validation.handler.js";
import { xssClean } from "../middlewares/xss-protection.middleware.js";
import { createUser } from "../controllers/user/user-create.controller.js";
import { loginUser } from "../controllers/user/user-login.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/users
 * Create a new user
 */
router.post(
  "/",
  xssClean, // XSS prevention
  validateUserRegister, // Input validation
  handleValidationErrors, // Validation error handler
  createUser // Controller
);

/**
 * POST /api/user/login
 * User login
 */
router.post(
  "/login",
  xssClean, // XSS prevention
  validateUserLogin, // Input validation
  handleValidationErrors, // Validation error handler
  loginUser // Controller
);

export default router;
