// repositories/room/room-create.repository.js

import { supabase } from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new room with basic information
 * @param {Object} roomData - Room data to insert
 * @returns {Promise<Object>} Created room
 */
export async function createRoom(roomData) {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();

    const newRoom = {
      id,
      name_th: roomData.name_th,
      name_en: roomData.name_en,
      room_size: roomData.room_size,
      description_th: roomData.description_th,
      description_en: roomData.description_en,
      max_adult: roomData.max_adult,
      max_children: roomData.max_children,
      total_room: roomData.total_room,
      create_at: now,
      hotel_id: roomData.hotel_id,
      is_active: roomData.is_active ?? false,
    };

    const { data, error } = await supabase.from("rooms").insert(newRoom).select().single();

    if (error) {
      handleRoomError(error);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create room option mappings
 * @param {string} roomId - Room ID
 * @param {string[]} optionIds - Array of room option IDs
 * @returns {Promise<void>}
 */
export async function createRoomOptions(roomId, optionIds) {
  if (!optionIds || optionIds.length === 0) return;

  try {
    const mappings = optionIds.map((optionId) => ({
      id: uuidv4(),
      room_id: roomId,
      room_option_id: optionId,
    }));

    const { error } = await supabase.from("room_options_map").insert(mappings);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Create base price for room
 * @param {string} roomId - Room ID
 * @param {Object} basePrice - Base price data
 * @returns {Promise<Object>} Created base price
 */
export async function createBasePrice(roomId, basePrice) {
  try {
    const id = uuidv4();

    const newBasePrice = {
      id,
      price_sun: basePrice.price_sun,
      price_mon: basePrice.price_mon,
      price_tue: basePrice.price_tue,
      price_wed: basePrice.price_wed,
      price_thu: basePrice.price_thu,
      price_fri: basePrice.price_fri,
      price_sat: basePrice.price_sat,
      room_id: roomId,
    };

    const { data, error } = await supabase.from("room_base_prices").insert(newBasePrice).select().single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create season base prices for room
 * @param {string} roomId - Room ID
 * @param {Array<Object>} seasonPrices - Array of season price data
 * @returns {Promise<Array>} Created season prices
 */
export async function createSeasonBasePrices(roomId, seasonPrices) {
  if (!seasonPrices || seasonPrices.length === 0) return [];

  try {
    const prices = seasonPrices.map((season) => ({
      id: uuidv4(),
      name: season.name,
      start_date: season.start_date,
      end_date: season.end_date,
      price_sun: season.price_sun,
      price_mon: season.price_mon,
      price_tue: season.price_tue,
      price_wed: season.price_wed,
      price_thu: season.price_thu,
      price_fri: season.price_fri,
      price_sat: season.price_sat,
      room_id: roomId,
    }));

    const { data, error } = await supabase.from("room_season_base_prices").insert(prices).select();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create override prices for room
 * @param {string} roomId - Room ID
 * @param {Array<Object>} overridePrices - Array of override price data
 * @returns {Promise<Array>} Created override prices
 */
export async function createOverridePrices(roomId, overridePrices) {
  if (!overridePrices || overridePrices.length === 0) return [];

  try {
    const prices = overridePrices.map((override) => ({
      id: uuidv4(),
      name: override.name,
      price: override.price,
      start_date: override.start_date,
      end_date: override.end_date,
      is_promotion: override.is_promotion,
      note: override.note || null,
      is_active: override.is_active ?? true,
      room_id: roomId,
    }));

    const { data, error } = await supabase.from("room_override_prices").insert(prices).select();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if room name exists in hotel (Thai or English)
 * @param {string} nameTh - Thai name to check
 * @param {string} nameEn - English name to check
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<boolean>} True if exists
 */
export async function roomNameExists(nameTh, nameEn, hotelId) {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("id")
      .eq("hotel_id", hotelId)
      .or(`name_th.eq.${nameTh},name_en.eq.${nameEn}`)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    return !!data;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if hotel exists
 * @param {string} hotelId - Hotel ID to verify
 * @returns {Promise<boolean>} True if hotel exists
 */
export async function hotelExists(hotelId) {
  try {
    const { data, error } = await supabase.from("hotels").select("id").eq("id", hotelId).single();

    if (error) {
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    return !!data;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate room option IDs exist
 * @param {string[]} optionIds - Array of option IDs to validate
 * @returns {Promise<boolean>} True if all exist
 */
export async function validateRoomOptionIds(optionIds) {
  if (!optionIds || optionIds.length === 0) return true;

  try {
    const { data, error } = await supabase.from("room_options").select("id").in("id", optionIds);

    if (error) throw error;

    return data.length === optionIds.length;
  } catch (error) {
    throw error;
  }
}

/**
 * Get existing season prices for overlap check
 * @param {string} roomId - Room ID
 * @returns {Promise<Array>} Existing season prices
 */
export async function getExistingSeasonPrices(roomId) {
  try {
    const { data, error } = await supabase
      .from("room_season_base_prices")
      .select("id, name, start_date, end_date")
      .eq("room_id", roomId)
      .order("start_date");

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get existing active override prices for overlap check
 * @param {string} roomId - Room ID
 * @returns {Promise<Array>} Existing active override prices
 */
export async function getExistingOverridePrices(roomId) {
  try {
    const { data, error } = await supabase
      .from("room_override_prices")
      .select("id, name, start_date, end_date")
      .eq("room_id", roomId)
      .eq("is_active", true)
      .order("start_date");

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Delete room and all related data (for rollback)
 * @param {string} roomId - Room ID to delete
 * @returns {Promise<void>}
 */
export async function deleteRoomCascade(roomId) {
  try {
    // Order matters due to foreign key constraints
    const tables = [
      "room_override_prices",
      "room_season_base_prices",
      "room_base_prices",
      "room_options_map",
      "seo_metadata",
      "image_assets",
      "rooms",
    ];

    for (const table of tables) {
      if (table === "seo_metadata") {
        await supabase.from(table).delete().eq("page_type", "room").eq("page_id", roomId);
      } else if (table === "image_assets") {
        await supabase.from(table).delete().eq("content_type", "room").eq("content_id", roomId);
      } else {
        await supabase
          .from(table)
          .delete()
          .eq(table === "rooms" ? "id" : "room_id", roomId);
      }
    }
  } catch (error) {
    console.error("Error in cascade delete:", error);
    // Don't throw - this is cleanup
  }
}

/**
 * Handle room creation errors
 * @param {Object} error - Supabase error object
 */
function handleRoomError(error) {
  if (error.code === "23502") {
    const nullError = new Error("Required field is missing");
    nullError.code = "MISSING_FIELD";
    throw nullError;
  }

  if (error.code === "23505") {
    const duplicateError = new Error("Room name already exists");
    duplicateError.code = "DUPLICATE_ROOM";
    throw duplicateError;
  }

  if (error.code === "23503") {
    const fkError = new Error("Invalid hotel reference");
    fkError.code = "INVALID_REFERENCE";
    throw fkError;
  }

  throw error;
}

// Export as object for consistency
export const roomCreateRepository = {
  createRoom,
  createRoomOptions,
  createBasePrice,
  createSeasonBasePrices,
  createOverridePrices,
  roomNameExists,
  hotelExists,
  validateRoomOptionIds,
  getExistingSeasonPrices,
  getExistingOverridePrices,
  deleteRoomCascade,
};
