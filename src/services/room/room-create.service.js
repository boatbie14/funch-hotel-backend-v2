// services/room/room-create.service.js

import { roomCreateRepository } from "../../repositories/room/room-create.repository.js";

/**
 * Check if date ranges overlap
 * @param {Object} range1 - First date range
 * @param {Object} range2 - Second date range
 * @returns {boolean} True if overlap
 */
function checkDateOverlap(range1, range2) {
  const start1 = new Date(range1.start_date);
  const end1 = new Date(range1.end_date);
  const start2 = new Date(range2.start_date);
  const end2 = new Date(range2.end_date);

  return start1 <= end2 && start2 <= end1;
}

/**
 * Check for overlapping seasons with existing ones
 * @param {Array} newSeasons - New season prices to check
 * @param {Array} existingSeasons - Existing season prices
 * @returns {Object|null} Error object if overlap found
 */
function checkSeasonOverlap(newSeasons, existingSeasons) {
  if (!newSeasons || newSeasons.length === 0) return null;

  for (const newSeason of newSeasons) {
    for (const existing of existingSeasons) {
      if (checkDateOverlap(newSeason, existing)) {
        return {
          message: `Season "${newSeason.name}" (${newSeason.start_date} to ${newSeason.end_date}) overlaps with existing season "${existing.name}" (${existing.start_date} to ${existing.end_date})`,
          code: "SEASON_OVERLAP",
          statusCode: 409,
        };
      }
    }
  }
  return null;
}

/**
 * Check for overlapping override prices with existing ones
 * @param {Array} newOverrides - New override prices to check
 * @param {Array} existingOverrides - Existing active override prices
 * @returns {Object|null} Error object if overlap found
 */
function checkOverrideOverlap(newOverrides, existingOverrides) {
  if (!newOverrides || newOverrides.length === 0) return null;

  // Only check active overrides
  const activeNewOverrides = newOverrides.filter((o) => o.is_active === true);

  for (const newOverride of activeNewOverrides) {
    for (const existing of existingOverrides) {
      if (checkDateOverlap(newOverride, existing)) {
        return {
          message: `Override price "${newOverride.name}" (${newOverride.start_date} to ${newOverride.end_date}) overlaps with existing override "${existing.name}" (${existing.start_date} to ${existing.end_date})`,
          code: "OVERRIDE_OVERLAP",
          statusCode: 409,
        };
      }
    }
  }
  return null;
}

/**
 * Create a new room with all related data
 * @param {Object} requestData - Complete room data from controller
 * @returns {Promise<Object>} Created room with all related data
 */
export async function createRoom(requestData) {
  let createdRoomId = null;

  try {
    const { room_data, room_option_ids, base_price, season_base_prices, override_prices, seo_data, images } = requestData;

    // 1. Validate hotel exists
    const hotelExists = await roomCreateRepository.hotelExists(room_data.hotel_id);
    if (!hotelExists) {
      const error = new Error("Hotel not found");
      error.code = "HOTEL_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // 2. Check if room name already exists in this hotel
    const nameExists = await roomCreateRepository.roomNameExists(room_data.name_th, room_data.name_en, room_data.hotel_id);

    if (nameExists) {
      const error = new Error("Room name already exists in this hotel");
      error.code = "ROOM_EXISTS";
      error.statusCode = 409;
      throw error;
    }

    // 3. Validate room option IDs if provided
    if (room_option_ids && room_option_ids.length > 0) {
      const validOptions = await roomCreateRepository.validateRoomOptionIds(room_option_ids);
      if (!validOptions) {
        const error = new Error("One or more room option IDs are invalid");
        error.code = "INVALID_OPTION_ID";
        error.statusCode = 400;
        throw error;
      }
    }

    // 4. Create room
    const newRoom = await roomCreateRepository.createRoom(room_data);
    createdRoomId = newRoom.id;

    // 5. Create room options mapping
    if (room_option_ids && room_option_ids.length > 0) {
      await roomCreateRepository.createRoomOptions(createdRoomId, room_option_ids);
    }

    // 6. Create base price (required)
    const createdBasePrice = await roomCreateRepository.createBasePrice(createdRoomId, base_price);

    // 7. Check for season price overlaps if any
    let createdSeasonPrices = [];
    if (season_base_prices && season_base_prices.length > 0) {
      // This is a new room, so no existing seasons yet
      // Just check internal overlaps (already done in validator)
      createdSeasonPrices = await roomCreateRepository.createSeasonBasePrices(createdRoomId, season_base_prices);
    }

    // 8. Check for override price overlaps if any
    let createdOverridePrices = [];
    if (override_prices && override_prices.length > 0) {
      // This is a new room, so no existing overrides yet
      // Just check internal overlaps (already done in validator)
      createdOverridePrices = await roomCreateRepository.createOverridePrices(createdRoomId, override_prices);
    }

    // 9. Log success
    console.log("Room created successfully:", {
      id: newRoom.id,
      name_en: newRoom.name_en,
      hotel_id: newRoom.hotel_id,
      options: room_option_ids?.length || 0,
      seasons: createdSeasonPrices.length,
      overrides: createdOverridePrices.length,
    });

    // 10. Return created data (without SEO and images - handled by controller)
    return {
      room: newRoom,
      base_price: createdBasePrice,
      season_base_prices: createdSeasonPrices,
      override_prices: createdOverridePrices,
      room_option_ids: room_option_ids || [],
    };
  } catch (error) {
    // Rollback if room was created
    if (createdRoomId) {
      console.log("Rolling back room creation:", createdRoomId);
      await roomCreateRepository.deleteRoomCascade(createdRoomId);
    }

    // Log error
    console.error("RoomCreateService error:", {
      code: error.code,
      message: error.message,
      roomId: createdRoomId,
    });

    throw error;
  }
}

/**
 * Check date overlaps for existing room (for future update endpoint)
 * This function is exported for potential reuse
 */
export async function checkRoomDateOverlaps(roomId, seasonPrices, overridePrices) {
  try {
    // Get existing seasons
    if (seasonPrices && seasonPrices.length > 0) {
      const existingSeasons = await roomCreateRepository.getExistingSeasonPrices(roomId);
      const seasonError = checkSeasonOverlap(seasonPrices, existingSeasons);
      if (seasonError) {
        const error = new Error(seasonError.message);
        error.code = seasonError.code;
        error.statusCode = seasonError.statusCode;
        throw error;
      }
    }

    // Get existing active overrides
    if (overridePrices && overridePrices.length > 0) {
      const existingOverrides = await roomCreateRepository.getExistingOverridePrices(roomId);
      const overrideError = checkOverrideOverlap(overridePrices, existingOverrides);
      if (overrideError) {
        const error = new Error(overrideError.message);
        error.code = overrideError.code;
        error.statusCode = overrideError.statusCode;
        throw error;
      }
    }

    return true;
  } catch (error) {
    throw error;
  }
}

// Export as object for consistency
export const roomCreateService = {
  create: createRoom,
  checkDateOverlaps: checkRoomDateOverlaps,
};
