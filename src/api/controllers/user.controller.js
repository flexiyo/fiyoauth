import iplocate from "node-iplocate";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { sql } from "../../db/index.js";
import { createTokens } from "../controllers/token.controller.js";
import { validatePayload } from "../utils/validatePayload.js";

export const getAllUsers = async (req, res) => {
  try {
    const query = sql`SELECT * FROM users;`;
    const result = await query;
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Users found successfully."));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export const getUser = async (req, res) => {
  try {
    const username = req.params.username;
    const query = sql`SELECT * FROM users WHERE username = ${username};`;
    const result = await query;

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, `User '${username}' not found.`));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "User found successfully."));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export const searchUsers = async (req, res) => {
  try {
    const query = sql`SELECT * FROM users WHERE username LIKE ${`%${req.params.query}%`} OR full_name LIKE ${`%${req.params.query}%`};`;

    const result = await query;

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
    throw new ApiError(500, error.message);
  }
};

export const loginUser = async (req, res) => {
  try {
    const requiredFields = ["username", "password"];
    validatePayload(req.body, requiredFields, res);

    const { username, password } = req.body;

    const result = await sql`
      SELECT id, full_name, username, password, email, gender, dob, profession, bio, account_type, is_private, avatar, banner, created_at
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

    const { accessTokenCookie, refreshTokenCookie } = await createTokens(
      result[0].id
    );

    res.cookie(
      "userInfo",
      JSON.stringify({
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
      }),
      {
        httpOnly: false,
        secure: true,
        sameSite: "None",
        maxAge: 365 * 24 * 60 * 60 * 1000,
        path: "/",
      }
    );

    res.cookie(
      accessTokenCookie.name,
      accessTokenCookie.value,
      accessTokenCookie.options
    );

    res.cookie(
      refreshTokenCookie.name,
      refreshTokenCookie.value,
      refreshTokenCookie.options
    );

    delete result[0].password;
    delete result[0].tokens;
    
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Login successful."));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export const registerUser = async (req, res) => {
  const requiredFields = ["username", "password", "fullName", "accountType"];
  validatePayload(req.body, requiredFields, res);

  const { username, password, fullName, accountType } = req.body;

  const userIP =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress;

  let userIpData;

  try {
    userIpData = await iplocate(userIP);
  } catch (error) {
    throw new ApiResponse(500, null, error.message);
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

  const { accessTokenCookie, refreshTokenCookie } = await createTokens(
    userInfo.id
  );

  userInfo.tokens = {
    at: accessTokenCookie.value,
    rt: refreshTokenCookie.value,
  };

  try {
    const userCheckQuery = sql`
        SELECT COUNT(*) FROM users WHERE username = ${username};
      `;
    const userCheckResult = await userCheckQuery;

    if (parseInt(userCheckResult[0].count) > 0) {
      return res
        .status(400)
        .json({ message: "Username has already been taken." });
    }

    const insertQuery = sql`
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
    await insertQuery;

    res.cookie(
      "userInfo",
      JSON.stringify({
        id: userInfo.id,
        fullName: userInfo.fullName,
        username: userInfo.username,
        email: userInfo.email,
        gender: userInfo.gender,
        dob: userInfo.dob,
        profession: userInfo.profession,
        bio: userInfo.bio,
        accountType: userInfo.accountType,
        isPrivate: userInfo.isPrivate,
        avatar: userInfo.avatar,
        banner: userInfo.banner,
        createdAt: userInfo.createdAt,
      }),
      {
        httpOnly: false,
        secure: true,
        sameSite: "None",
        maxAge: 365 * 24 * 60 * 60 * 1000,
        path: "/",
      }
    );

    res.cookie(
      accessTokenCookie.name,
      accessTokenCookie.value,
      accessTokenCookie.options
    );

    res.cookie(
      refreshTokenCookie.name,
      refreshTokenCookie.value,
      refreshTokenCookie.options
    );

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User registered successfully."));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const query = sql`UPDATE users SET ${sql(data)} WHERE id = ${id};`;
    await query;
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User updated successfully."));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const requiredFields = ["id"];
    validatePayload(req.body, requiredFields, res);

    const { id } = req.body;

    const query = sql`DELETE FROM users WHERE id = ${id};`;
    await query;
    res.clearCookie("userInfo").clearCookie("fiyoat").clearCookie("fiyort");
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User deleted successfully."));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};
