// validators/hotel/hotel-create.validator.js

import { body } from "express-validator";
import {
  // Basic validators
  validateRequired,
  validateLength,
  validateBoolean,
  // String validators
  validateTextContent,
  validateOptionalText,
  validateEnglishPattern,
  validateSlug,
  validateLanguageCode,
  // Date & Time validators
  validateTime,
  // URL validators
  validateURL,
  validateGoogleMapsLink,
  validateSupabaseStorageUrl,
  // Array validators
  validateOptionalArray,
  validateUUIDArray,
  validateArrayMinItems,
  validateNoDuplicates,
  validateExactlyOne,
  // Conditional validators
  validateConditionalRequired,
  validateConditionalField,
  // Special validators
  validateSortOrder,
} from "../common.validator.js";

/**
 * Validation rules for hotel creation with SEO and images
 * POST /api/hotels
 *
 * Expected request structure:
 * {
 *   "hotel_data": { ... },      // Required: Basic hotel information
 *   "seo_data": [ ... ],        // Optional: SEO metadata for multiple languages
 *   "images": [ ... ]           // Optional: Hotel image gallery
 * }
 */
export const validateHotelCreate = [
  // ========================================
  // 1. HOTEL DATA VALIDATION (Required)
  // ========================================

  // Validate hotel_data object structure
  body("hotel_data").notEmpty().withMessage("Hotel data is required").isObject().withMessage("Hotel data must be an object"),

  // ---------- Hotel Names ----------
  // Thai name: Required, 2-200 characters
  validateRequired("hotel_data.name_th"),
  validateLength("hotel_data.name_th", 2, 200),
  body("hotel_data.name_th").trim(),

  // English name: Required, 2-200 characters, alphanumeric + punctuation
  validateRequired("hotel_data.name_en"),
  validateLength("hotel_data.name_en", 2, 200),
  validateEnglishPattern("hotel_data.name_en"),
  body("hotel_data.name_en").trim(),

  // ---------- Hotel Descriptions ----------
  // Thai excerpt: Required, 20-500 characters
  validateTextContent("hotel_data.excerpt_th", 20, 500),

  // English excerpt: Required, 20-500 characters
  validateTextContent("hotel_data.excerpt_en", 20, 500),

  // Thai description: Required, 50-5000 characters
  validateTextContent("hotel_data.description_th", 50, 5000),

  // English description: Required, 50-5000 characters
  validateTextContent("hotel_data.description_en", 50, 5000),

  // ---------- Hotel Operations ----------
  // Check-in time: Required, HH:MM format
  validateTime("hotel_data.checkin_time"),

  // Check-out time: Required, HH:MM format
  validateTime("hotel_data.checkout_time"),

  // ---------- Hotel Location & Media ----------
  // Main image: Required, valid URL
  validateSupabaseStorageUrl("hotel_data.image", true),

  // Thai location text: Required, 10-500 characters
  validateTextContent("hotel_data.location_txt_th", 10, 500),

  // English location text: Required, 10-500 characters
  validateTextContent("hotel_data.location_txt_en", 10, 500),

  // Google Maps link: Required, valid Google Maps URL
  validateGoogleMapsLink("hotel_data.google_map_link"),

  // ---------- Hotel Relations ----------
  // City IDs: Optional array of UUIDs, but if provided must have at least 1
  validateUUIDArray("hotel_data.city_ids", false, 0),
  validateArrayMinItems("hotel_data.city_ids", 1),

  // Hotel option IDs: Optional array of UUIDs
  validateUUIDArray("hotel_data.hotel_option_ids", false, 0),

  // ---------- Hotel Status ----------
  // Active status: Required boolean
  validateBoolean("hotel_data.is_active"),

  // ========================================
  // 2. SEO DATA VALIDATION (Optional)
  // ========================================

  // Validate seo_data array structure
  validateOptionalArray("seo_data"),

  // ---------- SEO Content Fields ----------
  // Slug: Required if seo_data exists, lowercase with hyphens
  validateConditionalRequired("seo_data.*.slug", "seo_data"),
  validateConditionalField("seo_data.*.slug", "seo_data", (fieldName) => validateSlug(fieldName)),

  // Language: Required if seo_data exists, must be 'th' or 'en'
  validateConditionalRequired("seo_data.*.lang", "seo_data"),
  validateConditionalField("seo_data.*.lang", "seo_data", (fieldName) => validateLanguageCode(fieldName)),

  // Title: Required if seo_data exists, 10-150 characters
  validateConditionalRequired("seo_data.*.title", "seo_data"),
  validateConditionalField("seo_data.*.title", "seo_data", (fieldName) => validateTextContent(fieldName, 10, 150)),

  // Description: Required if seo_data exists, 10-250 characters
  validateConditionalRequired("seo_data.*.description", "seo_data"),
  validateConditionalField("seo_data.*.description", "seo_data", (fieldName) => validateTextContent(fieldName, 10, 250)),

  // OG Image: Optional, valid URL
  validateConditionalField("seo_data.*.og_image", "seo_data", (fieldName) => validateURL(fieldName, false)),

  // ---------- SEO Data Constraints ----------
  // No duplicate languages in SEO data
  validateNoDuplicates("seo_data", "lang", "Duplicate language entries in SEO data"),

  // ========================================
  // 3. IMAGES DATA VALIDATION (Optional)
  // ========================================

  // Validate images array structure (max 50 images)
  validateOptionalArray("images", 50),

  // ---------- Image Fields ----------
  // URL: Required if images exists, must be from Supabase storage
  validateConditionalRequired("images.*.url", "images"),
  validateConditionalField("images.*.url", "images", (fieldName) => validateSupabaseStorageUrl(fieldName, true)),

  // Alt text: Optional, max 255 characters
  validateOptionalText("images.*.alt", 255),

  // Caption: Optional, max 500 characters
  validateOptionalText("images.*.caption", 500),

  // Cover image flag: Required if images exists
  validateConditionalRequired("images.*.is_cover", "images"),
  validateConditionalField("images.*.is_cover", "images", (fieldName) => validateBoolean(fieldName)),

  // Sort order: Optional, 0-999
  validateSortOrder("images.*.sort_order"),

  // ---------- Image Constraints ----------
  // Exactly one cover image required
  validateExactlyOne("images", "is_cover", true, "Exactly one image must be marked as cover"),

  // No duplicate image URLs
  validateNoDuplicates("images", "url", "Duplicate image URLs in the same request"),
];
