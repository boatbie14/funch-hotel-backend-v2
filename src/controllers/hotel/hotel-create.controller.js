// controllers/hotel/hotel-create.controller.js

import { hotelCreateService } from "../../services/hotel/hotel-create.service.js";

/**
 * Create a new hotel
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 */
export const createHotel = async (req, res, next) => {
  try {
    // 1. ดึงข้อมูลจาก request body
    const hotelData = {
      name_th: req.body.name_th,
      name_en: req.body.name_en,
      excerpt_th: req.body.excerpt_th,
      excerpt_en: req.body.excerpt_en,
      description_th: req.body.description_th,
      description_en: req.body.description_en,
      checkin_time: req.body.checkin_time,
      checkout_time: req.body.checkout_time,
      image: req.body.image,
      location_txt_th: req.body.location_txt_th,
      location_txt_en: req.body.location_txt_en,
      google_map_link: req.body.google_map_link,
      is_active: req.body.is_active,
      city_ids: req.body.city_ids || [],
      hotel_option_ids: req.body.hotel_option_ids || [],
    };

    // 2. เรียก service เพื่อสร้างโรงแรม
    const newHotel = await hotelCreateService.create(hotelData);

    // 3. ส่ง success response
    return res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: {
        hotel: newHotel,
      },
    });
  } catch (error) {
    // 4. ถ้ามี error ส่งต่อไปให้ error handler middleware
    next(error);
  }
};
