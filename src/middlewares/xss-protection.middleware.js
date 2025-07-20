// middleware/xss.middleware.js

import DOMPurify from "isomorphic-dompurify";

/**
 * XSS Prevention Middleware
 * Sanitizes request body, query, and params to prevent XSS attacks
 *
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.skipFields - Fields to skip sanitization (e.g., passwords)
 * @param {boolean} options.stripTags - Whether to strip all HTML tags (default: true)
 * @param {Array<string>} options.allowedTags - HTML tags to allow if stripTags is false
 * @param {Array<string>} options.allowedAttributes - HTML attributes to allow
 */
export const xssPrevent = (options = {}) => {
  const {
    skipFields = ["password", "confirmPassword", "oldPassword", "newPassword"],
    stripTags = true,
    allowedTags = [],
    allowedAttributes = [],
  } = options;

  // Configure DOMPurify options
  const purifyConfig = stripTags
    ? { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }
    : {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: allowedAttributes,
        KEEP_CONTENT: true,
      };

  /**
   * Recursively sanitize object properties
   * @param {*} data - Data to sanitize
   * @param {string} fieldPath - Current field path for nested objects
   * @returns {*} Sanitized data
   */
  const sanitizeData = (data, fieldPath = "") => {
    // Handle null/undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item, index) => sanitizeData(item, `${fieldPath}[${index}]`));
    }

    // Handle objects
    if (typeof data === "object" && data.constructor === Object) {
      const sanitized = {};

      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const currentPath = fieldPath ? `${fieldPath}.${key}` : key;

          // Skip fields like passwords
          if (skipFields.includes(key) || skipFields.includes(currentPath)) {
            sanitized[key] = data[key];
          } else {
            sanitized[key] = sanitizeData(data[key], currentPath);
          }
        }
      }

      return sanitized;
    }

    // Handle strings - main XSS prevention
    if (typeof data === "string") {
      // First, decode any HTML entities to catch encoded XSS attempts
      const decoded = decodeHTMLEntities(data);

      // Then sanitize with DOMPurify
      const sanitized = DOMPurify.sanitize(decoded, purifyConfig);

      // Additional protection: remove dangerous patterns
      return removeDangerousPatterns(sanitized);
    }

    // Return other types as-is (numbers, booleans, etc.)
    return data;
  };

  /**
   * Decode HTML entities to catch encoded XSS attempts
   * @param {string} str - String to decode
   * @returns {string} Decoded string
   */
  const decodeHTMLEntities = (str) => {
    const entities = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&#x27;": "'",
      "&#x2F;": "/",
      "&#x5C;": "\\",
      "&#x3D;": "=",
    };

    return str.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
  };

  /**
   * Remove additional dangerous patterns
   * @param {string} str - String to clean
   * @returns {string} Cleaned string
   */
  const removeDangerousPatterns = (str) => {
    // Remove javascript: protocol
    str = str.replace(/javascript:/gi, "");

    // Remove data: protocol (except safe image formats)
    str = str.replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64)/gi, "");

    // Remove vbscript: protocol
    str = str.replace(/vbscript:/gi, "");

    // Remove on* event handlers
    str = str.replace(/on\w+\s*=/gi, "");

    // Remove potentially dangerous attributes
    str = str.replace(/\s*(href|src|action)\s*=\s*["']?\s*javascript:/gi, "");

    return str;
  };

  // Return middleware function
  return (req, res, next) => {
    try {
      // Sanitize body
      if (req.body && typeof req.body === "object") {
        req.body = sanitizeData(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === "object") {
        req.query = sanitizeData(req.query);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === "object") {
        req.params = sanitizeData(req.params);
      }

      next();
    } catch (error) {
      console.error("XSS Prevention Middleware Error:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing request",
      });
    }
  };
};

/**
 * Pre-configured XSS prevention for general use
 * Strips all HTML tags and attributes
 */
export const xssClean = xssPrevent();

/**
 * XSS prevention that allows basic formatting tags
 * Useful for fields that need basic HTML like descriptions
 */
export const xssCleanWithFormatting = xssPrevent({
  stripTags: false,
  allowedTags: ["b", "i", "em", "strong", "u", "p", "br", "ul", "ol", "li"],
  allowedAttributes: [],
});

/**
 * Strict XSS prevention for critical fields
 * Also removes additional patterns and validates input length
 */
export const xssCleanStrict = (maxLength = 1000) => {
  return (req, res, next) => {
    // First apply standard XSS cleaning
    xssClean(req, res, (err) => {
      if (err) return next(err);

      // Additional validation for string length
      const validateLength = (data, path = "") => {
        if (typeof data === "string" && data.length > maxLength) {
          return res.status(400).json({
            success: false,
            message: `Input too long at ${path || "field"}`,
          });
        }

        if (typeof data === "object" && data !== null) {
          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              const currentPath = path ? `${path}.${key}` : key;
              validateLength(data[key], currentPath);
            }
          }
        }
      };

      // Validate all input sources
      if (req.body) validateLength(req.body, "body");
      if (req.query) validateLength(req.query, "query");
      if (req.params) validateLength(req.params, "params");

      next();
    });
  };
};
