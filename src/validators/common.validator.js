//validators/common.validator.js

import { body, param, query } from "express-validator";

/**
 * Validate required field (just check if exists)
 */
export const validateRequired = (fieldName, location = "body") => {
  let validator;

  switch (location) {
    case "query":
      validator = query(fieldName);
      break;
    case "param":
      validator = param(fieldName);
      break;
    default:
      validator = body(fieldName);
  }

  return validator.notEmpty().withMessage(`${fieldName} is required`);
};

/**
 * Validate string length
 */
export const validateLength = (fieldName, min, max) =>
  body(fieldName).isLength({ min, max }).withMessage(`${fieldName} must be between ${min}-${max} characters`);

/**
 * Email validator
 */
export const validateEmail = (fieldName = "email") =>
  body(fieldName).notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format").normalizeEmail().trim();

/**
 * Password validator with strength requirements
 */
export const validatePassword = (fieldName = "password") =>
  body(fieldName)
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain uppercase, lowercase, number and special character");

/**
 * Phone validator - supports international format
 * Examples: +66812345678, 0812345678, +1-555-123-4567
 */
export const validatePhone = (fieldName = "phone") =>
  body(fieldName)
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^(\+?[0-9]{1,4})?[-.\s]?(\(?[0-9]{1,4}\)?)?[-.\s]?[0-9]{1,5}[-.\s]?[0-9]{1,5}$/)
    .withMessage("Invalid phone number format")
    .customSanitizer((value) => value.replace(/[-.\s()]/g, "")) // Clean format
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone number must be between 7-20 digits");

/**
 * Date validator - just check ISO8601 format
 */
export const validateDate = (fieldName = "date") =>
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isISO8601()
    .withMessage("Invalid date format. Use YYYY-MM-DD or ISO8601 format");

/**
 * Future date validator - for bookings (today or future)
 */
export const validateFutureDate = (fieldName) =>
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      inputDate.setHours(0, 0, 0, 0);

      if (inputDate < today) {
        throw new Error(`${fieldName} cannot be in the past`);
      }
      return true;
    });

/**
 * Date range validator for check-in/check-out
 */
export const validateDateRange = (startField = "start_date", endField = "end_date") => [
  body(startField).notEmpty().withMessage("Start date is required").isISO8601().withMessage("Invalid start date format"),
  body(endField)
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid end date format")
    .custom((value, { req }) => {
      const startDate = new Date(req.body[startField]);
      const endDate = new Date(value);

      // Allow same day (for day-use rooms)
      if (endDate < startDate) {
        throw new Error("End date must be on or after start date");
      }
      return true;
    }),
];

/**
 * Number validator - must be numeric
 */
export const validateNumber = (fieldName) =>
  body(fieldName).notEmpty().withMessage(`${fieldName} is required`).isNumeric().withMessage(`${fieldName} must be a number`);

/**
 * Positive number validator (> 0)
 */
export const validatePositiveNumber = (fieldName) =>
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isFloat({ min: 0.01 })
    .withMessage(`${fieldName} must be greater than 0`);

/**
 * Price validator - positive number with max 2 decimal places
 */
export const validatePrice = (fieldName = "price") =>
  body(fieldName)
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .custom((value) => {
      // Check decimal places (max 2)
      const decimalPlaces = (value.toString().split(".")[1] || "").length;
      if (decimalPlaces > 2) {
        throw new Error("Price can have maximum 2 decimal places");
      }
      return true;
    });

/**
 * Boolean validator
 */
export const validateBoolean = (fieldName) =>
  body(fieldName).notEmpty().withMessage(`${fieldName} is required`).isBoolean().withMessage(`${fieldName} must be true or false`);

/**
 * UUID validator (v4)
 */
export const validateUUID = (fieldName = "id", location = "param") => {
  let validator;

  switch (location) {
    case "body":
      validator = body(fieldName);
      break;
    case "query":
      validator = query(fieldName);
      break;
    default:
      validator = param(fieldName);
  }

  return validator.notEmpty().withMessage(`${fieldName} is required`).isUUID(4).withMessage(`Invalid ${fieldName} format`);
};

/**
 * Pagination validators
 */
export const validatePagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),
  query("sort")
    .optional()
    .matches(/^[a-zA-Z_]+:(asc|desc)$/)
    .withMessage("Sort format must be field:asc or field:desc"),
];

/**
 * Make any validator optional
 * Usage: makeOptional(validatePhone('phone2'))
 */
export const makeOptional = (validator) => validator.optional({ nullable: true, checkFalsy: true });

// เพิ่มใน common.validator.js

/**
 * Time validator - HH:MM format (24-hour)
 * Examples: "14:00", "09:30", "23:59"
 */
export const validateTime = (fieldName) =>
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage(`${fieldName} must be in HH:MM format (24-hour)`);

/**
 * Google Maps link validator
 * Supports both short links (maps.app.goo.gl) and full links (maps.google.com)
 */
export const validateGoogleMapsLink = (fieldName = "google_map_link") =>
  body(fieldName)
    .notEmpty()
    .withMessage("Google Maps link is required")
    .isURL()
    .withMessage("Invalid URL format")
    .matches(/^https:\/\/(maps\.app\.goo\.gl\/[a-zA-Z0-9]+|maps\.google\.com\/.+|goo\.gl\/maps\/[a-zA-Z0-9]+)/)
    .withMessage("Invalid Google Maps link format");

/**
 * URL validator - general purpose
 */
export const validateURL = (fieldName, required = true) => {
  const validator = body(fieldName);

  if (!required) {
    return validator.optional({ nullable: true, checkFalsy: true }).isURL().withMessage(`Invalid ${fieldName} URL format`);
  }

  return validator.notEmpty().withMessage(`${fieldName} is required`).isURL().withMessage(`Invalid ${fieldName} URL format`);
};

/**
 * Array of UUIDs validator
 * For validating arrays like city_ids, option_ids
 */
export const validateUUIDArray = (fieldName, required = false, minItems = 0) => {
  const validator = body(fieldName);

  if (!required && minItems === 0) {
    return validator
      .optional({ nullable: true })
      .isArray()
      .withMessage(`${fieldName} must be an array`)
      .custom((value) => {
        if (!Array.isArray(value)) return true; // Already validated above

        for (const item of value) {
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item)) {
            throw new Error(`Invalid UUID format in ${fieldName}`);
          }
        }
        return true;
      });
  }

  return validator
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isArray({ min: minItems })
    .withMessage(`${fieldName} must be an array with at least ${minItems} item(s)`)
    .custom((value) => {
      for (const item of value) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item)) {
          throw new Error(`Invalid UUID format in ${fieldName}`);
        }
      }
      return true;
    });
};

/**
 * Text content validator with min/max length
 * For fields like description, excerpt
 */
export const validateTextContent = (fieldName, minLength = 10, maxLength = 5000) =>
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${fieldName} must be between ${minLength}-${maxLength} characters`)
    .trim();

/**
 * Slug validator
 * For SEO-friendly URLs: lowercase, hyphens only
 */
export const validateSlug = (fieldName = "slug") =>
  body(fieldName)
    .notEmpty()
    .withMessage("Slug is required")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers, and hyphens only")
    .isLength({ min: 3, max: 100 })
    .withMessage("Slug must be between 3-100 characters");

/**
 * Language code validator
 * For language selection: th, en
 */
export const validateLanguageCode = (fieldName = "lang") =>
  body(fieldName).notEmpty().withMessage("Language is required").isIn(["th", "en"]).withMessage("Language must be 'th' or 'en'");
