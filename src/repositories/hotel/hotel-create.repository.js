// repositories/hotel/hotel-create.repository.js

import { supabase } from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new hotel with basic information
 * @param {Object} hotelData - Hotel data to insert
 * @returns {Promise<Object>} Created hotel
 */
export async function createHotel(hotelData) {
  try {
    const id = uuidv4();

    // Log data before insert
    const insertData = {
      id,
      name_th: hotelData.name_th,
      name_en: hotelData.name_en,
      excerpt_th: hotelData.excerpt_th,
      excerpt_en: hotelData.excerpt_en,
      description_th: hotelData.description_th,
      description_en: hotelData.description_en,
      checkin_time: hotelData.checkin_time,
      checkout_time: hotelData.checkout_time,
      image: hotelData.image,
      location_txt_th: hotelData.location_txt_th,
      location_txt_en: hotelData.location_txt_en,
      google_map_link: hotelData.google_map_link,
      is_active: hotelData.is_active ?? true,
    };

    console.log("Inserting hotel data:", insertData);

    // Start a Supabase transaction
    const { data: hotel, error: hotelError } = await supabase.from("hotels").insert(insertData).select().single();

    if (hotelError) {
      console.error("Supabase error details:", {
        code: hotelError.code,
        message: hotelError.message,
        details: hotelError.details,
        hint: hotelError.hint,
      });
      handleHotelError(hotelError);
    }

    // Create city mappings if provided
    if (hotelData.city_ids && hotelData.city_ids.length > 0) {
      const cityMappings = hotelData.city_ids.map((cityId) => ({
        id: uuidv4(),
        hotel_id: id,
        city_id: cityId,
      }));

      const { error: cityError } = await supabase.from("hotels_cities_map").insert(cityMappings);

      if (cityError) {
        // Rollback by deleting the hotel
        await supabase.from("hotels").delete().eq("id", id);

        const mappingError = new Error("Failed to create city mappings");
        mappingError.code = "CITY_MAPPING_ERROR";
        mappingError.details = cityError;
        throw mappingError;
      }
    }

    // Create hotel options mappings if provided
    if (hotelData.hotel_option_ids && hotelData.hotel_option_ids.length > 0) {
      const optionMappings = hotelData.hotel_option_ids.map((optionId) => ({
        id: uuidv4(),
        hotel_id: id,
        hotel_option_id: optionId,
      }));

      const { error: optionError } = await supabase.from("hotels_options_map").insert(optionMappings);

      if (optionError) {
        // Rollback by deleting the hotel and city mappings
        await supabase.from("hotels_cities_map").delete().eq("hotel_id", id);
        await supabase.from("hotels").delete().eq("id", id);

        const mappingError = new Error("Failed to create option mappings");
        mappingError.code = "OPTION_MAPPING_ERROR";
        mappingError.details = optionError;
        throw mappingError;
      }
    }

    return hotel;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if hotel name exists (Thai or English)
 * @param {string} nameTh - Thai name to check
 * @param {string} nameEn - English name to check
 * @param {string} excludeId - Hotel ID to exclude (for updates)
 * @returns {Promise<boolean>} True if exists
 */
export async function hotelNameExists(nameTh, nameEn, excludeId = null) {
  try {
    let query = supabase.from("hotels").select("id").or(`name_th.eq.${nameTh},name_en.eq.${nameEn}`);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.single();

    if (error) {
      // If error code is PGRST116, it means no rows found
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    // If data exists, hotel name is already taken
    return !!data;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate city IDs exist
 * @param {string[]} cityIds - Array of city IDs to validate
 * @returns {Promise<boolean>} True if all exist
 */
export async function validateCityIds(cityIds) {
  if (!cityIds || cityIds.length === 0) return true;

  try {
    const { data, error } = await supabase.from("cities").select("id").in("id", cityIds);

    if (error) throw error;

    return data.length === cityIds.length;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate hotel option IDs exist
 * @param {string[]} optionIds - Array of option IDs to validate
 * @returns {Promise<boolean>} True if all exist
 */
export async function validateHotelOptionIds(optionIds) {
  if (!optionIds || optionIds.length === 0) return true;

  try {
    const { data, error } = await supabase.from("hotel_options").select("id").in("id", optionIds);

    if (error) throw error;

    return data.length === optionIds.length;
  } catch (error) {
    throw error;
  }
}

/**
 * Handle hotel creation errors
 * @param {Object} error - Supabase error object
 */
function handleHotelError(error) {
  // Handle Supabase errors
  if (error.code === "23502") {
    const nullError = new Error("Required field is missing");
    nullError.code = "MISSING_FIELD";
    throw nullError;
  }

  if (error.code === "23505") {
    const duplicateError = new Error("Hotel name already exists");
    duplicateError.code = "DUPLICATE_HOTEL";
    throw duplicateError;
  }

  if (error.code === "23503") {
    const fkError = new Error("Invalid city or option reference");
    fkError.code = "INVALID_REFERENCE";
    throw fkError;
  }

  throw error;
}

// Export as object for consistency
export const hotelCreateRepository = {
  create: createHotel,
  nameExists: hotelNameExists,
  validateCityIds,
  validateHotelOptionIds,
};
