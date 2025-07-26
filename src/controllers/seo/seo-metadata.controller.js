// controllers/seo-metadata.controller.js

import { seoMetadataGetService } from "../../services/seo/seo-metadata.service.js";

/**
 * Get SEO metadata for a specific slug
 * Returns data for both languages
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getSeoMetadata = async (req, res, next) => {
  try {
    // Get normalized slug (already normalized by validator)
    const { slug } = req.query;

    // Get data from service
    const seoData = await seoMetadataGetService.get(slug);

    // Check if any data exists
    const hasData = seoData.th || seoData.en;

    if (!hasData) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "SEO metadata not found",
        },
      });
    }

    // Return success response
    return res.json({
      success: true,
      data: seoData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Alternative implementation with more detailed error handling
 */
export const getSeoMetadataDetailed = async (req, res) => {
  try {
    const { slug } = req.query;

    // Log for debugging
    console.log(`Fetching SEO metadata for slug: ${slug}`);

    // Query with more specific error handling
    const { data: metadata, error, status } = await supabase.from("seo_metadata").select("*").eq("slug", slug);

    // Handle different types of errors
    if (error) {
      console.error("Supabase error:", { error, status });

      // Check for specific error types
      if (error.code === "PGRST301") {
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_CONNECTION_ERROR",
            message: "Unable to connect to database",
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to fetch SEO metadata",
        },
      });
    }

    // No data found
    if (!metadata || metadata.length === 0) {
      console.log(`No SEO metadata found for slug: ${slug}`);

      // Return empty data structure instead of 404
      // This allows frontend to handle missing SEO gracefully
      return res.json({
        success: true,
        data: {
          th: null,
          en: null,
        },
      });
    }

    // Log found data
    console.log(`Found ${metadata.length} SEO entries for slug: ${slug}`);

    // Group by language
    const result = {
      th: null,
      en: null,
    };

    metadata.forEach((row) => {
      if (row.lang === "th" || row.lang === "en") {
        result[row.lang] = {
          page_type: row.page_type,
          slug: row.slug,
          lang: row.lang,
          title: row.title,
          description: row.description,
          og_image: row.og_image,
        };
      }
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error in getSeoMetadata:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        // Include error details in development only
        ...(process.env.NODE_ENV === "development" && { details: error.message }),
      },
    });
  }
};

/**
 * Batch get SEO metadata for multiple slugs
 * Useful for pre-fetching multiple pages
 */
export const getSeoMetadataBatch = async (req, res) => {
  try {
    const { slugs } = req.body; // Array of slugs

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Slugs must be a non-empty array",
        },
      });
    }

    // Limit batch size
    if (slugs.length > 20) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BATCH_SIZE_EXCEEDED",
          message: "Maximum 20 slugs allowed per request",
        },
      });
    }

    // Normalize all slugs
    const normalizedSlugs = slugs.map((slug) => {
      if (!slug || slug === "/" || slug === "") return "home";
      return slug.replace(/^\/+|\/+$/g, "");
    });

    // Query all slugs at once
    const { data: metadata, error } = await supabase.from("seo_metadata").select("*").in("slug", normalizedSlugs);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to fetch SEO metadata",
        },
      });
    }

    // Group by slug then by language
    const result = {};

    // Initialize all requested slugs
    normalizedSlugs.forEach((slug) => {
      result[slug] = { th: null, en: null };
    });

    // Populate with found data
    metadata.forEach((row) => {
      if (!result[row.slug]) {
        result[row.slug] = { th: null, en: null };
      }
      result[row.slug][row.lang] = {
        page_type: row.page_type,
        slug: row.slug,
        lang: row.lang,
        title: row.title,
        description: row.description,
        og_image: row.og_image,
      };
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Batch SEO metadata error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};
