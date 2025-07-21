// constants/content-types.js

/**
 * Content types enum - used for both SEO metadata and image assets
 * Must match enum_content_target_type in database
 */
export const CONTENT_TYPES = {
  HOTEL: "hotel",
  ROOM: "room",
  CITY: "city",
  COUNTRY: "country",
  PAGE: "page",
  BLOG: "blog",
};

/**
 * Array of all content type values for validation
 */
export const CONTENT_TYPE_VALUES = Object.values(CONTENT_TYPES);

/**
 * Map content types to database table names
 */
export const CONTENT_TYPE_TABLE_MAP = {
  hotel: "hotels",
  room: "rooms",
  city: "cities",
  country: "countries",
  page: "pages",
  blog: "blogs",
};

/**
 * Get table name from content type
 * @param {string} type - Content type
 * @returns {string|null} Table name or null if invalid type
 */
export function getTableName(type) {
  return CONTENT_TYPE_TABLE_MAP[type] || null;
}
