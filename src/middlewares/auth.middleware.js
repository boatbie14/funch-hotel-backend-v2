// middlewares/auth.middleware.js

import jwt from "jsonwebtoken";
import { supabase } from "../config/database.js";

/**
 * Authentication middleware to verify JWT token
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        error: {
          code: "NO_TOKEN",
        },
      });
    }

    // 2. Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // 3. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        error: {
          code: "INVALID_TOKEN",
        },
      });
    }

    // 4. Check if user still exists and is active
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, fname, lname, status")
      .eq("id", decoded.userId)
      .eq("status", "active")
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
        error: {
          code: "USER_NOT_FOUND",
        },
      });
    }

    // 5. Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      fname: user.fname,
      lname: user.lname,
    };

    // 6. Continue to next middleware
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      error: {
        code: "AUTH_ERROR",
      },
    });
  }
};

/**
 * Optional authentication middleware
 * Continues even if no token, but attaches user if valid token exists
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

      // Try to get user
      const { data: user } = await supabase
        .from("users")
        .select("id, email, fname, lname, status")
        .eq("id", decoded.userId)
        .eq("status", "active")
        .single();

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          fname: user.fname,
          lname: user.lname,
        };
      }
    } catch (error) {
      // Invalid token, but continue anyway
      console.log("Optional auth: Invalid token, continuing without user");
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Continue anyway
  }
};
