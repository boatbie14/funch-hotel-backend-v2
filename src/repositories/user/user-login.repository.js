// repositories/user/user-login.repository.js

import { supabase } from "../../config/database.js";

/**
 * Find user by email for login
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User data or null
 */
export async function findUserByEmail(email) {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single();

    if (error) {
      // PGRST116 means no rows found
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Export as object for consistency
export const userLoginRepository = {
  findUserByEmail,
};
