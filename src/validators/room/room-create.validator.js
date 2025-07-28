// validators/room/room-create.validator.js

import { body } from "express-validator";
import {
  // Basic validators
  validateRequired,
  validateLength,
  validateBoolean,
  validateUUID,
  // String validators
  validateTextContent,
  validateOptionalText,
  validateEnglishPattern,
  validateSlug,
  validateLanguageCode,
  // Number validators
  validateDecimal,
  validatePositiveInteger,
  validatePrice,
  validateWeeklyPrices,
  // Date validators
  validateDate,
  validateDateRange,
  validateNoDateOverlap,
  // URL validators
  validateURL,
  validateSupabaseStorageUrl,
  // Array validators
  validateOptionalArray,
  validateUUIDArray,
  validateNoDuplicates,
  validateExactlyOne,
  // Conditional validators
  validateConditionalRequired,
  validateConditionalField,
  // Special validators
  validateSortOrder,
} from "../common.validator.js";

/**
 * Validation rules for room creation
 * POST /api/rooms
 *
 * Expected request structure:
 * {
 *   "room_data": { ... },           // Required: Basic room information
 *   "room_option_ids": [ ... ],     // Optional: Room amenities/features
 *   "base_price": { ... },          // Required: Base pricing for each day
 *   "season_base_prices": [ ... ],  // Optional: Seasonal pricing
 *   "override_prices": [ ... ],     // Optional: Special date pricing
 *   "seo_data": [ ... ],           // Optional: SEO metadata
 *   "images": [ ... ]              // Optional: Room gallery
 * }
 */
