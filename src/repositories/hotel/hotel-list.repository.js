// repositories/hotel/hotel-list.repository.js

import { supabase } from "../../config/database.js";
import { ACTIVE_LANGUAGES } from "../../constants/languages.constant.js";

/**
 * Get hotels by city slug with pagination
 */
export async function getHotelsByCitySlug(citySlug, limit = 20, offset = 0) {
  try {
    // 1. Get city ID from slug (try all languages)
    const { data: seoData, error: seoError } = await supabase
      .from("seo_metadata")
      .select("page_id")
      .eq("page_type", "city")
      .eq("slug", citySlug)
      .limit(1);

    if (seoError || !seoData || seoData.length === 0) {
      const error = new Error("City not found");
      error.code = "CITY_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // 2. Get city info
    const { data: cityInfo, error: cityError } = await supabase
      .from("cities")
      .select("name_th, name_en")
      .eq("id", seoData[0].page_id)
      .single();

    if (cityError) throw cityError;

    // 3. Get hotels in this city with count
    const {
      data: hotels,
      error,
      count,
    } = await supabase
      .from("hotels")
      .select(
        `
        id, name_th, name_en, excerpt_th, excerpt_en, image,
        hotels_cities_map!inner(city_id)
      `,
        { count: "exact" }
      )
      .eq("hotels_cities_map.city_id", seoData[0].page_id)
      .eq("is_active", true)
      .order("name_en")
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 4. Get options and slugs for hotels
    const formattedHotels = await formatHotels(hotels);

    return {
      hotels: formattedHotels,
      city: cityInfo,
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

/**
 * Get all hotels with pagination
 */
export async function getAllHotels(limit = 20, offset = 0) {
  try {
    // Get hotels with count
    const {
      data: hotels,
      error,
      count,
    } = await supabase
      .from("hotels")
      .select("id, name_th, name_en, excerpt_th, excerpt_en, image", { count: "exact" })
      .eq("is_active", true)
      .order("name_en")
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format hotels
    const formattedHotels = await formatHotels(hotels);

    return {
      hotels: formattedHotels,
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

/**
 * Helper: Format hotels with options and slugs
 */
async function formatHotels(hotels) {
  if (!hotels?.length) return [];

  const hotelIds = hotels.map((h) => h.id);

  // Parallel fetch options and slugs
  const [optionsResult, slugsResult] = await Promise.all([
    // Get options
    supabase.from("hotels_options_map").select("hotel_id, hotel_options(id, name_th, name_en, icon)").in("hotel_id", hotelIds),

    // Get slugs
    supabase
      .from("seo_metadata")
      .select("page_id, slug, lang")
      .eq("page_type", "hotel")
      .in("page_id", hotelIds)
      .in("lang", ACTIVE_LANGUAGES),
  ]);

  if (optionsResult.error) throw optionsResult.error;
  if (slugsResult.error) throw slugsResult.error;

  // Group data
  const optionsByHotel = {};
  const slugsByHotel = {};

  optionsResult.data.forEach((item) => {
    if (!optionsByHotel[item.hotel_id]) optionsByHotel[item.hotel_id] = [];
    if (item.hotel_options) optionsByHotel[item.hotel_id].push(item.hotel_options);
  });

  slugsResult.data.forEach((seo) => {
    if (!slugsByHotel[seo.page_id]) slugsByHotel[seo.page_id] = {};
    slugsByHotel[seo.page_id][seo.lang] = seo.slug;
  });

  // Format result
  return hotels.map((hotel) => {
    const result = {
      id: hotel.id,
      name_th: hotel.name_th,
      name_en: hotel.name_en,
      excerpt_th: hotel.excerpt_th,
      excerpt_en: hotel.excerpt_en,
      image: hotel.image,
      hotel_options: optionsByHotel[hotel.id] || [],
    };

    // Add slugs
    ACTIVE_LANGUAGES.forEach((lang) => {
      result[`slug_${lang}`] = slugsByHotel[hotel.id]?.[lang] || "";
    });

    return result;
  });
}

// Export
export const hotelListRepository = {
  getHotelsByCitySlug,
  getAllHotels,
};
