// routes/hotel.route.js

import express from "express";
import { validateHotelCreate } from "../validators/hotel/hotel-create.validator.js";
import { validateHotelList } from "../validators/hotel/hotel-list.validator.js";
import { handleValidationErrors } from "../validators/validation.handler.js";
import { xssClean } from "../middlewares/xss-protection.middleware.js";
import { createHotel } from "../controllers/hotel/hotel-create.controller.js";
import { getHotelList } from "../controllers/hotel/hotel-list.controller.js";

const router = express.Router();

/**
 * POST /api/hotels
 * Create a new hotel
 */
router.post(
  "/",
  xssClean, // XSS prevention
  validateHotelCreate, // Input validation
  handleValidationErrors, // Validation error handler
  createHotel // Controller
);

/**
 * GET /api/hotel/list
 * Get list of hotels by city
 */
router.get("/list", validateHotelList, handleValidationErrors, getHotelList);

export default router;
