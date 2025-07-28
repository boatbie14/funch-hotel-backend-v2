// services/seo/seo-metadata-get.service.js

import { seoMetadataGetRepository } from "../../repositories/seo/seo-metadata.repository.js";

/**
 * Get SEO metadata for a slug
 * @param {string} slug - Normalized slug from validator
 * @returns {Promise<Object>} SEO data grouped by language
 */
export async function getSeoMetadata(slug) {
  try {
    // Get data from repository
    const metadata = await seoMetadataGetRepository.getBySlug(slug);

    // Group by language
    const result = {
      th: null,
      en: null,
    };

    metadata.forEach((row) => {
      if (row.lang === "th" || row.lang === "en") {
        result[row.lang] = {
          page_type: row.page_type,
          page_id: row.page_id,
          slug: row.slug,
          lang: row.lang,
          title: row.title,
          description: row.description,
          og_image: row.og_image,
        };
      }
    });

    return result;
  } catch (error) {
    console.error("SeoMetadataGetService error:", {
      slug,
      error: error.message,
    });
    throw error;
  }
}

// Export as object for consistency
export const seoMetadataGetService = {
  get: getSeoMetadata,
};
