import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sql } from "../../db/index.js";

export const checkTokens = async (req, res) => {
  const fiyoat = req.headers["fiyoat"];
  const fiyort = req.headers["fiyort"];

  if (!fiyoat || !fiyort)
    return res
      .status(401)
      .json(
        new ApiResponse(401, { errorName: "RTInvalidError" }, "Tokens missing")
      );

  let refreshTokenPayload;
  try {
    refreshTokenPayload = jwt.verify(fiyort, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { errorName: "RTInvalidError" },
            "Refresh token expired"
          )
        );
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { errorName: "RTInvalidError" },
          "Invalid refresh token"
        )
      );
  }

  const [user] = await sql`
    SELECT tokens FROM users WHERE id = ${refreshTokenPayload.userId} AND (tokens->>'rt' = ${fiyort} OR tokens->>'rt' IS NULL)
  `;

  if (!user)
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { errorName: "RTInvalidError" },
          "Invalid or expired refresh token"
        )
      );

  const tokens = user.tokens || {};
  if (!tokens.rt || !fiyoat)
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { errorName: "RTInvalidError" },
          "Tokens missing or invalid"
        )
      );

  try {
    jwt.verify(fiyoat, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const { newAccessToken, newRefreshToken } = await createTokens(
        refreshTokenPayload.userId
      );
      await sql`
        UPDATE users SET tokens = ${JSON.stringify({
          at: newAccessToken,
          rt: newRefreshToken,
        })}::jsonb
        WHERE id = ${refreshTokenPayload.userId}
      `;
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { at: newAccessToken, rt: newRefreshToken },
            "Tokens were refreshed"
          )
        );
    }
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { errorName: "ATInvalidError" },
          "Invalid access token"
        )
      );
  }

  return res.status(200).json(new ApiResponse(200, "Tokens are valid"));
};

export const revokeTokens = async (req, res) => {
  try {
    const fiyort = req.headers["fiyort"];

    if (!fiyort)
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { errorName: "RTInvalidError" },
            "Refresh token is missing"
          )
        );

    const payload = jwt.verify(fiyort, process.env.REFRESH_TOKEN_SECRET);

    await sql`
      UPDATE users
      SET tokens = tokens - 'at' - 'rt'
      WHERE id = ${payload.userId}
    `;

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Tokens revoked successfully"));
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

  return { newAccessToken, newRefreshToken };
};
