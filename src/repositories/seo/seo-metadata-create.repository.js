// repositories/seo/seo-metadata-create.repository.js

import { supabase } from "../../config/database.js";

/**
 * Create new SEO metadata
 * @param {Object} seoData - SEO metadata to insert
 * @returns {Promise<Object>} Created SEO metadata
 */
export async function createSeoMetadata(seoData) {
  try {
    const newSeoMetadata = {
      page_type: seoData.page_type,
      page_id: seoData.page_id || null,
      slug: seoData.slug,
      lang: seoData.lang,
      title: seoData.title,
      description: seoData.description,
      og_image: seoData.og_image || null,
    };

    const { data, error } = await supabase.from("seo_metadata").insert(newSeoMetadata).select().single();

    if (error) {
      handleSeoError(error);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if combination of page_type + slug + lang already exists
 * @param {string} pageType - Page type
 * @param {string} slug - Slug to check
 * @param {string} lang - Language
 * @param {string} excludeId - ID to exclude (for updates)
 * @returns {Promise<boolean>} True if exists
 */
export async function seoMetadataExistsBySlug(pageType, slug, lang, excludeId = null) {
  try {
    let query = supabase.from("seo_metadata").select("id").eq("page_type", pageType).eq("slug", slug).eq("lang", lang);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.single();

    if (error) {
      // If error code is PGRST116, it means no rows found
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    // If data exists, combination already exists
    return !!data;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if SEO metadata already exists for page
 * @param {string} pageType - Page type
 * @param {string} pageId - Page ID (optional)
 * @param {string} lang - Language
 * @returns {Promise<boolean>} True if exists
 */
export async function seoMetadataExists(pageType, pageId, lang) {
  try {
    let query = supabase.from("seo_metadata").select("id").eq("page_type", pageType).eq("lang", lang);

    // Handle page_id - if null, check for null, otherwise check for specific ID
    if (pageId) {
      query = query.eq("page_id", pageId);
    } else {
      query = query.is("page_id", null);
    }

    const { data, error } = await query.single();

    if (error) {
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

/**
 * Handle SEO metadata errors
 * @param {Object} error - Supabase error object
 */
function handleSeoError(error) {
  // Handle Supabase errors
  if (error.code === "23502") {
    const nullError = new Error("Required field is missing");
    nullError.code = "MISSING_FIELD";
    throw nullError;
  }

  if (error.code === "23505") {
    const duplicateError = new Error("SEO metadata with this slug already exists");
    duplicateError.code = "DUPLICATE_SLUG";
    throw duplicateError;
  }

  if (error.code === "23503") {
    const fkError = new Error("Invalid page reference");
    fkError.code = "INVALID_PAGE_REFERENCE";
    throw fkError;
  }

  throw error;
}

// Export as object for consistency
export const seoMetadataCreateRepository = {
  create: createSeoMetadata,
  seoMetadataExistsBySlug,
  seoMetadataExists,
};
