// validators/country/country-create.validator.js

import { body } from "express-validator";
import { validateRequired, validateLength, validateEnglishPattern, validateSupabaseStorageUrl } from "../common.validator.js";

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
  validateEnglishPattern("name_en"),

  // Image URL - optional, from Supabase storage
  validateSupabaseStorageUrl("image", false), // false = not required
];
