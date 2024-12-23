import iplocate from "node-iplocate";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sql } from "../../db/index.js";
import { createTokens } from "../controllers/token.controller.js";
import { validatePayload } from "../utils/validatePayload.js";

export const getAllUsers = async (req, res) => {
  try {
    const result =
      await sql`SELECT id, username, full_name, avatar FROM users;`;
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Users found successfully."));
  } catch (error) {
    throw new Error(`Error in getAllUsers: ${error}`);
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await sql`
      SELECT id, username, full_name, avatar FROM users WHERE id = ${userId};
    `;

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, `User '${userId}' not found.`));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result[0], "User found successfully."));
  } catch (error) {
    throw new Error(`Error in getUserById: ${error}`);
  }
};

export const getBulkUsers = async (req, res) => {
  try {
    const userIds = req.body.userIds;
    const result = await sql`
      SELECT id, username, full_name, avatar FROM users WHERE id = ANY(${userIds});
    `;

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Users not found."));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Users found successfully."));
  } catch (error) {
    throw new Error(`Error in getBulkUsers: ${error}`);
  }
};

export const searchUsers = async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM users WHERE username LIKE ${`%${req.params.query}%`} OR full_name LIKE ${`%${req.params.query}%`}
    `;

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, `User '${req.params.query}' not found.`)
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "User found successfully."));
  } catch (error) {
    throw new Error(`Error in searchUsers: ${error}`);
  }
};

export const loginUser = async (req, res) => {
  try {
    const requiredFields = ["username", "password"];
    validatePayload(req.body, requiredFields, res);

    const { username, password } = req.body;

    const result = await sql`
      SELECT id, full_name, username, password, email, gender, dob, profession, bio, account_type, is_private, avatar, banner, created_at, tokens
      FROM users
      WHERE username = ${username}
    `;

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, `User '${username}' not found.`));
    }

    if (result[0].password !== password) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, "Incorrect password."));
    }

    const tokens = result[0].tokens || {};
    let refreshToken = tokens.rt;
    let accessToken;

    const isRefreshTokenValid = (() => {
      if (!refreshToken) return false;
      try {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        return true;
      } catch (error) {
        return false;
      }
    })();

    if (!isRefreshTokenValid) {
      const { newRefreshToken, newAccessToken } = await createTokens(result[0].id);
      refreshToken = newRefreshToken;
      accessToken = newAccessToken;
    } else {
      const { newAccessToken } = await createTokens(result[0].id);
      accessToken = newAccessToken;
    }

    const updatedTokens = {
      rt: refreshToken,
      at: accessToken,
    };

    await sql`
      UPDATE users
      SET tokens = ${updatedTokens}::jsonb
      WHERE id = ${result[0].id}
    `;

    const userInfo = {
      id: result[0].id,
      fullName: result[0].full_name,
      username: result[0].username,
      email: result[0].email,
      gender: result[0].gender,
      dob: result[0].dob,
      profession: result[0].profession,
      bio: result[0].bio,
      accountType: result[0].account_type,
      isPrivate: result[0].is_private,
      avatar: result[0].avatar,
      banner: result[0].banner,
      createdAt: result[0].created_at,
      tokens: updatedTokens,
    };

    delete userInfo.password;

    return res
      .status(200)
      .json(new ApiResponse(200, userInfo, "Login successful."));
  } catch (error) {
    throw new Error(`Error in loginUser: ${error}`);
  }
};

export const registerUser = async (req, res) => {
  try {
    const requiredFields = ["username", "password", "fullName", "accountType"];
    validatePayload(req.body, requiredFields, res);

    const { username, password, fullName, accountType } = req.body;

    const userIP =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.headers["x-real-ip"] ||
      req.socket.remoteAddress;

    let userIpData;

    try {
      userIpData = await iplocate(userIP);
    } catch (error) {
      throw new Error(`Error in iplocate: ${error}`);
    }

    const userInfo = {
      id: uuidv4(),
      fullName,
      username,
      password,
      origin: {
        ip: userIP,
        city: userIpData.city,
        subdivision: userIpData.subdivision,
        country: userIpData.country,
        continent: userIpData.continent,
        timezone: userIpData.time_zone,
      },
      bio: "Hi, I am new here on Flexiyo!",
      accountType,
      isPrivate: true,
      avatar: "https://cdnfiyo.github.io/img/user/avatars/default-avatar.jpg",
      banner: "https://cdnfiyo.github.io/img/user/banners/default-banner.jpg",
      createdAt: Date.now(),
    };

    const { newAccessToken, newRefreshToken } = await createTokens(userInfo.id);

    userInfo.tokens = {
      at: newAccessToken,
      rt: newRefreshToken,
    };

    const userCheckResult = await sql`
        SELECT COUNT(*) FROM users WHERE username = ${username};
      `;

    if (parseInt(userCheckResult[0].count) > 0) {
      return res
        .status(400)
        .json({ message: "Username has already been taken." });
    }

    await sql`
        INSERT INTO users (
          id, full_name, username, password, origin, bio,
          account_type, is_private, avatar, banner, created_at, tokens
        ) VALUES (
          ${userInfo.id}, ${userInfo.fullName}, ${userInfo.username}, ${userInfo.password}, ${userInfo.origin}, 
          ${userInfo.bio}, ${userInfo.accountType}, ${userInfo.isPrivate},
          ${userInfo.avatar}, ${userInfo.banner}, ${userInfo.createdAt}, 
          ${userInfo.tokens}
        )
      `;

    delete userInfo.password;

    return res
      .status(200)
      .json(new ApiResponse(200, userInfo, "User registered successfully."));
  } catch (error) {
    throw new Error(`Error in registerUser: ${error}`);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id, ...data } = req.body;
    await sql`UPDATE users SET ${sql(data)} WHERE id = ${id};`;
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User updated successfully."));
  } catch (error) {
    throw new Error(`Error in updateUser: ${error}`);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const requiredFields = ["id"];
    validatePayload(req.body, requiredFields, res);

    const { id } = req.body;

    await sql`DELETE FROM users WHERE id = ${id};`;

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User deleted successfully."));
  } catch (error) {
    throw new Error(`Error in deleteUser: ${error}`);
  }
};

