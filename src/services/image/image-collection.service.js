// services/image/image-collection.service.js

import { imageCollectionRepository } from "../../repositories/image/image-collection.repository.js";

/**
 * Create image collection for an entity
 * @param {Object} requestData - Request data from controller
 * @returns {Promise<Object>} Created images and summary
 */
export async function createImageCollection(requestData) {
  try {
    const { content_type, content_id, images } = requestData;

    // 1. Get existing images to check if we need to update cover status
    const existingImages = await imageCollectionRepository.getExistingImages(content_type, content_id);

    // 2. Check if any new image is marked as cover
    const newCoverImage = images.find((img) => img.is_cover === true);
    const hasExistingCover = existingImages.some((img) => img.is_cover === true);

    // 3. If new cover image and existing cover exists, remove old cover status
    if (newCoverImage && hasExistingCover) {
      await imageCollectionRepository.removeCoverStatus(content_type, content_id);
    }

    // 4. Check for duplicate URLs before processing
    const processedImages = [];
    const duplicateErrors = [];

    for (const image of images) {
      const isDuplicate = await imageCollectionRepository.checkDuplicateImageUrl(image.url, content_type, content_id);

      if (isDuplicate) {
        duplicateErrors.push({
          url: image.url,
          error: "This image URL already exists for this entity",
          code: "DUPLICATE_IMAGE",
        });
      } else {
        processedImages.push({
          content_type,
          content_id,
          url: image.url.trim(),
          alt: image.alt?.trim() || null,
          caption: image.caption?.trim() || null,
          is_cover: image.is_cover,
          sort_order: image.sort_order || 0,
        });
      }
    }

    // 5. If all images are duplicates, return error
    if (processedImages.length === 0 && duplicateErrors.length > 0) {
      const error = new Error("All images already exist for this entity");
      error.code = "ALL_DUPLICATES";
      error.statusCode = 409;
      error.details = duplicateErrors;
      throw error;
    }

    // 6. Create image assets in database
    const results = await imageCollectionRepository.create(processedImages);

    // 7. Combine results
    const allFailed = [...duplicateErrors, ...results.failed];
    const totalRequested = images.length;
    const totalSuccess = results.successful.length;
    const totalFailed = allFailed.length;

    // 8. Log operation
    console.log("Image collection creation completed:", {
      content_type: content_type,
      content_id: content_id,
      total: totalRequested,
      success: totalSuccess,
      failed: totalFailed,
    });

    // 9. Determine response status and format
    if (totalSuccess === 0) {
      // All failed
      const error = new Error("Failed to create any image assets");
      error.code = "ALL_FAILED";
      error.statusCode = 400;
      error.details = allFailed;
      throw error;
    }

    // Return success or partial success
    return {
      image_assets: results.successful,
      errors: allFailed.length > 0 ? allFailed : undefined,
      summary: {
        total: totalRequested,
        success: totalSuccess,
        failed: totalFailed,
      },
      status: totalFailed > 0 ? 207 : 201, // Multi-status or Created
    };
  } catch (error) {
    // Log error for monitoring
    console.error("ImageCollectionService error:", {
      code: error.code,
      message: error.message,
      details: error.details,
    });

    throw error;
  }
}

// Export as object for consistency
export const imageCollectionService = {
  create: createImageCollection,
};
