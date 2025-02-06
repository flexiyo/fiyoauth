import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { sql } from "../db/index.js";

// Load RSA keys
const PRIVATE_KEY = readFileSync(
  path.resolve("./src/keys/private.pem"),
  "utf8"
);

/**
 * 🆕 Create a New Refresh Token (Stored in DB)
 */
export async function createRefreshToken({ user_id, device_id, device_name }) {
  const refresh_token = randomBytes(64).toString("hex");

  await sql`
        INSERT INTO tokens (device_id, user_id, refresh_token, device_name, last_used, created_at)
        VALUES (${device_id}, ${user_id}, ${refresh_token}, ${device_name}, NOW(), NOW())
        ON CONFLICT (device_id) DO UPDATE
        SET refresh_token = EXCLUDED.refresh_token, last_used = NOW()
    `;

  return refresh_token;
}

/**
 * 🔑 Create an Access Token (No DB Usage, Must Validate RT First)
 */
export async function createAccessToken({ refresh_token, device_id }) {
  const result = await sql`
        SELECT user_id, refresh_token FROM tokens
        WHERE device_id = ${device_id}
    `;

  if (!result.length || refresh_token !== result[0].refresh_token) return false;

  const access_token = jwt.sign(
    { user_id: result[0].user_id, device_id },
    PRIVATE_KEY,
    {
      algorithm: "RS256",
      expiresIn: "30m",
    }
  );

  return access_token;
}
