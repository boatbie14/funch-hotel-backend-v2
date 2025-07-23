// controllers/hotel/hotel-create.controller.js

import { hotelCreateService } from "../../services/hotel/hotel-create.service.js";
import { seoMetadataCreateService } from "../../services/seo/seo-metadata-create.service.js";
import { imageCollectionService } from "../../services/image/image-collection.service.js";
import { supabase } from "../../config/database.js";

/**
 * Create a new hotel with optional SEO metadata and images
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 */
export const createHotel = async (req, res, next) => {
  // Track created resources for rollback
  let createdHotelId = null;
  let createdSeoIds = [];

  try {
    // Extract data from request
    const { hotel_data, seo_data, images } = req.body;

    // 1. Create hotel
    const newHotel = await hotelCreateService.create(hotel_data);
    createdHotelId = newHotel.id;

    // 2. Create SEO metadata (if provided)
    const seoResults = [];
    const seoErrors = [];

    if (seo_data?.length > 0) {
      for (const seo of seo_data) {
        try {
          const newSeo = await seoMetadataCreateService.create({
            ...seo,
            page_type: "hotel",
            page_id: newHotel.id,
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
          content_type: "hotel",
          content_id: newHotel.id,
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
      message: "Hotel created successfully",
      data: {
        hotel: newHotel,
        ...(seoResults.length > 0 && { seo_metadata: seoResults }),
        ...(seoErrors.length > 0 && { seo_errors: seoErrors }),
        ...(imageResults?.image_assets && { images: imageResults.image_assets }),
        ...(imageResults?.errors && { image_errors: imageResults.errors }),
        summary: {
          hotel_created: true,
          seo_created: seoResults.length,
          seo_failed: seoErrors.length,
          images_created: imageResults?.summary?.success || 0,
          images_failed: imageResults?.summary?.failed || 0,
        },
      },
    };

    const statusCode = seoErrors.length > 0 || imageResults?.errors ? 207 : 201;
    return res.status(statusCode).json(response);
  } catch (error) {
    // Rollback on error
    try {
      if (createdSeoIds.length > 0) {
        await supabase.from("seo_metadata").delete().in("id", createdSeoIds);
      }
      if (createdHotelId) {
        await supabase.from("hotels").delete().eq("id", createdHotelId);
      }
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }

    next(error);
  }
};
