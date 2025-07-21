// controllers/image/image-collection.controller.js

import { imageCollectionService } from "../../services/image/image-collection.service.js";

/**
 * Create image collection for an entity
 * POST /api/image-collection
 */
export async function createImageCollection(req, res, next) {
  try {
    // Extract data from request body
    const imageCollectionData = {
      content_type: req.body.content_type,
      content_id: req.body.content_id,
      images: req.body.images,
    };

    // Call service to create image collection
    const result = await imageCollectionService.create(imageCollectionData);

    // Determine status code based on result
    const statusCode = result.status || 201;

    // Return response
    return res.status(statusCode).json({
      success: true,
      message:
        result.summary.failed > 0
          ? `Created ${result.summary.success} of ${result.summary.total} images`
          : `Successfully created ${result.summary.success} images`,
      data: {
        image_assets: result.image_assets,
        ...(result.errors && { errors: result.errors }),
        summary: result.summary,
      },
    });
  } catch (error) {
    // Handle known errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: {
          code: error.code,
          ...(error.field && { field: error.field }),
          ...(error.details && { details: error.details }),
        },
      });
    }

    // Log unexpected errors
    console.error("Image collection controller error:", error);

    // Pass to error handler middleware
    next(error);
  }
}
