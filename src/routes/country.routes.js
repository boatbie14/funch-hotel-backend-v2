// routes/country.routes.js

import express from "express";
import { validateCountryCreate } from "../validators/country/country-create.validator.js";
import { handleValidationErrors } from "../validators/validation.handler.js";
import { xssClean } from "../middlewares/xss-protection.middleware.js";
import { createCountry } from "../controllers/country/country-create.controller.js";

const router = express.Router();

/**
 * POST /api/countries
 * Create a new country
 */
router.post(
  "/",
  xssClean, // XSS prevention
  validateCountryCreate, // Input validation
  handleValidationErrors, // Validation error handler
  createCountry // Controller
);

export default router;
