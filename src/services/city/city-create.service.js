// services/city/city-create.service.js

import { cityCreateRepository } from "../../repositories/city/city-create.repository.js";

/**
 * Create a new city
 * @param {Object} cityData - City data from controller
 * @returns {Promise<Object>} Created city
 */
export async function createCity(cityData) {
  try {
    // 1. Validate and clean data
    const cleanedData = {
      name_th: cityData.name_th.trim(),
      name_en: cityData.name_en.trim(),
      image: cityData.image?.trim() || null,
      country_id: cityData.country_id,
    };

    // 2. Check if country exists
    const countryExists = await cityCreateRepository.countryExists(cleanedData.country_id);

    if (!countryExists) {
      const error = new Error("The specified country was not found.");
      error.code = "COUNTRY_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // 3. Check if city name already exists in the same country
    const nameExists = await cityCreateRepository.nameExists(cleanedData.name_th, cleanedData.name_en, cleanedData.country_id);

    if (nameExists) {
      const error = new Error("This city name already exists in this country.");
      error.code = "CITY_EXISTS";
      error.statusCode = 409;
      throw error;
    }

    // 4. Create city in database
    const newCity = await cityCreateRepository.create(cleanedData);

    // 5. Log success
    console.log("City created successfully:", {
      id: newCity.id,
      name_en: newCity.name_en,
      country_id: newCity.country_id,
    });

    return newCity;
  } catch (error) {
    // Log error for monitoring
    console.error("CityCreateService error:", {
      code: error.code,
      message: error.message,
    });

    throw error;
  }
}

// Export as object for consistency (optional)
export const cityCreateService = {
  createCity,
};
