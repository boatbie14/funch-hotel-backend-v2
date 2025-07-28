// controllers/hotel/hotel-list.controller.js

import { hotelListService } from "../../services/hotel/hotel-list.service.js";

/**
 * Get list of hotels (all or by city)
 * GET /api/hotel/list?city_slug=xxx (optional)
 */
export async function getHotelList(req, res, next) {
  try {
    // Extract query parameters
    const { city_slug, limit, offset } = req.query;

    // Get hotels from service
    const result = await hotelListService.getHotels({
      citySlug: city_slug,
      limit,
      offset,
    });

    // Return success response
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Handle known errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    // Log unexpected errors
    console.error("Hotel list controller error:", error);

    // Pass to error handler
    next(error);
  }
}
