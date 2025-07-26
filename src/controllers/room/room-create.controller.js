// controllers/room/room-create.controller.js

import { roomCreateService } from "../../services/room/room-create.service.js";
import { seoMetadataCreateService } from "../../services/seo/seo-metadata-create.service.js";
import { imageCollectionService } from "../../services/image/image-collection.service.js";
import { supabase } from "../../config/database.js";

/**
 * Create a new room with pricing, optional SEO metadata and images
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 */
export const createRoom = async (req, res, next) => {
  // Track created resources for rollback
  let createdRoomId = null;
  let createdSeoIds = [];

  try {
    // Extract data from request
    const { room_data, room_option_ids, base_price, season_base_prices, override_prices, seo_data, images } = req.body;

    // 1. Create room with all pricing data
    const roomResult = await roomCreateService.create({
      room_data,
      room_option_ids,
      base_price,
      season_base_prices,
      override_prices,
    });

    createdRoomId = roomResult.room.id;

    // 2. Create SEO metadata (if provided)
    const seoResults = [];
    const seoErrors = [];

    if (seo_data?.length > 0) {
      for (const seo of seo_data) {
        try {
          const newSeo = await seoMetadataCreateService.create({
            ...seo,
            page_type: "room",
            page_id: createdRoomId,
          });
          seoResults.push(newSeo);
          createdSeoIds.push(newSeo.id);
        } catch (error) {
          seoErrors.push({
            lang: seo.lang,
            error: error.message,
            code: error.code,
          });
        }
      }
    }

    // 3. Create image collection (if provided)
    let imageResults = null;

    if (images?.length > 0) {
      try {
        imageResults = await imageCollectionService.create({
          content_type: "room",
          content_id: createdRoomId,
          images: images,
        });
      } catch (error) {
        imageResults = {
          error: error.message,
          code: error.code,
        };
      }
    }

    // 4. Check if all SEO failed (critical error)
    if (seo_data?.length > 0 && seoResults.length === 0) {
      throw new Error("Failed to create any SEO metadata");
    }

    // 5. Prepare response
    const response = {
      success: true,
      message: "Room created successfully",
      data: {
        room: roomResult.room,
        base_price: roomResult.base_price,
        room_option_ids: roomResult.room_option_ids,
        ...(roomResult.season_base_prices.length > 0 && {
          season_base_prices: roomResult.season_base_prices,
        }),
        ...(roomResult.override_prices.length > 0 && {
          override_prices: roomResult.override_prices,
        }),
        ...(seoResults.length > 0 && { seo_metadata: seoResults }),
        ...(seoErrors.length > 0 && { seo_errors: seoErrors }),
        ...(imageResults?.image_assets && { images: imageResults.image_assets }),
        ...(imageResults?.errors && { image_errors: imageResults.errors }),
        summary: {
          room_created: true,
          options_linked: roomResult.room_option_ids.length,
          seasons_created: roomResult.season_base_prices.length,
          overrides_created: roomResult.override_prices.length,
          seo_created: seoResults.length,
          seo_failed: seoErrors.length,
          images_created: imageResults?.summary?.success || 0,
          images_failed: imageResults?.summary?.failed || 0,
        },
      },
    };

    // 6. Determine status code
    const hasPartialFailure = seoErrors.length > 0 || imageResults?.errors;
    const statusCode = hasPartialFailure ? 207 : 201;

    return res.status(statusCode).json(response);
  } catch (error) {
    // Rollback on error
    try {
      // Delete SEO metadata if created
      if (createdSeoIds.length > 0) {
        await supabase.from("seo_metadata").delete().in("id", createdSeoIds);
      }

      // Delete room and all related data
      if (createdRoomId) {
        // Import from repository to use cascade delete
        const { roomCreateRepository } = await import("../../repositories/room/room-create.repository.js");
        await roomCreateRepository.deleteRoomCascade(createdRoomId);
      }
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }

    // Handle known errors with proper status codes
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
    console.error("Room create controller error:", error);

    // Pass to error handler middleware
    next(error);
  }
};
