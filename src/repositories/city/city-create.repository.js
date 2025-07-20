// repositories/city/city-create.repository.js

import { supabase } from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new city
 * @param {Object} cityData - City data to insert
 * @returns {Promise<Object>} Created city
 */
export async function createCity(cityData) {
  try {
    const id = uuidv4();

    const newCity = {
      id,
      name_th: cityData.name_th,
      name_en: cityData.name_en,
      image: cityData.image || null,
      country_id: cityData.country_id,
    };

    const { data, error } = await supabase.from("cities").insert(newCity).select().single();

    if (error) {
      // Handle Supabase errors
      if (error.code === "23502") {
        const nullError = new Error(`Required field is missing`);
        nullError.code = "MISSING_FIELD";
        throw nullError;
      }

      if (error.code === "23505") {
        const duplicateError = new Error("City name already exists");
        duplicateError.code = "DUPLICATE_CITY";
        throw duplicateError;
      }

      if (error.code === "23503") {
        const foreignKeyError = new Error("Country ID does not exist");
        foreignKeyError.code = "INVALID_COUNTRY";
        throw foreignKeyError;
      }

      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if city name exists (Thai or English) within a country
 * @param {string} nameTh - Thai name to check
 * @param {string} nameEn - English name to check
 * @param {string} countryId - Country ID to check within
 * @returns {Promise<boolean>} True if exists
 */
export async function cityNameExists(nameTh, nameEn, countryId) {
  try {
    const { data, error } = await supabase
      .from("cities")
      .select("id")
      .eq("country_id", countryId)
      .or(`name_th.eq.${nameTh},name_en.eq.${nameEn}`)
      .single();

    if (error) {
      // If error code is PGRST116, it means no rows found
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    // If data exists, city name is already taken
    return !!data;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if country exists
 * @param {string} countryId - Country ID to verify
 * @returns {Promise<boolean>} True if country exists
 */
export async function countryExists(countryId) {
  try {
    const { data, error } = await supabase.from("countries").select("id").eq("id", countryId).single();

    if (error) {
      // If error code is PGRST116, it means no rows found
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

// Export as object for consistency
export const cityCreateRepository = {
  create: createCity,
  nameExists: cityNameExists,
  countryExists: countryExists,
};
