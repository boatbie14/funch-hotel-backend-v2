import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
// ## routes
import userRoutes from "./routes/user.routes.js";
import countryRoutes from "./routes/country.routes.js";
import cityRoutes from "./routes/city.routes.js";
import hotelRoutes from "./routes/hotel.routes.js";
import seoRoutes from "./routes/seo-metadata.routes.js";
import imageCollectionRoutes from "./routes/image-collection.routes.js";
import roomRoutes from "./routes/room.routes.js";

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
app.use("/api/user", userRoutes);
app.use("/api/country", countryRoutes);
app.use("/api/city", cityRoutes);
app.use("/api/hotel", hotelRoutes);
app.use("/api/seo-metadata", seoRoutes);
app.use("/api/image-collection", imageCollectionRoutes);
app.use("/api/room", roomRoutes);

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
