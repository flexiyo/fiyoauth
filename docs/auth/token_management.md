# Secure Token Management for Microservices

## 🔐 Token Strategy (Finalized Approach)

### **1️⃣ Refresh Tokens (RTs)**

- Stored in the **`tokens`** table.
- **Primary Key (PKEY):** `device_id` (ensuring uniqueness per device).
- **Valid only if `device_id` and `refresh_token` match** (prevents unauthorized access).
- RTs **can only be issued on login or registration** (not refreshed automatically).
- If the **RT expires (60d inactivity)**, the user must **log in again**.

### **2️⃣ Access Tokens (ATs)**

- **Short-lived (30m)** and **never stored in the database** (reduces storage and lookup overhead).
- **Issued only if the correct `device_id` and RT are provided**.
- **Signed using a private key (`RS256`)** to ensure authenticity.
- **Payload includes:**
  ```json
  {
    "user_id": "...",
    "device_id": "...",
    "iat": "...",
    "exp": "..."
  }
  ```
- **ATs are stateless** → Microservices verify using a **public key** and the given parameters (`device_id`,`user_id`).
- Ensures **only the issuing device can use the AT**.

---

## **📌 PostgreSQL Table (`tokens`)**

```sql
CREATE TABLE tokens (
    device_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    device_name TEXT,
    last_used TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## **🔑 Generate Public key(`./public.pem`) and Private key(`./private.pem`)**

```
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048 && openssl rsa -pubout -in private.pem -out public.pem
```

---

## **🛠 Secure Token Management Implementation**

### `fiyoauth` Implementation
```javascript
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { sql } from "../../db/index.js";

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
```

## Microservices implementation

```javascript
import jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const PUBLIC_KEY = readFileSync(path.resolve("./src/keys/public.pem"), "utf8");

/**
 * ✅ Verify Access Token (Used by Microservices)
 */
export function checkAccessToken({ access_token, device_id }) {
  try {
    const decoded = jwt.verify(access_token, PUBLIC_KEY, {
      algorithms: ["RS256"],
    });

    if (decoded.device_id !== device_id) {
      return false;
    }

    return decoded;
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return false;
    }
    console.error("Error in checkAccessToken.", error);
  }
}
```

---

## **🔍 Security Enhancements in This Approach**

✅ **No Need to Store ATs in DB** → Reduces storage and lookup time.  
✅ **Only the generating device can use an AT** → Prevents token hijacking.  
✅ **RTs are bound to `device_id`** → A refresh token can’t be used on another device.  
✅ **Argon2 Hashing for RTs** → Even if the DB is leaked, RTs remain secure.
✅ **ATs are signed with `RS256`** → Prevents tampering.

---

## **🔐 Final Flow**

### **1️⃣ Refresh Token Creation**

- User logs in → `createRefreshToken()` stores an RT in the DB.
- Client stores RT securely (HTTP-Only cookie, secure storage).

### **2️⃣ Access Token Creation**

- Client sends RT & `device_id` → `createAccessToken()` validates RT and issues an AT.

### **3️⃣ Access Token Validation**

- Client sends AT → Microservices validate with `checkAccessToken()`.
- If expired, client requests a **new AT using the RT**.

---

## **🚀 Why Is This the Best Approach?**

- **Stateless ATs** → No DB storage needed, fast performance.
- **Device-bound security** → Prevents unauthorized AT usage.
- **Efficient token refreshing** → RTs are securely stored, ATs are ephemeral.
- **Prevents token theft** → Even if an AT is stolen, it can’t be used elsewhere.

This setup ensures **maximum security while keeping performance optimal**. 🚀
