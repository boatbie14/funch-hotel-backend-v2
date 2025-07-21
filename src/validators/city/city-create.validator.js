// validators/city/city-create.validator.js

import { body } from "express-validator";
import { validateRequired, validateLength, validateUUID } from "../common.validator.js";
import { validateImageUrl } from "../image.validator.js";

/**
 * Validation rules for city creation
 * POST /api/cities
 */
export const validateCityCreate = [
  // Thai name - required, 2-100 characters
  validateRequired("name_th"),
  validateLength("name_th", 2, 100),
  body("name_th").trim(),

  // English name - required, 2-100 characters, only letters/spaces/hyphens
  validateRequired("name_en"),
  validateLength("name_en", 2, 100),
  body("name_en")
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage("City name (English) can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),

  // Country ID - required, must be valid UUID
  validateUUID("country_id", "body"),

  // Image URL - optional, from Supabase storage
  validateImageUrl("image", false), // false = not required
];
