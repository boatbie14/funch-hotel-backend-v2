import express from "express";
import { validateUserRegister } from "../validators/user/user-register.validator.js";
import { handleValidationErrors } from "../validators/validation.handler.js";
import { xssClean } from "../middlewares/xss-protection.middleware.js";
import { createUser } from "../controllers/user/user-create.controller.js";

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

export default router;
