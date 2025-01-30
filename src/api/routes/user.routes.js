import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAllUsers,
  getUserProfile,
  searchUsers,
  getBulkUsers,
  loginUser,
  registerUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const userRouter = Router();

/** Public Endpoints */
userRouter.get("/", asyncHandler(getAllUsers));
userRouter.get("/search/:query", asyncHandler(searchUsers));
userRouter.get("/bulk", asyncHandler(getBulkUsers));
userRouter.post("/login", asyncHandler(loginUser));
userRouter.post("/register", asyncHandler(registerUser));

/** Private Endpoints */
userRouter.get("/profile/:username", asyncHandler(getUserProfile, true));
userRouter.put("/update", asyncHandler(updateUser, true));
userRouter.delete("/delete", asyncHandler(deleteUser, true));

export default userRouter;
