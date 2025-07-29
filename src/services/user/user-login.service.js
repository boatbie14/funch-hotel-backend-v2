// services/user/user-login.service.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userLoginRepository } from "../../repositories/user/user-login.repository.js";

/**
 * User login service
 */
class UserLoginService {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and JWT token
   */
  async login(email, password) {
    try {
      // 1. Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // 2. Find user by email
      const user = await userLoginRepository.findUserByEmail(normalizedEmail);

      if (!user) {
        const error = new Error("Invalid email or password");
        error.code = "INVALID_CREDENTIALS";
        error.statusCode = 401;
        throw error;
      }

      // 3. Check if user is active
      if (user.status !== "active") {
        const error = new Error("Your account is not active. Please contact support.");
        error.code = "ACCOUNT_INACTIVE";
        error.statusCode = 403;
        throw error;
      }

      // 4. Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        const error = new Error("Invalid email or password");
        error.code = "INVALID_CREDENTIALS";
        error.statusCode = 401;
        throw error;
      }

      // 5. Generate JWT token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || "your-secret-key", {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      });

      // 6. Remove sensitive data before returning
      const { password: _, create_at, birthday, address, province, ...userResponse } = user;

      // 7. Log successful login
      console.log("User logged in successfully:", {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      return {
        user: userResponse,
        token,
      };
    } catch (error) {
      // Log error for monitoring
      console.error("UserLoginService error:", {
        code: error.code,
        message: error.message,
        email: email,
      });

      throw error;
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token payload
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      return decoded;
    } catch (error) {
      const authError = new Error("Invalid or expired token");
      authError.code = "INVALID_TOKEN";
      authError.statusCode = 401;
      throw authError;
    }
  }
}

// Export singleton instance
export const userLoginService = new UserLoginService();
