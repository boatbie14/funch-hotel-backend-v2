// validators/seo/seo-metadata.validator.js

import { body } from "express-validator";
import {
  validateRequired,
  validateOptionalArray,
  validateConditionalRequired,
  validateConditionalField,
  validateNoDuplicates,
  validateSlug,
  validateLanguageCode,
  validateTextContent,
  validateURL,
  makeOptional,
  validateUUID,
} from "../common.validator.js";
import { CONTENT_TYPE_VALUES } from "../../constants/content-types.js";

/**
 * Reserved slugs that cannot be used
 */
const RESERVED_SLUGS = [
  "admin",
  "api",
  "login",
  "register",
  "logout",
  "dashboard",
  "auth",
  "oauth",
  "callback",
  "profile",
  "settings",
  "account",
  "user",
  "users",
  "hotel",
  "hotels",
  "room",
  "rooms",
  "booking",
  "bookings",
  "search",
  "about",
  "contact",
  "privacy",
  "terms",
  "help",
  "support",
  "faq",
  "404",
  "500",
  "error",
  "static",
  "assets",
  "public",
  "private",
];

/**
 * Custom validator for reserved slugs
 */
const validateReservedSlug = (fieldName) =>
  body(fieldName).custom((value) => {
    if (value && RESERVED_SLUGS.includes(value.toLowerCase())) {
      throw new Error(`The slug '${value}' is reserved and cannot be used`);
    }
    return true;
  });

/**
 * Validation rules for creating SEO metadata array
 * POST /api/seo-metadata
 */
export const validateSeoMetadataCreateArray = [
  // Validate array structure
  body("seo_data").isArray({ min: 1 }).withMessage("seo_data must be a non-empty array"),

  // Page type: Required, must be valid content type
  validateConditionalRequired("seo_data.*.page_type", "seo_data"),
  body("seo_data.*.page_type")
    .isIn(CONTENT_TYPE_VALUES)
    .withMessage(`Page type must be one of: ${CONTENT_TYPE_VALUES.join(", ")}`),

  // Page ID: Optional UUID
  body("seo_data.*.page_id").optional({ nullable: true, checkFalsy: true }).isUUID(4).withMessage("Invalid page ID format"),

  // Slug: Required, lowercase with hyphens
  validateConditionalRequired("seo_data.*.slug", "seo_data"),
  validateConditionalField("seo_data.*.slug", "seo_data", (fieldName) => validateSlug(fieldName)),
  validateReservedSlug("seo_data.*.slug"),

  // Language: Required, must be 'th' or 'en'
  validateConditionalRequired("seo_data.*.lang", "seo_data"),
  validateConditionalField("seo_data.*.lang", "seo_data", (fieldName) => validateLanguageCode(fieldName)),

  // Title: Required, 10-150 characters
  validateConditionalRequired("seo_data.*.title", "seo_data"),
  validateConditionalField("seo_data.*.title", "seo_data", (fieldName) => validateTextContent(fieldName, 10, 150)),

  // Description: Required, 10-250 characters
  validateConditionalRequired("seo_data.*.description", "seo_data"),
  validateConditionalField("seo_data.*.description", "seo_data", (fieldName) => validateTextContent(fieldName, 10, 250)),

  // OG Image: Optional URL
  validateConditionalField("seo_data.*.og_image", "seo_data", (fieldName) => validateURL(fieldName, false)),

  // No duplicate languages
  validateNoDuplicates("seo_data", "lang", "Duplicate language entries in SEO data"),
];