export const validateRoomCreate = [
  // ========================================
  // 1. ROOM DATA VALIDATION (Required)
  // ========================================

  // Validate room_data object structure
  body("room_data").notEmpty().withMessage("Room data is required").isObject().withMessage("Room data must be an object"),

  // ---------- Room Names ----------
  // Thai name: Required, 2-100 characters
  validateRequired("room_data.name_th"),
  validateLength("room_data.name_th", 2, 100),
  body("room_data.name_th").trim(),

  // English name: Required, 2-100 characters
  validateRequired("room_data.name_en"),
  validateLength("room_data.name_en", 2, 100),
  validateEnglishPattern("room_data.name_en"),
  body("room_data.name_en").trim(),

  // ---------- Room Details ----------
  // Room size: Required, decimal 1-9999 sqm
  validateDecimal("room_data.room_size", 1, 9999),

  // Thai description: Required, 20-5000 characters
  validateTextContent("room_data.description_th", 20, 5000),

  // English description: Required, 20-5000 characters
  validateTextContent("room_data.description_en", 20, 5000),

  // ---------- Room Capacity ----------
  // Max adults: Required, 1-10 persons
  validatePositiveInteger("room_data.max_adult", 1, 10),

  // Max children: Required, 0-10 persons (0 = no children allowed)
  validatePositiveInteger("room_data.max_children", 0, 10),

  // Total rooms: Required, 1-999 rooms
  validatePositiveInteger("room_data.total_room", 1, 999),

  // ---------- Room Relations ----------
  // Hotel ID: Required, valid UUID
  validateUUID("room_data.hotel_id", "body"),

  // Active status: Required boolean
  validateBoolean("room_data.is_active"),

  // ========================================
  // 2. ROOM OPTIONS VALIDATION (Optional)
  // ========================================

  // Room option IDs: Optional array of UUIDs
  validateUUIDArray("room_option_ids", false, 0),

  // ========================================
  // 3. BASE PRICE VALIDATION (Required)
  // ========================================

  // Validate base_price object structure
  body("base_price").notEmpty().withMessage("Base price is required").isObject().withMessage("Base price must be an object"),

  // Validate all 7 days pricing
  ...validateWeeklyPrices("base_price"),

  // ========================================
  // 4. SEASON BASE PRICES VALIDATION (Optional)
  // ========================================

  // Validate season_base_prices array structure
  validateOptionalArray("season_base_prices", 20), // Max 20 seasons

  // ---------- Season Fields ----------
  // Name: Required if season exists
  validateConditionalRequired("season_base_prices.*.name", "season_base_prices"),
  validateConditionalField("season_base_prices.*.name", "season_base_prices", (fieldName) => validateLength(fieldName, 2, 100)),

  // Date range: Required if season exists
  body("season_base_prices.*.start_date")
    .if(body("season_base_prices").exists())
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid date format"),

  body("season_base_prices.*.end_date")
    .if(body("season_base_prices").exists())
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value, { req, path }) => {
      // Get index from path (e.g., "season_base_prices[0].end_date" -> 0)
      const match = path.match(/\[(\d+)\]/);
      if (!match) return true;

      const index = parseInt(match[1]);
      const season = req.body.season_base_prices[index];

      const startDate = new Date(season.start_date);
      const endDate = new Date(value);

      if (endDate < startDate) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  // Weekly prices: Required if season exists
  body("season_base_prices").custom((seasons) => {
    if (!Array.isArray(seasons)) return true;

    // Validate each season has all price fields
    seasons.forEach((season, index) => {
      const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      days.forEach((day) => {
        const priceField = `price_${day}`;
        if (!season[priceField] || season[priceField] < 0) {
          throw new Error(`Season ${index + 1}: ${priceField} is required and must be positive`);
        }
      });
    });
    return true;
  }),

  // No overlapping seasons
  validateNoDateOverlap("season_base_prices"),

  // ========================================
  // 5. OVERRIDE PRICES VALIDATION (Optional)
  // ========================================

  // Validate override_prices array structure
  validateOptionalArray("override_prices", 100), // Max 100 overrides

  // ---------- Override Fields ----------
  // Name: Required if override exists
  validateConditionalRequired("override_prices.*.name", "override_prices"),
  validateConditionalField("override_prices.*.name", "override_prices", (fieldName) => validateLength(fieldName, 2, 100)),

  // Price: Required if override exists
  validateConditionalRequired("override_prices.*.price", "override_prices"),
  validateConditionalField("override_prices.*.price", "override_prices", (fieldName) => validatePrice(fieldName)),

  // Date range: Required if override exists
  body("override_prices.*.start_date")
    .if(body("override_prices").exists())
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid date format"),

  body("override_prices.*.end_date")
    .if(body("override_prices").exists())
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value, { req, path }) => {
      const match = path.match(/\[(\d+)\]/);
      if (!match) return true;

      const index = parseInt(match[1]);
      const override = req.body.override_prices[index];

      const startDate = new Date(override.start_date);
      const endDate = new Date(value);

      if (endDate < startDate) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  // Is promotion: Required boolean if override exists
  validateConditionalRequired("override_prices.*.is_promotion", "override_prices"),
  validateConditionalField("override_prices.*.is_promotion", "override_prices", (fieldName) => validateBoolean(fieldName)),

  // Note: Optional text
  validateOptionalText("override_prices.*.note", 500),

  // Is active: Required boolean if override exists
  validateConditionalRequired("override_prices.*.is_active", "override_prices"),
  validateConditionalField("override_prices.*.is_active", "override_prices", (fieldName) => validateBoolean(fieldName)),

  // No overlapping active overrides
  body("override_prices").custom((overrides) => {
    if (!Array.isArray(overrides) || overrides.length < 2) return true;

    // Only check active overrides
    const activeOverrides = overrides.filter((o) => o.is_active === true);

    for (let i = 0; i < activeOverrides.length; i++) {
      for (let j = i + 1; j < activeOverrides.length; j++) {
        const range1 = activeOverrides[i];
        const range2 = activeOverrides[j];

        const start1 = new Date(range1.start_date);
        const end1 = new Date(range1.end_date);
        const start2 = new Date(range2.start_date);
        const end2 = new Date(range2.end_date);

        if (start1 <= end2 && start2 <= end1) {
          throw new Error(`Active override date ranges overlap: "${range1.name}" and "${range2.name}"`);
        }
      }
    }
    return true;
  }),

  // ========================================
  // 6. SEO DATA VALIDATION (Optional)
  // ========================================
  // Same as hotel - reuse existing validators

  validateOptionalArray("seo_data", 5), // Max 5 languages

  validateConditionalRequired("seo_data.*.slug", "seo_data"),
  validateConditionalField("seo_data.*.slug", "seo_data", (fieldName) => validateSlug(fieldName)),

  validateConditionalRequired("seo_data.*.lang", "seo_data"),
  validateConditionalField("seo_data.*.lang", "seo_data", (fieldName) => validateLanguageCode(fieldName)),

  validateConditionalRequired("seo_data.*.title", "seo_data"),
  validateConditionalField("seo_data.*.title", "seo_data", (fieldName) => validateTextContent(fieldName, 10, 150)),

  validateConditionalRequired("seo_data.*.description", "seo_data"),
  validateConditionalField("seo_data.*.description", "seo_data", (fieldName) => validateTextContent(fieldName, 10, 250)),

  validateConditionalField("seo_data.*.og_image", "seo_data", (fieldName) => validateURL(fieldName, false)),

  validateNoDuplicates("seo_data", "lang", "Duplicate language entries in SEO data"),

  // ========================================
  // 7. IMAGES DATA VALIDATION (Optional)
  // ========================================
  // Same as hotel - reuse existing validators

  validateOptionalArray("images", 50), // Max 50 images

  validateConditionalRequired("images.*.url", "images"),
  validateConditionalField("images.*.url", "images", (fieldName) => validateSupabaseStorageUrl(fieldName, true)),

  validateOptionalText("images.*.alt", 255),
  validateOptionalText("images.*.caption", 500),

  validateConditionalRequired("images.*.is_cover", "images"),
  validateConditionalField("images.*.is_cover", "images", (fieldName) => validateBoolean(fieldName)),

  validateSortOrder("images.*.sort_order"),

  validateExactlyOne("images", "is_cover", true, "Exactly one image must be marked as cover"),
  validateNoDuplicates("images", "url", "Duplicate image URLs"),
];
