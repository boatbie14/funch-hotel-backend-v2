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
  // Required check
  validateRequired("slug", "query"),

  // Normalize slug
  query("slug").customSanitizer(normalizeSlug),
];
