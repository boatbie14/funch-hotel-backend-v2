// repositories/image/image-collection.repository.js

import { supabase } from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Create multiple image assets
 * @param {Array<Object>} imagesData - Array of image data to insert
 * @returns {Promise<Object>} Result with successful and failed operations
 */
export async function createImageAssets(imagesData) {
  const results = {
    successful: [],
    failed: [],
  };

  try {
    // Process each image
    for (const imageData of imagesData) {
      try {
        const id = uuidv4();

        const newImageAsset = {
          id,
          content_type: imageData.content_type, // ใช้ชื่อ column ใหม่
          content_id: imageData.content_id, // ใช้ชื่อ column ใหม่
          url: imageData.url,
          alt: imageData.alt || null,
          caption: imageData.caption || null,
          is_cover: imageData.is_cover,
          sort_order: imageData.sort_order || 0,
        };

        const { data, error } = await supabase.from("image_assets").insert(newImageAsset).select().single();

        if (error) {
          throw error;
        }

        results.successful.push(data);
      } catch (error) {
        results.failed.push({
          url: imageData.url,
          error: error.message,
          code: getErrorCode(error),
        });
      }
    }

    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if image URL already exists for the entity
 * @param {string} url - Image URL to check
 * @param {string} contentType - Type of content
 * @param {string} contentId - UUID of the content
 * @returns {Promise<boolean>} True if URL exists
 */
export async function checkDuplicateImageUrl(url, contentType, contentId) {
  try {
    const { data, error } = await supabase
      .from("image_assets")
      .select("id")
      .eq("url", url)
      .eq("content_type", contentType) // ใช้ชื่อ column ใหม่
      .eq("content_id", contentId)
      .single();

    if (error) {
      // PGRST116 means no rows found
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    return !!data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get existing images for content (to check/update cover image)
 * @param {string} contentType - Type of content
 * @param {string} contentId - UUID of the content
 * @returns {Promise<Array>} Array of existing images
 */
export async function getExistingImages(contentType, contentId) {
  try {
    const { data, error } = await supabase
      .from("image_assets")
      .select("id, url, is_cover, sort_order")
      .eq("content_type", contentType) // ใช้ชื่อ column ใหม่
      .eq("content_id", contentId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Update existing images to remove cover status
 * @param {string} contentType - Type of content
 * @param {string} contentId - UUID of the content
 * @returns {Promise<void>}
 */
export async function removeCoverStatus(contentType, contentId) {
  try {
    const { error } = await supabase
      .from("image_assets")
      .update({ is_cover: false })
      .eq("content_type", contentType) // ใช้ชื่อ column ใหม่
      .eq("content_id", contentId)
      .eq("is_cover", true);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Helper function to determine error code
 * @param {Object} error - Supabase error object
 * @returns {string} Error code
 */
function getErrorCode(error) {
  // Handle Supabase error codes
  if (error.code === "23505") {
    return "DUPLICATE_IMAGE";
  }
  if (error.code === "23503") {
    return "INVALID_REFERENCE";
  }
  if (error.code === "23502") {
    return "MISSING_FIELD";
  }

  // Custom error codes
  if (error.message?.includes("duplicate")) {
    return "DUPLICATE_IMAGE";
  }

  return "INSERT_FAILED";
}

// Export as object for consistency
export const imageCollectionRepository = {
  create: createImageAssets,
  checkDuplicateImageUrl,
  getExistingImages,
  removeCoverStatus,
};
