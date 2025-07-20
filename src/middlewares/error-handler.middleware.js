export const errorHandler = (err, req, res, next) => {
  // 1. Log error ง่ายๆ
  console.error("Error occurred:", {
    message: err.message,
    code: err.code,
    url: req.originalUrl,
    method: req.method,
  });

  // 2. จัดการ error แต่ละประเภทด้วย if-else
  if (err.code === "EMAIL_EXISTS" || err.code === "DUPLICATE_EMAIL") {
    return res.status(409).json({
      success: false,
      message: "This email is already in use.",
      error: {
        code: "EMAIL_EXISTS",
        field: "email",
      },
    });
  } else if (err.code === "MISSING_FIELD") {
    return res.status(400).json({
      success: false,
      message: `Incomplete information: ${err.field || "unknown field"}`,
      error: {
        code: "MISSING_FIELD",
        field: err.field,
      },
    });
  } else if (err.code === "INVALID_EMAIL_DOMAIN") {
    return res.status(400).json({
      success: false,
      message: "Email domain is not allowed.",
      error: {
        code: "INVALID_EMAIL_DOMAIN",
        field: "email",
      },
    });
  } else if (err.code === "VALIDATION_ERROR") {
    return res.status(400).json({
      success: false,
      message: err.message || "Incorrect information.",
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  } else {
    // Default error (500)
    return res.status(500).json({
      success: false,
      message: "A system error has occurred.",
      error: {
        code: "SERVER_ERROR",
      },
    });
  }
};
