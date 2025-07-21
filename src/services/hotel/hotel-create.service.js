// services/hotel/hotel-create.service.js

import { hotelCreateRepository } from "../../repositories/hotel/hotel-create.repository.js";

/**
 * Create a new hotel
 * @param {Object} hotelData - Hotel data from controller
 * @returns {Promise<Object>} Created hotel
 */
export async function createHotel(hotelData) {
  try {
    // 1. Clean and prepare data
    const cleanedData = {
      name_th: hotelData.name_th.trim(),
      name_en: hotelData.name_en.trim(),
      excerpt_th: hotelData.excerpt_th.trim(),
      excerpt_en: hotelData.excerpt_en.trim(),
      description_th: hotelData.description_th.trim(),
      description_en: hotelData.description_en.trim(),
      checkin_time: hotelData.checkin_time,
      checkout_time: hotelData.checkout_time,
      image: hotelData.image.trim(),
      location_txt_th: hotelData.location_txt_th.trim(),
      location_txt_en: hotelData.location_txt_en.trim(),
      google_map_link: hotelData.google_map_link.trim(),
      is_active: hotelData.is_active,
      city_ids: hotelData.city_ids || [],
      hotel_option_ids: hotelData.hotel_option_ids || [],
    };

    // 2. Check if hotel name already exists
    const nameExists = await hotelCreateRepository.nameExists(cleanedData.name_th, cleanedData.name_en);

    if (nameExists) {
      const error = new Error("Hotel name already exists");
      error.code = "HOTEL_EXISTS";
      error.statusCode = 409;
      throw error;
    }

    // 3. Validate city IDs if provided
    if (cleanedData.city_ids.length > 0) {
      const validCities = await hotelCreateRepository.validateCityIds(cleanedData.city_ids);

      if (!validCities) {
        const error = new Error("One or more city IDs are invalid");
        error.code = "INVALID_CITY_ID";
        error.statusCode = 400;
        throw error;
      }
    }

    // 4. Validate hotel option IDs if provided
    if (cleanedData.hotel_option_ids.length > 0) {
      const validOptions = await hotelCreateRepository.validateHotelOptionIds(cleanedData.hotel_option_ids);

      if (!validOptions) {
        const error = new Error("One or more hotel option IDs are invalid");
        error.code = "INVALID_OPTION_ID";
        error.statusCode = 400;
        throw error;
      }
    }

    // 5. Create hotel in database with all related data
    const newHotel = await hotelCreateRepository.create(cleanedData);

    // 6. Log success
    console.log("Hotel created successfully:", {
      id: newHotel.id,
      name_en: newHotel.name_en,
      cities: cleanedData.city_ids.length,
      options: cleanedData.hotel_option_ids.length,
    });

    return newHotel;
  } catch (error) {
    // Log error for monitoring
    console.error("HotelCreateService error:", {
      code: error.code,
      message: error.message,
    });

    throw error;
  }
}

// Export as object for consistency
export const hotelCreateService = {
  create: createHotel,
};
