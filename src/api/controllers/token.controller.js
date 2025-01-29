import { sql } from "../../db/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { checkAccessToken } from "../../package/checkAccessToken.js";
import { createAccessToken } from "../utils/tokenHandler.js";

export const checkTokens = async (req, res) => {
  try {
    const access_token = req.headers?.fiyoat;
    const refresh_token = req.headers?.fiyort;
    const device_id = req.headers?.fiyodid;

    if (!access_token || !refresh_token || !device_id) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            null,
            "MissingHeaders: 'fiyoat', 'fiyort' or 'fiyodid'"
          )
        );
    }

    const result =
      await sql`SELECT refresh_token FROM tokens WHERE device_id = ${device_id}`;
    if (!result.length) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, "DeviceIdInvalidError"));
    }

    const isValidAT = await checkAccessToken({ access_token, device_id });
    if (!isValidAT) {
      return res.status(401).json(new ApiResponse(401, null, "ATInvalidError"));
    }

    if (refresh_token !== result[0].refresh_token) {
      return res.status(401).json(new ApiResponse(401, null, "RTInvalidError"));
    }

    return res.status(200).json(new ApiResponse(200, null, "ok"));
  } catch (error) {
    return ApiError(res, error, "Error in checkTokens.");
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refresh_token = req.headers?.fiyort;
    const device_id = req.headers?.fiyodid;

    if (!refresh_token || !device_id) {
      return res
        .status(401)
        .json(
          new ApiResponse(401, null, "MissingHeaders: 'fiyort' or 'fiyodid'")
        );
    }

    const access_token = await createAccessToken({ refresh_token, device_id });

    if (!access_token) {
      return res.status(401).json(new ApiResponse(401, null, "RTInvalidError"));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          headers: {
            fiyoat: access_token,
          },
        },
        "Access Token refreshed successfully."
      )
    );
  } catch (error) {
    return ApiError(res, error, "Error in refreshAccessToken.");
  }
};
