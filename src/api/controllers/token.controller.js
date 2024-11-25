import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { sql } from "../../db/index.js";

export const checkTokens = async (req, res) => {
  try {
    const { fiyoat, fiyort } = req.cookies;

    if (!fiyoat || !fiyort)
      return res.status(401).json(new ApiResponse(401, null, "Tokens missing"));

    const refreshTokenPayload = jwt.verify(
      fiyort,
      process.env.REFRESH_TOKEN_SECRET
    );

    const result = await sql`
      SELECT tokens
      FROM users
      WHERE id = ${refreshTokenPayload.userId} AND tokens->>'rt' = ${fiyort}
    `;

    if (result.length === 0) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, "Invalid or expired refresh token"));
    }

    let accessTokenPayload;
    try {
      accessTokenPayload = jwt.verify(fiyoat, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        const newAccessToken = jwt.sign(
          { userId: refreshTokenPayload.userId },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "12h" }
        );
        const newRefreshToken = jwt.sign(
          { userId: refreshTokenPayload.userId },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "60d" }
        );

        await sql`
          UPDATE users
          SET tokens = jsonb_set(tokens, '{at}', '"${newAccessToken}"', true),
              tokens = jsonb_set(tokens, '{rt}', '"${newRefreshToken}"', true)
          WHERE id = ${refreshTokenPayload.userId}
        `;

        res.cookie("fiyoat", newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
          maxAge: 12 * 60 * 60 * 1000,
        });

        res.cookie("fiyort", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
          maxAge: 60 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json(
          new ApiResponse(200, "Tokens were refreshed", {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        );
      }
      return res
        .status(401)
        .json(new ApiResponse(401, null, "Invalid access token"));
    }

    return res.status(200).json(
      new ApiResponse(200, "Tokens are valid", {
        accessTokenPayload,
        refreshTokenPayload,
      })
    );
  } catch (error) {
    throw new ApiError(401, "Token validation failed: " + error.message);
  }
};

export const revokeTokens = async (req, res) => {
  try {
    const { fiyort } = req.cookies;

    if (!fiyort)
      return res
        .status(401)
        .json(new ApiResponse(401, null, "Refresh token is missing"));

    const payload = jwt.verify(fiyort, process.env.REFRESH_TOKEN_SECRET);

    await sql`
      UPDATE users
      SET tokens = tokens - 'at' - 'rt'
      WHERE id = ${payload.userId}
    `;

    res.clearCookie("fiyoat").clearCookie("fiyort");

    return res
      .status(200)
      .json(new ApiResponse(200, "Tokens revoked and session terminated"));
  } catch (error) {
    throw new ApiError(401, "Failed to revoke tokens: " + error.message);
  }
};

export const createTokens = async (userId) => {
  if (!userId) throw new Error("userId is required");

  const newAccessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "12h",
  });

  const newRefreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "60d" }
  );

  const cookies = {
    accessTokenCookie: {
      name: "fiyoat",
      value: newAccessToken,
      options: {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 12 * 60 * 60 * 1000,
      },
    },
    refreshTokenCookie: {
      name: "fiyort",
      value: newRefreshToken,
      options: {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 60 * 24 * 60 * 60 * 1000,
      },
    },
  };

  return cookies;
};
