import { supabase } from "../../config/database.js";

/**
 * Get cities that have hotels
 * @returns {Promise<Object>} Cities list with SEO slugs
 */
export async function getCitiesWithHotels() {
  try {
    // 1. Get unique city IDs from hotels_cities_map
    const { data: cityMaps, error: mapError } = await supabase.from("hotels_cities_map").select("city_id");

    if (mapError) throw mapError;

    const cityIds = [...new Set(cityMaps.map((m) => m.city_id))];

    if (cityIds.length === 0) {
      return { cities: [], total: 0 };
    }

    // 2. Get cities
    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("id, name_th, name_en, image")
      .in("id", cityIds)
      .order("name_en");

    if (citiesError) throw citiesError;

    // 3. Get SEO metadata separately
    const { data: seoData, error: seoError } = await supabase
      .from("seo_metadata")
      .select("page_id, slug, lang")
      .eq("page_type", "city")
      .in("page_id", cityIds);

    if (seoError) throw seoError;

    // 4. Group SEO data by city
    const seoByCity = {};
    seoData.forEach((seo) => {
      if (!seoByCity[seo.page_id]) {
        seoByCity[seo.page_id] = {};
      }
      seoByCity[seo.page_id][seo.lang] = seo.slug;
    });

    // 5. Format response
    const formattedCities = cities.map((city) => ({
      id: city.id,
      name_th: city.name_th,
      name_en: city.name_en,
      slug_th: seoByCity[city.id]?.th || "",
      slug_en: seoByCity[city.id]?.en || "",
      image_th: city.image,
      image_en: city.image,
    }));

    return {
      cities: formattedCities,
      total: formattedCities.length,
    };
  } catch (error) {
    throw error;
  }
}

// Export as object
export const cityListRepository = {
  getCitiesWithHotels,
};
