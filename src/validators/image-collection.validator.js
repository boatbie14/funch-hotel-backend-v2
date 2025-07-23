// validators/image-collection.validator.js

import { body } from "express-validator";
import {
  validateRequired,
  validateUUID,
  validateOptionalText,
  validateSupabaseStorageUrl,
  validateConditionalRequired,
  validateNoDuplicates,
  validateExactlyOne,
} from "./common.validator.js";
import { CONTENT_TYPE_VALUES, getTableName } from "../constants/content-types.js";
import { supabase } from "../config/database.js";

/**
 * Custom validator to check if entity exists
 * @param {string} type - Content type
 * @param {string} id - Entity ID
 * @returns {Promise<boolean>}
 */
const checkEntityExists = async (type, id) => {
  const tableName = getTableName(type);
  if (!tableName) {
    throw new Error(`Invalid content type: ${type}`);
  }

  const { data, error } = await supabase.from(tableName).select("id").eq("id", id).single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Database error: ${error.message}`);
  }

  return !!data;
};

/**
 * Validation rules for creating image collection
 * POST /api/image-collection
 */
export const validateImageCollection = [
  // Content type - required, must be valid content type
  validateRequired("content_type"),
  body("content_type")
    .isIn(CONTENT_TYPE_VALUES)
    .withMessage(`Content type must be one of: ${CONTENT_TYPE_VALUES.join(", ")}`),

  // Content ID - required, must be valid UUID
  validateUUID("content_id", "body"),

  // Custom validation - check if entity exists
  body("content_id").custom(async (value, { req }) => {
    const exists = await checkEntityExists(req.body.content_type, value);
    if (!exists) {
      throw new Error(`${req.body.content_type} with ID ${value} not found`);
    }
    return true;
  }),

  // Images array - required, min 1 image, max 50 images
  validateRequired("images"),
  body("images").isArray({ min: 1, max: 50 }).withMessage("Images must be an array with 1-50 items"),

  // Validate each image in array
  // URL - required, must be from Supabase storage
  validateConditionalRequired("images.*.url", "images"),
  validateSupabaseStorageUrl("images.*.url", true),

  // Alt text - optional, max 255 chars
  validateOptionalText("images.*.alt", 255),

  // Caption - optional, max 500 chars
  validateOptionalText("images.*.caption", 500),

  // Is cover - required boolean
  validateConditionalRequired("images.*.is_cover", "images"),
  body("images.*.is_cover").isBoolean().withMessage("is_cover must be true or false"),

  // Sort order - optional, 0-999
  body("images.*.sort_order")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 999 })
    .withMessage("Sort order must be between 0-999")
    .toInt(),

  // Exactly one cover image
  validateExactlyOne("images", "is_cover", true, "Exactly one image must be marked as cover"),

  // No duplicate URLs
  validateNoDuplicates("images", "url", "Duplicate image URLs in the same request"),
];
