import express from "express";
import cookieParser from "cookie-parser";
import userRouter from "./api/routes/user.routes.js";
import tokenRouter from "./api/routes/token.routes.js";
import { ApiResponse } from "./api/utils/ApiResponse.js";

/** Configurations */
const app = express();

app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

/** List of allowed origins */
const allowedOrigins = ["http://localhost:3000", "https://flexiyo.web.app"];

/** CORS Middleware */
app.use((req, res, next) => {
  const origin = req.get("Origin");
  const isApiRoute = req.path.startsWith("/api/v1");

  if (isApiRoute && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, kp-api-key"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  } else if (!isApiRoute) {
    next();
  } else {
    res
      .status(403)
      .json(new ApiResponse(403, null, "Forbidden: Access denied"));
  }
});

/** API Routes */
app.get("/api", (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, null, "Flexiyo Auth API is live"));
});

// Protected API routes
app.get("/api/v1", (req, res) => {
  res.status(200).json(new ApiResponse(200, null, "Allowed: Access approved"));
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/tokens", tokenRouter);

export { app };