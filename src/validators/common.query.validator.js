// validators/common.query.validator.js

import { query } from "express-validator";

// ========================================
// STRING VALIDATORS
// ========================================

/**
 * Validate query slug (required)
 * For SEO-friendly URLs in query params
 * @param {string} fieldName - Field name to validate
 */
export const validateQuerySlug = (fieldName = "slug") =>
  query(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers, and hyphens only")
    .isLength({ min: 1, max: 100 })
    .withMessage("Slug must be between 1-100 characters");

/**
 * Validate optional query slug
 * @param {string} fieldName - Field name to validate
 */
export const validateOptionalQuerySlug = (fieldName = "slug") =>
  query(fieldName)
    .optional()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers, and hyphens only")
    .isLength({ min: 1, max: 100 })
    .withMessage("Slug must be between 1-100 characters");

/**
 * Language code validator for query
 * @param {string} fieldName - Field name to validate
 */
export const validateQueryLanguage = (fieldName = "lang") =>
  query(fieldName).optional().isIn(["th", "en"]).withMessage("Language must be 'th' or 'en'");

// ========================================
// PAGINATION VALIDATORS
// ========================================

/**
 * Limit validator with custom max
 * @param {number} max - Maximum limit allowed (default: 100)
 */
export const validateQueryLimit = (max = 100) =>
  query("limit").optional().isInt({ min: 1, max }).withMessage(`Limit must be between 1 and ${max}`).toInt();

/**
 * Offset validator for pagination
 */
export const validateQueryOffset = () =>
  query("offset").optional().isInt({ min: 0 }).withMessage("Offset must be a positive number").toInt();
