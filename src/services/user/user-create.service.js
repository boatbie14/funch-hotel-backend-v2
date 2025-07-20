// services/user/user-create.service.js

import bcrypt from "bcryptjs";
import { userCreateRepository } from "../../repositories/user/user-create.repository.js";

/**
 * Service for user creation business logic
 */
class UserCreateService {
  /**
   * Create a new user
   * @param {Object} userData - User data from controller
   * @returns {Promise<Object>} Created user without password
   */
  async createUser(userData) {
    try {
      // 1. Check if email already exists
      const emailExists = await userCreateRepository.emailExists(userData.email);

      if (emailExists) {
        const error = new Error("This email is already in use.");
        error.code = "EMAIL_EXISTS";
        error.statusCode = 409;
        throw error;
      }

      // 2. Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // 3. Prepare user data for database
      const userToCreate = {
        email: userData.email.toLowerCase().trim(), // Normalize email
        password: hashedPassword,
        fname: userData.fname.trim(),
        lname: userData.lname.trim(),
        address: userData.address.trim(),
        province: userData.province.trim(),
        phone1: userData.phone1.replace(/[-.\s()]/g, ""), // Clean phone format
        phone2: userData.phone2 ? userData.phone2.replace(/[-.\s()]/g, "") : null,
        user_image: userData.user_image || null,
        birthday: userData.birthday,
      };

      // 4. Create user in database
      const newUser = await userCreateRepository.create(userToCreate);

      // 5. Remove sensitive data before returning
      const { password, ...userResponse } = newUser;

      // 6. Log success (optional)
      console.log("User created successfully:", {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.create_at,
      });

      return userResponse;
    } catch (error) {
      // Log error for monitoring
      console.error("UserCreateService error:", {
        code: error.code,
        message: error.message,
      });

      // Re-throw error to controller
      throw error;
    }
  }
}

// Export singleton instance
export const userCreateService = new UserCreateService();
