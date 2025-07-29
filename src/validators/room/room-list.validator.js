// validators/room/room-list.validator.js

import { validateQuerySlug, validateQueryLimit, validateQueryOffset } from "../common.query.validator.js";

/**
 * Validation rules for room list
 * GET /api/room/list?hotel_slug=xxx
 */
export const validateRoomList = [
  // Hotel slug - required
  validateQuerySlug("hotel_slug"),

  // Pagination
  validateQueryLimit(50),
  validateQueryOffset(),
];
