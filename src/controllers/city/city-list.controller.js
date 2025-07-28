import { cityListService } from "../../services/city/city-list.service.js";

/**
 * Get list of cities that have hotels
 * GET /api/city/list
 */
export async function getCityList(req, res, next) {
  try {
    // Get cities from service
    const result = await cityListService.getCityList();

    // Return success response
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Log error
    console.error("City list controller error:", error);

    // Pass to error handler
    next(error);
  }
}
