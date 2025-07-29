// controllers/user/user-login.controller.js

import { userLoginService } from "../../services/user/user-login.service.js";

/**
 * User login
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 */
export const loginUser = async (req, res, next) => {
  try {
    // 1. Extract login credentials
    const { email, password } = req.body;

    // 2. Call login service
    const result = await userLoginService.login(email, password);

    // 3. Send success response with token
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    // 4. Handle known errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: {
          code: error.code,
        },
      });
    }

    // 5. Pass unexpected errors to error handler
    next(error);
  }
};
