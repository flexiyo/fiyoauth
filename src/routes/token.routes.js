import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  checkTokens,
  refreshAccessToken,
} from "../controllers/token.controller.js";

const tokenRouter = Router();
tokenRouter.get("/check", asyncHandler(checkTokens));
tokenRouter.get("/refresh", asyncHandler(refreshAccessToken));

export default tokenRouter;
