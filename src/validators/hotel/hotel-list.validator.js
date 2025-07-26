// validators/hotel/hotel-list.validator.js

import { validateOptionalQuerySlug, validateQueryLimit, validateQueryOffset } from "../common.query.validator.js";

/**
 * Validation rules for hotel list
 * GET /api/hotel/list?city_slug=xxx (optional)
 */
export const validateHotelList = [
  // City slug - OPTIONAL now
  validateOptionalQuerySlug("city_slug"),

  // Pagination
  validateQueryLimit(50),
  validateQueryOffset(),
];
