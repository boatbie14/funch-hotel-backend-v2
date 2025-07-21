// routes/image-collection.routes.js

import express from "express";
import { validateImageCollection } from "../validators/image-collection.validator.js";
import { handleValidationErrors } from "../validators/validation.handler.js";
import { xssClean } from "../middlewares/xss-protection.middleware.js";
import { createImageCollection } from "../controllers/image/image-collection.controller.js";

const router = express.Router();

/**
 * POST /api/image-collection
 * Create image collection for an entity
 */
router.post(
  "/",
  xssClean, // XSS prevention
  validateImageCollection, // Input validation
  handleValidationErrors, // Validation error handler
  createImageCollection // Controller
);

export default router;
