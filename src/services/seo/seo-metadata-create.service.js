// services/seo/seo-metadata-create.service.js

import { seoMetadataCreateRepository } from "../../repositories/seo/seo-metadata-create.repository.js";

/**
 * Create new SEO metadata
 * @param {Object} seoData - SEO data from controller
 * @returns {Promise<Object>} Created SEO metadata
 */
export async function createSeoMetadata(seoData) {
  try {
    // 1. Clean and prepare data
    const cleanedData = {
      page_type: seoData.page_type,
      page_id: seoData.page_id || null,
      slug: seoData.slug.toLowerCase().trim(),
      lang: seoData.lang,
      title: seoData.title.trim(),
      description: seoData.description.trim(),
      og_image: seoData.og_image?.trim() || null,
    };

    // 2. Check if combination of page_type + slug + lang already exists
    const combinationExists = await seoMetadataCreateRepository.seoMetadataExistsBySlug(
      cleanedData.page_type,
      cleanedData.slug,
      cleanedData.lang
    );

    if (combinationExists) {
      const error = new Error(`This slug '${cleanedData.slug}' already exists for ${cleanedData.page_type} in ${cleanedData.lang}`);
      error.code = "SLUG_EXISTS";
      error.statusCode = 409;
      throw error;
    }

    // 3. Create SEO metadata in database
    const newSeoMetadata = await seoMetadataCreateRepository.create(cleanedData);

    // 4. Log success
    console.log("SEO metadata created successfully:", {
      id: newSeoMetadata.id,
      page_type: newSeoMetadata.page_type,
      slug: newSeoMetadata.slug,
      lang: newSeoMetadata.lang,
    });

    return newSeoMetadata;
  } catch (error) {
    // Log error for monitoring
    console.error("SeoMetadataCreateService error:", {
      code: error.code,
      message: error.message,
    });

    throw error;
  }
}

// Export as object for consistency
export const seoMetadataCreateService = {
  create: createSeoMetadata,
};
