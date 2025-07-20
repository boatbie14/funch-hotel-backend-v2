// controllers/city/city-create.controller.js

import { cityCreateService } from "../../services/city/city-create.service.js";

/**
 * Create a new city
 * POST /api/cities
 */
export async function createCity(req, res, next) {
  try {
    // Extract city data from request body
    const cityData = {
      name_th: req.body.name_th,
      name_en: req.body.name_en,
      image: req.body.image,
      country_id: req.body.country_id,
    };

    // Call service to create city
    const newCity = await cityCreateService.createCity(cityData);

    // Return success response
    return res.status(201).json({
      success: true,
      message: "City created successfully",
      data: newCity,
    });
  } catch (error) {
    // Handle known errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    // Log unexpected errors
    console.error("City create controller error:", error);

    // Pass to error handler middleware
    next(error);
  }
}
