import { cityListRepository } from "../../repositories/city/city-list.repository.js";

/**
 * Get list of cities with hotels
 * @returns {Promise<Object>} Cities data
 */
export async function getCityList() {
  try {
    // Get cities from repository
    const result = await cityListRepository.getCitiesWithHotels();

    // Log for monitoring
    console.log("City list fetched:", {
      count: result.total,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error("CityListService error:", {
      message: error.message,
      code: error.code,
    });

    throw error;
  }
}

// Export as object
export const cityListService = {
  getCityList,
};
