import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAllUsers,
  getUser,
  searchUsers,
  loginUser,
  registerUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.get("/", asyncHandler(getAllUsers));
userRouter.get("/get/:username", asyncHandler(getUser));
userRouter.get("/search/:query", asyncHandler(searchUsers));
userRouter.post("/login", asyncHandler(loginUser));
userRouter.post("/register", asyncHandler(registerUser));
userRouter.put("/update", asyncHandler(updateUser));
userRouter.delete("/delete", asyncHandler(deleteUser));

export default userRouter;
