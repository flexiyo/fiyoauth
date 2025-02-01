import bcrypt from "bcrypt";
import iplocate from "node-iplocate";
import { v4 as uuidv4 } from "uuid";
import { sql } from "../../db/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  createAccessToken,
  createRefreshToken,
} from "../utils/tokenHandler.js";
import { validatePayload } from "../utils/validatePayload.js";

const getAllUsers = async (req, res) => {
  try {
    const result = await sql`
      SELECT id, username, full_name, avatar FROM users;
    `;
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Users retrieved successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in getAllUsers.");
  }
};
const getUserProfile = async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.bio, 
        u.avatar, 
        u.banner,
        COALESCE(COUNT(DISTINCT f1.follower_id), 0) AS followers_count,
        COALESCE(COUNT(DISTINCT f2.following_id), 0) AS following_count,
        COALESCE(COUNT(DISTINCT p.user_id), 0) AS posts_count
      FROM users u
      LEFT JOIN followers f1 
        ON f1.following_id = u.id 
        AND f1.follow_status = 'accepted'
      LEFT JOIN followers f2 
        ON f2.follower_id = u.id 
        AND f2.follow_status = 'accepted'
      LEFT JOIN posts p 
        ON p.user_id = u.id
      WHERE u.username = ${req.params.username}
      GROUP BY u.id
      LIMIT 1;
    `;

    if (!result.length) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            `User '@${req.params.username}' not found.`
          )
        );
    }

    const [row] = await sql`
      SELECT 
        f.follower_id, f.following_id, f.follow_status, 
        m.initiator_id, m.mate_id, m.mate_status
      FROM followers f
      LEFT JOIN mates m 
        ON (m.initiator_id = ${req.user.id} AND m.mate_id = ${result[0].id}) 
        OR (m.initiator_id = ${result[0].id} AND m.mate_id = ${req.user.id})
      WHERE (f.follower_id = ${req.user.id} AND f.following_id = ${result[0].id})
         OR (f.follower_id = ${result[0].id} AND f.following_id = ${req.user.id})
      LIMIT 1;
    `;

    let relation = {};

    if (row) {
      relation = {
        follow: {
          follow_status:
            row.follower_id === req.user.id ? row.follow_status : null,
          is_followed:
            row.following_id === req.user.id &&
            row.follow_status === "accepted",
        },
        mate: {
          mate_status: row.mate_status || null,
        },
      };
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...result[0],
          relation,
        },
        "User found successfully."
      )
    );
  } catch (error) {
    return ApiError(res, error, "Error in getUserProfile.");
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = `%${req.params.query}%`;
    const result = await sql`
      SELECT id, username, full_name, avatar 
      FROM users WHERE username ILIKE ${query} OR full_name ILIKE ${query};
    `;

    if (!result.length) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            `No results found for '${req.params.query}'.`
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Search results found successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in searchUsers.");
  }
};

const getBulkUsers = async (req, res) => {
  try {
    validatePayload(req.body, ["userIds"], res);

    const result = await sql`
      SELECT id, username, full_name, avatar FROM users WHERE id = ANY(${req.body.userIds});
    `;

    if (!result.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Users not found."));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Users found successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in getBulkUsers.");
  }
};

const loginUser = async (req, res) => {
  try {
    validatePayload(req.body, ["username", "password", "device_name"], res);

    const { username, password, device_name } = req.body;

    const result = await sql`
      SELECT id, username, password, avatar FROM users WHERE username = ${username} LIMIT 1;
    `;

    if (!result.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, `User '${username}' not found.`));
    }

    const user = result[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, "Incorrect password."));
    }

    const device_id = uuidv4();
    const refresh_token = await createRefreshToken({
      user_id: user.id,
      device_id,
      device_name,
    });
    const access_token = await createAccessToken({ refresh_token, device_id });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          headers: {
            fiyort: refresh_token,
            fiyoat: access_token,
            fiyodid: device_id,
          },
        },
        "Login successful."
      )
    );
  } catch (error) {
    return ApiError(res, error, "Error in loginUser.");
  }
};

const registerUser = async (req, res) => {
  try {
    validatePayload(
      req.body,
      ["username", "password", "full_name", "account_type", "device_name"],
      res
    );

    const { username, password, full_name, account_type, device_name } =
      req.body;

    const userExists = await sql`
      SELECT COUNT(*) FROM users WHERE username = ${username};
    `;

    if (userExists[0].count > 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Username is already taken."));
    }

    const userIP =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.headers["x-real-ip"] ||
      req.socket.remoteAddress;
    let userIpData = null;

    try {
      userIpData = await iplocate(userIP);
    } catch (error) {
      console.warn("IP Location failed, proceeding without it.");
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (id, full_name, username, password, origin, account_type)
      VALUES (${id}, ${full_name}, ${username}, ${hashedPassword}, ${JSON.stringify(
      userIpData
    )}, ${account_type});
    `;

    const device_id = uuidv4();
    const refresh_token = await createRefreshToken({
      user_id: id,
      device_id,
      device_name,
    });
    const access_token = await createAccessToken({ refresh_token, device_id });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id,
          username,
          avatar:
            "https://cdnfiyo.github.io/img/user/avatars/default-avatar.jpg",
          headers: {
            fiyort: refresh_token,
            fiyoat: access_token,
            fiyodid: device_id,
          },
        },
        "User registered successfully."
      )
    );
  } catch (error) {
    return ApiError(res, error, "Error in registerUser.");
  }
};

const updateUser = async (req, res) => {
  try {
    const allowedFields = [
      "full_name",
      "username",
      "gender",
      "dob",
      "profession",
      "account_type",
      "is_private",
      "bio",
      "avatar",
      "banner",
    ];
    const updatedData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(updatedData).length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, "Invalid payload. No updatable fields.")
        );
    }

    await sql`UPDATE users SET ${sql(updatedData)} WHERE id = ${req.user.id};`;

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User updated successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in updateUser.");
  }
};

const deleteUser = async (req, res) => {
  try {
    await sql`DELETE FROM users WHERE id = ${req.user.id};`;
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User deleted successfully."));
  } catch (error) {
    return ApiError(res, error, "Error in deleteUser.");
  }
};

export {
  getAllUsers,
  getUserProfile,
  searchUsers,
  getBulkUsers,
  loginUser,
  registerUser,
  updateUser,
  deleteUser,
};
