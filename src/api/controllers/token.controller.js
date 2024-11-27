import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sql } from "../../db/index.js";

export const checkTokens = async (req, res) => {
  const fiyoat = req.headers["fiyoat"];
  const fiyort = req.headers["fiyort"];

  if (!fiyoat || !fiyort) {
    return res.status(401).json(new ApiResponse(401, null, "Tokens missing"));
  }

  let refreshTokenPayload;
  try {
    refreshTokenPayload = jwt.verify(fiyort, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json(new ApiResponse(401, null, "Refresh token expired"));
    }
  }

  const [user] = await sql`
    SELECT tokens
    FROM users
    WHERE id = ${refreshTokenPayload.userId} AND tokens->>'rt' = ${fiyort}
  `;

  if (!user) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "Invalid or expired refresh token"));
  }

  try {
    const accessTokenPayload = jwt.verify(
      fiyoat,
      process.env.ACCESS_TOKEN_SECRET
    );
    return res.status(200).json(
      new ApiResponse(200, "Tokens are valid", {
        accessTokenPayload,
        refreshTokenPayload,
      })
    );
  } catch (error) {
    if (error.name !== "TokenExpiredError") {
      return res
        .status(401)
        .json(new ApiResponse(401, null, "Invalid access token"));
    }
  }

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
    SET tokens = jsonb_set(
                  jsonb_set(tokens, '{at}', ${newAccessToken}, true),
                  '{rt}', ${newRefreshToken}, true
                )
    WHERE id = ${refreshTokenPayload.userId}
  `;

  return res.status(200).json(
    new ApiResponse(200, "Tokens were refreshed", {
      at: newAccessToken,
      rt: newRefreshToken,
    })
  );
};

export const revokeTokens = async (req, res) => {
  try {
    const fiyort = req.headers["fiyort"];

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

    return res
      .status(200)
      .json(new ApiResponse(200, "Tokens revoked successfully"));
  } catch (error) {
    throw new Error(`Error in revokeTokens: ${error}`);
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

  try {
    await sql`
      UPDATE users
      SET tokens = jsonb_set(
                    jsonb_set(tokens, '{at}', ${newAccessToken}, true),
                    '{rt}', ${newRefreshToken}, true
                  )
      WHERE id = ${userId}
    `;
  } catch (error) {
    throw new Error(`Error in createTokens: ${error}`);
  }

  return { newAccessToken, newRefreshToken };
};
