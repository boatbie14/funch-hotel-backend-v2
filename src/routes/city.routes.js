// routes/city.routes.js

import express from "express";
import { validateCityCreate } from "../validators/city/city-create.validator.js";
import { handleValidationErrors } from "../validators/validation.handler.js";
import { xssClean } from "../middlewares/xss-protection.middleware.js";
import { createCity } from "../controllers/city/city-create.controller.js";

const router = express.Router();

/**
 * POST /api/cities
 * Create a new city
 */
router.post(
  "/",
  xssClean, // XSS prevention
  validateCityCreate, // Input validation
  handleValidationErrors, // Validation error handler
  createCity // Controller
);

export default router;
