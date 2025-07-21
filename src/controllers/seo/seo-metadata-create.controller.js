// controllers/seo/seo-metadata-create.controller.js

import { seoMetadataCreateService } from "../../services/seo/seo-metadata-create.service.js";

/**
 * Create SEO metadata (supports multiple languages)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 */
export const createSeoMetadata = async (req, res, next) => {
  try {
    // 1. ดึง array ของ SEO data จาก request body
    const seoDataArray = req.body.seo_data;

    if (!Array.isArray(seoDataArray) || seoDataArray.length === 0) {
      const error = new Error("seo_data must be a non-empty array");
      error.statusCode = 400;
      error.code = "INVALID_REQUEST";
      throw error;
    }

    // 2. สร้าง SEO metadata ทีละรายการ
    const results = [];
    const errors = [];

    for (const seoData of seoDataArray) {
      try {
        const newSeoMetadata = await seoMetadataCreateService.create({
          page_type: seoData.page_type,
          page_id: seoData.page_id || null,
          slug: seoData.slug,
          lang: seoData.lang,
          title: seoData.title,
          description: seoData.description,
          og_image: seoData.og_image || null,
        });

        results.push(newSeoMetadata);
      } catch (error) {
        errors.push({
          lang: seoData.lang,
          slug: seoData.slug,
          error: error.message,
          code: error.code,
        });
      }
    }

    // 3. ตรวจสอบผลลัพธ์
    if (results.length === 0) {
      // ถ้าทั้งหมด error
      const error = new Error("Failed to create any SEO metadata");
      error.statusCode = 400;
      error.code = "ALL_FAILED";
      error.details = errors;
      throw error;
    }

    // 4. ส่ง response พร้อมสรุปผล
    const statusCode = errors.length > 0 ? 207 : 201; // 207 Multi-Status

    return res.status(statusCode).json({
      success: true,
      message: `Created ${results.length} of ${seoDataArray.length} SEO metadata`,
      data: {
        seo_metadata: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: seoDataArray.length,
          success: results.length,
          failed: errors.length,
        },
      },
    });
  } catch (error) {
    // 5. ถ้ามี error ส่งต่อไปให้ error handler middleware
    next(error);
  }
};
