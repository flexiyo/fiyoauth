import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { sql } from "../../db/index.js";
import { validatePayload } from "../utils/validatePayload.js";

const getUserFollowers = async (req, res) => {
  try {
    const requiredFields = ["id"];
    validatePayload(req.params, requiredFields, res);

    const { limit = 20, offset = 0 } = req.query;

    const result = await sql`
    SELECT 
      u.id, u.username, u.avatar,
      EXISTS (
        SELECT follow_status FROM followers 
        WHERE following_id = ${req.user.id} 
          AND follower_id = u.id
      ) AS follow_status
    FROM users u
    WHERE u.id IN (
      SELECT follower_id FROM followers WHERE following_id = ${req.params.id}
    )
    LIMIT ${limit} OFFSET ${offset};
  `;

    if (!result.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, [], "Followers not found."));
    }

    const formattedResult = result.map(
      ({ id, username, avatar, follow_status }) => ({
        user: { id, username, avatar },
        relation: { follow_status },
      })
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formattedResult,
          "Followers retrieved successfully."
        )
      );
  } catch (error) {
    return ApiError(res, error, "Error in getUserFollowers.");
  }
};

const getUserFollowing = async (req, res) => {
  try {
    const requiredFields = ["id"];
    validatePayload(req.params, requiredFields, res);

    const { limit = 20, offset = 0 } = req.query;

    const result = await sql`
      SELECT 
        u.id, u.username, u.avatar,
        EXISTS (
          SELECT 1 FROM followers 
          WHERE follower_id = ${req.user.id} 
            AND following_id = u.id
        ) AS follow_status
      FROM users u
      WHERE u.id IN (
        SELECT following_id FROM followers WHERE follower_id = ${req.params.id}
      )
      LIMIT ${limit} OFFSET ${offset};
    `;

    if (!result.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, [], "Following users not found."));
    }

    const formattedResult = result.map(
      ({ id, username, avatar, follow_status }) => ({
        user: { id, username, avatar },
        relation: { follow_status },
      })
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formattedResult,
          "Following users retrieved successfully."
        )
      );
  } catch (error) {
    return ApiError(res, error, "Error in getUserFollowing.");
  }
};

const getPendingFollowRequests = async (req, res) => {
  try {
    const result = await sql`
      SELECT f.follower_id, u.username, u.avatar
      FROM followers f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ${req.user.id} AND f.follow_status = 'pending'
    `;

    if (result.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Pending follow requests not found."));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Pending follow requests retrieved successfully."
        )
      );
  } catch (error) {
    return ApiError(res, error, "Error in getPendingFollowRequests.");
  }
};

const sendFollowRequest = async (req, res) => {
  try {
    const requiredFields = ["following_id"];
    validatePayload(req.body, requiredFields, res);

    const result = await sql`
      INSERT INTO followers (follower_id, following_id, follow_status)
      SELECT ${req.user.id}, ${req.body.following_id}, 'pending'
      WHERE NOT EXISTS (
        SELECT 1 FROM followers 
        WHERE follower_id = ${req.user.id} 
          AND following_id = ${req.body.following_id}
      )
      RETURNING *;
    `;

    if (result.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "You have already sent a follow request to this user or you already follow this user."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Follow request sent successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in sendFollowRequest.");
  }
};

const unsendFollowRequest = async (req, res) => {
  try {
    const requiredFields = ["following_id"];
    validatePayload(req.body, requiredFields, res);

    const result = await sql`
      DELETE FROM followers
      WHERE follower_id = ${req.user.id} 
        AND following_id = ${req.body.following_id} 
        AND follow_status = 'pending'
      RETURNING *;
    `;

    if (result.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Follow request not found or already accepted/rejected."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Follow request undone successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in unsendFollowRequest.");
  }
};

const acceptFollowRequest = async (req, res) => {
  try {
    const requiredFields = ["follower_id"];
    validatePayload(req.body, requiredFields, res);

    const result = await sql`
      UPDATE followers
      SET follow_status = 'accepted'
      WHERE follower_id = ${req.body.follower_id} 
        AND following_id = ${req.user.id} 
        AND follow_status = 'pending'
      RETURNING *;
    `;

    if (result.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Follow request not found or already accepted/rejected."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Follow request accepted successfully.")
      );
  } catch (error) {
    return ApiError(res, error, "Error in acceptFollowRequest.");
  }
};

