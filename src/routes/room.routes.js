// routes/room.routes.js

import express from "express";
import { validateRoomCreate } from "../validators/room/room-create.validator.js";
import { handleValidationErrors } from "../validators/validation.handler.js";
import { xssClean } from "../middlewares/xss-protection.middleware.js";
import { createRoom } from "../controllers/room/room-create.controller.js";

const router = express.Router();

/**
 * POST /api/room
 * Create a new room with pricing and optional SEO/images
 */
router.post(
  "/",
  xssClean, // XSS prevention
  validateRoomCreate, // Input validation
  handleValidationErrors, // Validation error handler
  createRoom // Controller
);

export default router;
