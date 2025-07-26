// repositories/seo/seo-metadata-get.repository.js

import { supabase } from "../../config/database.js";

/**
 * Get SEO metadata by slug
 * @param {string} slug - Normalized slug
 * @returns {Promise<Array>} Array of SEO metadata
 */
export async function getSeoMetadataBySlug(slug) {
  try {
    const { data, error } = await supabase.from("seo_metadata").select("*").eq("slug", slug);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

// Export as object for consistency
export const seoMetadataGetRepository = {
  getBySlug: getSeoMetadataBySlug,
};
