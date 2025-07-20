// controllers/user/user-create.controller.js

import { userCreateService } from "../../services/user/user-create.service.js";

/**
 * Create a new user
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 */
export const createUser = async (req, res, next) => {
  try {
    // 1. ดึงข้อมูลจาก request body
    const userData = {
      email: req.body.email,
      password: req.body.password,
      fname: req.body.fname,
      lname: req.body.lname,
      address: req.body.address,
      province: req.body.province,
      phone1: req.body.phone1,
      phone2: req.body.phone2 || null,
      user_image: req.body.user_image || null,
      birthday: req.body.birthday,
    };

    // 2. เรียก service เพื่อสร้าง user
    const newUser = await userCreateService.createUser(userData);

    // 3. ส่ง success response
    return res.status(201).json({
      success: true,
      message: "Successfully registered.",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    // 4. ถ้ามี error ส่งต่อไปให้ error handler middleware
    next(error);
  }
};
