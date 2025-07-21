// validators/seo/seo-metadata.validator.js

import { body } from "express-validator";
import { validateRequired, validateUUID, validateSlug, validateLanguageCode, validateURL } from "../common.validator.js";

/**
 * Page types enum
 */
const PAGE_TYPES = ["hotel", "room", "city", "country", "page", "blog"];

/**
 * Validation rules for creating SEO metadata array
 * POST /api/seo-metadata (array format)
 */
export const validateSeoMetadataCreateArray = [
  // Validate that seo_data is a non-empty array
  body("seo_data").isArray({ min: 1 }).withMessage("seo_data must be a non-empty array"),

  // Validate each item in the array
  // Page type - required, must be valid enum
  body("seo_data.*.page_type")
    .notEmpty()
    .withMessage("Page type is required")
    .isIn(PAGE_TYPES)
    .withMessage(`Page type must be one of: ${PAGE_TYPES.join(", ")}`),

  // Page ID - optional, must be valid UUID if provided
  body("seo_data.*.page_id").optional({ nullable: true, checkFalsy: true }).isUUID(4).withMessage("Invalid page ID format"),

  // Slug - required, lowercase with hyphens
  body("seo_data.*.slug")
    .notEmpty()
    .withMessage("Slug is required")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers, and hyphens only")
    .isLength({ min: 3, max: 100 })
    .withMessage("Slug must be between 3-100 characters")
    .custom((value) => {
      if (RESERVED_SLUGS.includes(value.toLowerCase())) {
        throw new Error(`The slug '${value}' is reserved and cannot be used`);
      }
      return true;
    }),

  // Language - required, th or en
  body("seo_data.*.lang").notEmpty().withMessage("Language is required").isIn(["th", "en"]).withMessage("Language must be 'th' or 'en'"),

  // Title - required, 10-150 characters
  body("seo_data.*.title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 10, max: 150 })
    .withMessage("Title should be between 10-150 characters")
    .trim(),

  // Description - required, 10-250 characters
  body("seo_data.*.description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 250 })
    .withMessage("Description should be between 10-250 characters")
    .trim(),

  // OG Image - optional, must be valid URL
  body("seo_data.*.og_image").optional({ nullable: true, checkFalsy: true }).isURL().withMessage("Invalid og_image URL format"),
];

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
 * Validate page type
 */
const validatePageType = (fieldName = "page_type") =>
  body(fieldName)
    .notEmpty()
    .withMessage("Page type is required")
    .isIn(PAGE_TYPES)
    .withMessage(`Page type must be one of: ${PAGE_TYPES.join(", ")}`);

/**
 * Validation rules for creating SEO metadata
 * POST /api/seo-metadata
 */
export const validateSeoMetadataCreate = [
  // Page type - required, must be valid enum
  validatePageType("page_type"),

  // Page ID - optional, must be valid UUID if provided
  body("page_id").optional({ nullable: true, checkFalsy: true }).isUUID(4).withMessage("Invalid page ID format"),

  // Slug - required, lowercase with hyphens
  validateSlug("slug"),
  body("slug").custom((value) => {
    if (RESERVED_SLUGS.includes(value.toLowerCase())) {
      throw new Error(`The slug '${value}' is reserved and cannot be used`);
    }
    return true;
  }),

  // Language - required, th or en
  validateLanguageCode("lang"),

  // Title - required, 10-150 characters
  validateRequired("title"),
  body("title").isLength({ min: 10, max: 150 }).withMessage("Title should be between 10-150 characters").trim(),

  // Description - required, 10-250 characters
  validateRequired("description"),
  body("description").isLength({ min: 10, max: 250 }).withMessage("Description should be between 10-250 characters").trim(),

  // OG Image - optional, must be valid URL
  validateURL("og_image", false),
];
