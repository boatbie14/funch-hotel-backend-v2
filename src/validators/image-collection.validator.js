// validators/image-collection.validator.js

import { body } from "express-validator";
import { validateRequired, validateUUID } from "./common.validator.js";
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
  body("content_type")
    .notEmpty()
    .withMessage("Content type is required")
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
  body("images")
    .notEmpty()
    .withMessage("Images array is required")
    .isArray({ min: 1, max: 50 })
    .withMessage("Images must be an array with 1-50 items"),

  // Validate each image in array
  body("images.*.url")
    .notEmpty()
    .withMessage("Image URL is required")
    .isURL()
    .withMessage("Invalid image URL format")
    .matches(/^https:\/\/.*\.supabase\.co\/storage\/.*/)
    .withMessage("Image must be from Supabase storage"),

  body("images.*.alt")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 255 })
    .withMessage("Alt text must not exceed 255 characters")
    .trim(),

  body("images.*.caption")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 500 })
    .withMessage("Caption must not exceed 500 characters")
    .trim(),

  body("images.*.is_cover").notEmpty().withMessage("is_cover is required").isBoolean().withMessage("is_cover must be true or false"),

  body("images.*.sort_order")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 999 })
    .withMessage("Sort order must be between 0-999")
    .toInt(),

  // Custom validation: exactly one cover image
  body("images").custom((images) => {
    if (!Array.isArray(images)) return true; // Already validated above

    const coverImages = images.filter((img) => img.is_cover === true);
    if (coverImages.length === 0) {
      throw new Error("At least one image must be marked as cover");
    }
    if (coverImages.length > 1) {
      throw new Error("Only one image can be marked as cover");
    }
    return true;
  }),

  // Custom validation: no duplicate URLs in the same request
  body("images").custom((images) => {
    if (!Array.isArray(images)) return true; // Already validated above

    const urls = images.map((img) => img.url);
    const uniqueUrls = new Set(urls);
    if (urls.length !== uniqueUrls.size) {
      throw new Error("Duplicate image URLs in the same request");
    }
    return true;
  }),
];
