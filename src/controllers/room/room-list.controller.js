// controllers/room/room-list.controller.js

import { roomListService } from "../../services/room/room-list.service.js";

/**
 * Get list of rooms by hotel slug
 * GET /api/room/list?hotel_slug=xxx
 */
export async function getRoomList(req, res, next) {
  try {
    // Extract query parameters
    const { hotel_slug, limit, offset } = req.query;

    // Get rooms from service
    const result = await roomListService.getRoomsByHotelSlug({
      hotelSlug: hotel_slug,
      limit: limit || 20,
      offset: offset || 0,
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
    console.error("Room list controller error:", error);

    // Pass to error handler
    next(error);
  }
}