const rejectFollowRequest = async (req, res) => {
  try {
    const requiredFields = ["follower_id"];
    validatePayload(req.body, requiredFields, res);

    const result = await sql`
      DELETE FROM followers
      WHERE follower_id = ${req.body.follower_id} 
        AND following_id = ${req.user.id} 
        AND follow_status = 'pending'
      RETURNING *;
    `;

    if (result.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Follow request not found or already accepted/rejected."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Follow request rejected successfully.")
      );
  } catch (error) {
    return ApiError(res, error, "Error in rejectFollowRequest.");
  }
};

const getUserMates = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.body;

    const result = await sql`
      SELECT 
        u.id,
        u.username,
        u.avatar
      FROM mates m
      JOIN users u ON u.id = 
        CASE 
          WHEN m.initiator_id = ${req.user.id} THEN m.mate_id
          ELSE m.initiator_id
        END
      WHERE (m.initiator_id = ${req.user.id} OR m.mate_id = ${req.user.id})
        AND m.mate_status = 'accepted'
      LIMIT ${limit} OFFSET ${offset};
    `;

    if (!result.length) {
      return res.status(404).json(new ApiResponse(404, [], "Mates not found."));
    }

    const formattedResult = result.map(({ user_id, username, avatar }) => ({
      user: { id, username, avatar },
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(200, formattedResult, "Mates retrieved successfully.")
      );
  } catch (error) {
    return ApiError(res, error, "Error in getUserMates.");
  }
};

const getPendingMateRequests = async (req, res) => {
  try {
    const result = await sql`
        SELECT m.initiator_id, u.username, u.avatar
        FROM mates m
        JOIN users u ON m.initiator_id = u.id
        WHERE m.mate_id = ${req.user.id} AND m.mate_status = 'pending'
      `;

    if (result.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Pending mate requests not found."));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Pending mate requests retrieved successfully."
        )
      );
  } catch (error) {
    return ApiError(res, error, "Error in getPendingMateRequests.");
  }
};

const sendMateRequest = async (req, res) => {
  try {
    const requiredFields = ["mate_id"];
    validatePayload(req.body, requiredFields, res);

    const result = await sql`
      INSERT INTO mates (initiator_id, mate_id, mate_status)
      SELECT ${req.user.id}, ${req.body.mate_id}, 'pending'
      WHERE NOT EXISTS (
        SELECT 1 FROM mates 
        WHERE (initiator_id = ${req.user.id} AND mate_id = ${req.body.mate_id})
           OR (initiator_id = ${req.body.mate_id} AND mate_id = ${req.user.id})
      )
      RETURNING *;
    `;

    if (result.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "You have already sent a mate request to this user or you both are already mates."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Mate request sent successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in sendMateRequest.");
  }
};

const unsendMateRequest = async (req, res) => {
  try {
    const requiredFields = ["mate_id"];
    validatePayload(req.body, requiredFields, res);

    const result = await sql`
      DELETE FROM mates
      WHERE initiator_id = ${req.user.id} 
        AND mate_id = ${req.body.mate_id} 
        AND mate_status = 'pending'
      RETURNING *;
    `;

    if (result.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Mate request not found or already accepted/rejected."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Mate request undone successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in unsendMateRequest.");
  }
};

const acceptMateRequest = async (req, res) => {
  try {
    const requiredFields = ["initiator_id"];
    validatePayload(req.body, requiredFields, res);

    const result = await sql`
      UPDATE mates
      SET mate_status = 'accepted'
      WHERE initiator_id = ${req.body.initiator_id} 
        AND mate_id = ${req.user.id} 
        AND mate_status = 'pending'
      RETURNING *;
    `;

    if (result.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Mate request not found or already accepted/rejected."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Mate request accepted successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in acceptMateRequest.");
  }
};

const rejectMateRequest = async (req, res) => {
  try {
    const requiredFields = ["initiator_id"];
    validatePayload(req.body, requiredFields, res);

    const result = await sql`
      DELETE FROM mates
      WHERE initiator_id = ${req.body.initiator_id} 
        AND mate_id = ${req.user.id} 
        AND mate_status = 'pending'
      RETURNING *;
    `;

    if (result.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Mate request not found or already accepted/rejected."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Mate request rejected successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in rejectMateRequest.");
  }
};

export {
  getUserFollowers,
  getUserFollowing,
  getPendingFollowRequests,
  sendFollowRequest,
  unsendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getUserMates,
  getPendingMateRequests,
  sendMateRequest,
  unsendMateRequest,
  acceptMateRequest,
  rejectMateRequest,
};
