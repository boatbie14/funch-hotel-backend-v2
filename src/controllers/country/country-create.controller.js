// controllers/country/country-create.controller.js

import { countryCreateService } from "../../services/country/country-create.service.js";

/**
 * Create a new country
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 */
export const createCountry = async (req, res, next) => {
  try {
    // 1. ดึงข้อมูลจาก request body
    const countryData = {
      name_th: req.body.name_th,
      name_en: req.body.name_en,
      image: req.body.image || null,
    };

    // 2. เรียก service เพื่อสร้างประเทศ
    const newCountry = await countryCreateService.createCountry(countryData);

    // 3. ส่ง success response
    return res.status(201).json({
      success: true,
      message: "สร้างข้อมูลประเทศสำเร็จ",
      data: {
        country: newCountry,
      },
    });
  } catch (error) {
    // 4. ถ้ามี error ส่งต่อไปให้ error handler middleware
    next(error);
  }
};
