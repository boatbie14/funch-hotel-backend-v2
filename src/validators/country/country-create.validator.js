// validators/country/country-create.validator.js

import { body } from "express-validator";
import { validateRequired, validateLength } from "../common.validator.js";
import { validateImageUrl } from "../image.validator.js";

/**
 * Validation rules for country creation
 * POST /api/countries
 */
export const validateCountryCreate = [
  // Thai name - required, 2-100 characters
  validateRequired("name_th"),
  validateLength("name_th", 2, 100),
  body("name_th").trim(),

  // English name - required, 2-100 characters, only letters/spaces/hyphens
  validateRequired("name_en"),
  validateLength("name_en", 2, 100),
  body("name_en")
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage("Country name (English) can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),

  // Image URL - optional, from Supabase storage
  validateImageUrl("image", false), // false = not required
];
