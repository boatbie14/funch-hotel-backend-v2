// services/room/room-list.service.js

import { roomListRepository } from "../../repositories/room/room-list.repository.js";

/**
 * Get rooms by hotel slug
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Rooms data
 */
export async function getRoomsByHotelSlug(params) {
  try {
    const { hotelSlug, limit = 20, offset = 0 } = params;

    // Validate slug
    if (!hotelSlug) {
      const error = new Error("Hotel slug is required");
      error.code = "MISSING_SLUG";
      error.statusCode = 400;
      throw error;
    }

    // Get rooms from repository
    const result = await roomListRepository.getRoomsByHotelSlug(hotelSlug, limit, offset);

    // Log for monitoring
    console.log("Room list fetched:", {
      hotel_slug: hotelSlug,
      count: result.rooms.length,
      total: result.pagination.total,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    // Log error
    console.error("RoomListService error:", {
      message: error.message,
      code: error.code,
      hotelSlug: params.hotelSlug,
    });

    throw error;
  }
}

// Export as object
export const roomListService = {
  getRoomsByHotelSlug,
};
