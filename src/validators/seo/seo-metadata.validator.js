// validators/seo/seo-metadata-get.validator.js

import { query } from "express-validator";
import { validateRequired } from "../common.validator.js";

const normalizeSlug = (slug) => {
  if (!slug || slug === "" || slug === "/") {
    return "home";
  }
  return slug.replace(/^\/+|\/+$/g, "");
};

/**
 * Validation rules for getting SEO metadata
 * GET /api/seo-metadata?slug={slug}
 */
export const validateSeoMetadataGet = [
  // Make slug optional to allow empty values
  query("slug")
    .optional({ checkFalsy: false }) // Allow empty string
    .isString()
    .withMessage("Slug must be a string"),

  // Normalize slug - this will convert empty/root to "home"
  query("slug").customSanitizer(normalizeSlug),
];
