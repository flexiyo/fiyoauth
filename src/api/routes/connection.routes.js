import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getUserFollowers,
  getUserFollowing,
  getPendingFollowRequests,
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getUserMates,
  getPendingMateRequests,
  sendMateRequest,
  acceptMateRequest,
  rejectMateRequest,
} from "../controllers/connection.controller.js";

const connectionRouter = Router();

/** Followers */
// Lists
connectionRouter.get(
  "/followers/:username",
  asyncHandler(getUserFollowers, true)
);
connectionRouter.get(
  "/following/:username",
  asyncHandler(getUserFollowing, true)
);
connectionRouter.get(
  "/pending/follow_requests",
  asyncHandler(getPendingFollowRequests, true)
);

// Actions
connectionRouter.post(
  "/send/follow_request",
  asyncHandler(sendFollowRequest, true)
);
connectionRouter.post(
  "/accept/follow_request",
  asyncHandler(acceptFollowRequest, true)
);
connectionRouter.post(
  "/reject/follow_request",
  asyncHandler(rejectFollowRequest, true)
);

/** Mates */
// Lists
connectionRouter.get("/mates", asyncHandler(getUserMates, true));
connectionRouter.get(
  "/pending/mate_requests",
  asyncHandler(getPendingMateRequests, true)
);

// Actions
connectionRouter.post(
  "/send/mate_request",
  asyncHandler(sendMateRequest, true)
);
connectionRouter.post(
  "/accept/mate_request",
  asyncHandler(acceptMateRequest, true)
);
connectionRouter.post(
  "/reject/mate_request",
  asyncHandler(rejectMateRequest, true)
);

export default connectionRouter;
