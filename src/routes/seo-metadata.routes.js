// routes/seo-metadata.route.js

import express from "express";
import { validateSeoMetadataGet } from "../validators/seo/seo-metadata.validator.js";
import { validateSeoMetadataCreateArray } from "../validators/seo/seo-metadata-create.validator.js";
import { handleValidationErrors } from "../validators/validation.handler.js";
import { xssClean } from "../middlewares/xss-protection.middleware.js";
import { createSeoMetadata } from "../controllers/seo/seo-metadata-create.controller.js";
import { getSeoMetadata } from "../controllers/seo/seo-metadata.controller.js";

const router = express.Router();

/**
 * POST /api/seo-metadata
 * Create SEO metadata (accepts array for multiple languages)
 */
router.post(
  "/",
  xssClean, // XSS prevention
  validateSeoMetadataCreateArray, // Array validation
  handleValidationErrors, // Validation error handler
  createSeoMetadata // Controller
);

router.get(
  "/",
  xssClean, // XSS protection สำหรับ query params
  validateSeoMetadataGet,
  handleValidationErrors,
  getSeoMetadata
);

export default router;
