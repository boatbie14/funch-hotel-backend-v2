// services/country/country-create.service.js

import { countryCreateRepository } from "../../repositories/country/country-create.repository.js";

/**
 * Create a new country
 * @param {Object} countryData - Country data from controller
 * @returns {Promise<Object>} Created country
 */
export async function createCountry(countryData) {
  try {
    // 1. Validate and clean data
    const cleanedData = {
      name_th: countryData.name_th.trim(),
      name_en: countryData.name_en.trim(),
      image: countryData.image?.trim() || null,
    };

    // 2. Check if country name already exists
    const nameExists = await countryCreateRepository.nameExists(cleanedData.name_th, cleanedData.name_en);

    if (nameExists) {
      const error = new Error("This country name already exists.");
      error.code = "COUNTRY_EXISTS";
      error.statusCode = 409;
      throw error;
    }

    // 3. Create country in database
    const newCountry = await countryCreateRepository.create(cleanedData);

    // 4. Log success
    console.log("Country created successfully:", {
      id: newCountry.id,
      name_en: newCountry.name_en,
    });

    return newCountry;
  } catch (error) {
    // Log error for monitoring
    console.error("CountryCreateService error:", {
      code: error.code,
      message: error.message,
    });

    throw error;
  }
}

// Export as object for consistency (optional)
export const countryCreateService = {
  createCountry,
};
