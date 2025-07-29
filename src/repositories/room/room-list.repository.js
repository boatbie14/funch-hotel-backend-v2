// repositories/room/room-list.repository.js

import { supabase } from "../../config/database.js";
import { ACTIVE_LANGUAGES } from "../../constants/languages.constant.js";

/**
 * Get rooms by hotel slug with pagination
 */
export async function getRoomsByHotelSlug(hotelSlug, limit = 20, offset = 0) {
  try {
    // 1. Get hotel ID from slug (try all languages)
    const { data: seoData, error: seoError } = await supabase
      .from("seo_metadata")
      .select("page_id")
      .eq("page_type", "hotel")
      .eq("slug", hotelSlug)
      .limit(1);

    if (seoError || !seoData || seoData.length === 0) {
      const error = new Error("Hotel not found");
      error.code = "HOTEL_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    const hotelId = seoData[0].page_id;

    // 2. Get hotel info
    const { data: hotelInfo, error: hotelError } = await supabase.from("hotels").select("id, name_th, name_en").eq("id", hotelId).single();

    if (hotelError) throw hotelError;

    // 3. Get rooms with count
    const {
      data: rooms,
      error: roomsError,
      count,
    } = await supabase
      .from("rooms")
      .select("*", { count: "exact" })
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .order("name_en")
      .range(offset, offset + limit - 1);

    if (roomsError) throw roomsError;

    // If no rooms found
    if (!rooms || rooms.length === 0) {
      return {
        hotel: hotelInfo,
        rooms: [],
        pagination: {
          total: 0,
          limit,
          offset,
          current_page: 1,
          total_pages: 0,
          has_more: false,
        },
      };
    }

    // 4. Get room IDs for additional data
    const roomIds = rooms.map((r) => r.id);

    // 5. Parallel fetch room options and SEO slugs
    const [optionsResult, slugsResult] = await Promise.all([
      // Get room options
      supabase
        .from("room_options_map")
        .select(
          `
          room_id,
          room_options (
            id,
            name_th,
            name_en,
            icon,
            is_bed
          )
        `
        )
        .in("room_id", roomIds),

      // Get SEO slugs for rooms
      supabase
        .from("seo_metadata")
        .select("page_id, slug, lang")
        .eq("page_type", "room")
        .in("page_id", roomIds)
        .in("lang", ACTIVE_LANGUAGES),
    ]);

    if (optionsResult.error) throw optionsResult.error;
    if (slugsResult.error) throw slugsResult.error;

    // 6. Group data by room
    const optionsByRoom = {};
    const slugsByRoom = {};

    // Group options by room
    optionsResult.data.forEach((item) => {
      if (!optionsByRoom[item.room_id]) {
        optionsByRoom[item.room_id] = [];
      }
      if (item.room_options) {
        optionsByRoom[item.room_id].push(item.room_options);
      }
    });

    // Group slugs by room
    slugsResult.data.forEach((seo) => {
      if (!slugsByRoom[seo.page_id]) {
        slugsByRoom[seo.page_id] = {};
      }
      slugsByRoom[seo.page_id][seo.lang] = seo.slug;
    });

    // 7. Format rooms with all data
    const formattedRooms = rooms.map((room) => {
      const result = {
        id: room.id,
        name_th: room.name_th,
        name_en: room.name_en,
        room_size: room.room_size,
        description_th: room.description_th,
        description_en: room.description_en,
        max_adult: room.max_adult,
        max_children: room.max_children,
        total_room: room.total_room,
        is_active: room.is_active,
        room_options: optionsByRoom[room.id] || [],
      };

      // Add slugs for each language
      ACTIVE_LANGUAGES.forEach((lang) => {
        result[`slug_${lang}`] = slugsByRoom[room.id]?.[lang] || "";
      });

      return result;
    });

    // 8. Return formatted response
    return {
      hotel: hotelInfo,
      rooms: formattedRooms,
      pagination: {
        total: count,
        limit,
        offset,
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil(count / limit),
        has_more: offset + limit < count,
      },
    };
  } catch (error) {
    throw error;
  }
}

// Export
export const roomListRepository = {
  getRoomsByHotelSlug,
};
