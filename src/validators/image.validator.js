//validators/image.validator.js
import { body } from "express-validator";

/**
 * Validate single image URL from Supabase storage
 * @param {string} fieldName - Field name to validate
 * @param {boolean} required - Whether field is required
 * @returns {ValidationChain}
 */
export const validateImageUrl = (fieldName = "image", required = false) => {
  const validator = body(fieldName);

  if (!required) {
    return validator
      .optional({ nullable: true, checkFalsy: true })
      .isURL()
      .withMessage("Invalid image URL")
      .matches(/^https:\/\/.*\.supabase\.co\/storage\/.*/)
      .withMessage("Image must be from Supabase storage");
  }

  return validator
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isURL()
    .withMessage("Invalid image URL")
    .matches(/^https:\/\/.*\.supabase\.co\/storage\/.*/)
    .withMessage("Image must be from Supabase storage");
};

// Pre-configured validators for common use cases
export const validateUserImage = validateImageUrl("user_image", false);
