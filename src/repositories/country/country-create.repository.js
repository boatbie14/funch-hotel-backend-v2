// repositories/country/country-create.repository.js

import { supabase } from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new country
 * @param {Object} countryData - Country data to insert
 * @returns {Promise<Object>} Created country
 */
export async function createCountry(countryData) {
  try {
    const id = uuidv4();

    const newCountry = {
      id,
      name_th: countryData.name_th,
      name_en: countryData.name_en,
      image: countryData.image || null,
    };

    const { data, error } = await supabase.from("countries").insert(newCountry).select().single();

    if (error) {
      // Handle Supabase errors
      if (error.code === "23502") {
        const nullError = new Error(`Required field is missing`);
        nullError.code = "MISSING_FIELD";
        throw nullError;
      }

      if (error.code === "23505") {
        const duplicateError = new Error("Country name already exists");
        duplicateError.code = "DUPLICATE_COUNTRY";
        throw duplicateError;
      }

      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if country name exists (Thai or English)
 * @param {string} nameTh - Thai name to check
 * @param {string} nameEn - English name to check
 * @returns {Promise<boolean>} True if exists
 */
export async function countryNameExists(nameTh, nameEn) {
  try {
    const { data, error } = await supabase.from("countries").select("id").or(`name_th.eq.${nameTh},name_en.eq.${nameEn}`).single();

    if (error) {
      // If error code is PGRST116, it means no rows found
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    // If data exists, country name is already taken
    return !!data;
  } catch (error) {
    throw error;
  }
}

// Export as object for consistency
export const countryCreateRepository = {
  create: createCountry,
  nameExists: countryNameExists,
};
