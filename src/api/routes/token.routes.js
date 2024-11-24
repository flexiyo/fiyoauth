import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { checkTokens, revokeTokens } from "../controllers/token.controller.js";

const tokenRouter = Router();
tokenRouter.get("/check", asyncHandler(checkTokens));
tokenRouter.get("/revoke", asyncHandler(revokeTokens));

export default tokenRouter;
