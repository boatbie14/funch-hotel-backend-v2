import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import userRoutes from "./routes/user.route.js";
import countryRoutes from "./routes/country.route.js";
import cityRoutes from "./routes/city.routes.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ## API Routes
app.use("/api/users", userRoutes);
app.use("/api/country", countryRoutes);
app.use("/api/city", cityRoutes);

// Error Handler Middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
