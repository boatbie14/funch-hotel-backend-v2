// repositories/user/user-create.repository.js (Functional Style)

import { supabase } from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new user
 * @param {Object} userData - User data to insert
 * @returns {Promise<Object>} Created user
 */
export async function createUser(userData) {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();

    const newUser = {
      id,
      email: userData.email,
      password: userData.password,
      fname: userData.fname,
      lname: userData.lname,
      address: userData.address,
      province: userData.province,
      phone1: userData.phone1,
      phone2: userData.phone2 || null,
      user_image: userData.user_image || null,
      create_at: now,
      birthday: userData.birthday,
      status: "active",
    };

    const { data, error } = await supabase.from("users").insert(newUser).select().single();

    if (error) {
      // Handle Supabase errors
      if (error.code === "23505") {
        const duplicateError = new Error("Email already exists");
        duplicateError.code = "DUPLICATE_EMAIL";
        duplicateError.field = "email";
        throw duplicateError;
      }

      if (error.code === "23502") {
        const nullError = new Error(`Required field is missing`);
        nullError.code = "MISSING_FIELD";
        throw nullError;
      }

      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if exists
 */
export async function emailExists(email) {
  try {
    const { data, error } = await supabase.from("users").select("id").eq("email", email).single();

    if (error) {
      // If error code is PGRST116, it means no rows found
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    // If data exists, email is already taken
    return !!data;
  } catch (error) {
    throw error;
  }
}

// หรือ export เป็น object ถ้าอยากจัดกลุ่ม
export const userCreateRepository = {
  create: createUser,
  emailExists,
};
