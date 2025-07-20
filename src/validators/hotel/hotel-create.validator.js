// validators/hotel/hotel-create.validator.js

import { body } from "express-validator";
import {
  validateRequired,
  validateLength,
  validateTime,
  validateGoogleMapsLink,
  validateURL,
  validateUUIDArray,
  validateTextContent,
  validateBoolean,
} from "../common.validator.js";

/**
 * Validation rules for hotel creation
 * POST /api/hotels
 */
export const validateHotelCreate = [
  // Thai name - required, 2-200 characters
  validateRequired("name_th"),
  validateLength("name_th", 2, 200),
  body("name_th").trim(),

  // English name - required, 2-200 characters
  validateRequired("name_en"),
  validateLength("name_en", 2, 200),
  body("name_en")
    .matches(/^[a-zA-Z0-9\s\-'&.,()]+$/)
    .withMessage("Hotel name (English) can only contain letters, numbers, spaces, and common punctuation")
    .trim(),

  // Thai excerpt - required, 50-500 characters
  validateTextContent("excerpt_th", 20, 500),

  // English excerpt - required, 50-500 characters
  validateTextContent("excerpt_en", 20, 500),

  // Thai description - required, 100-5000 characters
  validateTextContent("description_th", 50, 5000),

  // English description - required, 100-5000 characters
  validateTextContent("description_en", 50, 5000),

  // Check-in time - required, HH:MM format
  validateTime("checkin_time"),

  // Check-out time - required, HH:MM format
  validateTime("checkout_time"),

  // Main image URL - required
  validateURL("image", true),

  // Thai location text - required, 10-500 characters
  validateTextContent("location_txt_th", 10, 500),

  // English location text - required, 10-500 characters
  validateTextContent("location_txt_en", 10, 500),

  // Google Maps link - required
  validateGoogleMapsLink("google_map_link"),

  // City IDs - optional array of UUIDs, but if provided must have at least 1
  validateUUIDArray("city_ids", false, 0),
  body("city_ids").custom((value) => {
    if (Array.isArray(value) && value.length === 0) {
      throw new Error("At least one city must be selected");
    }
    return true;
  }),

  // Hotel option IDs - optional array of UUIDs
  validateUUIDArray("hotel_option_ids", false, 0),

  // Active status - required boolean
  validateBoolean("is_active"),
];
