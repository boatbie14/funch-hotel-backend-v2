// services/hotel/hotel-list.service.js

import { hotelListRepository } from "../../repositories/hotel/hotel-list.repository.js";

/**
 * Get hotels (all or by city)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Hotels data
 */
export async function getHotels(params) {
  try {
    const { citySlug, limit = 20, offset = 0 } = params;

    let result;

    // If citySlug provided, get hotels by city
    if (citySlug) {
      result = await hotelListRepository.getHotelsByCitySlug(citySlug, limit, offset);
    } else {
      // Otherwise, get all hotels with pagination
      result = await hotelListRepository.getAllHotels(limit, offset);
    }

    // Log for monitoring
    console.log("Hotel list fetched:", {
      type: citySlug ? "by_city" : "all",
      city_slug: citySlug || null,
      count: result.total || result.hotels.length,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    // Log error
    console.error("HotelListService error:", {
      message: error.message,
      code: error.code,
      citySlug: params.citySlug,
    });

    throw error;
  }
}

// Export as object
export const hotelListService = {
  getHotels,
};
