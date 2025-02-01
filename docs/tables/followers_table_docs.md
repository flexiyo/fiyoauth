# Followers Table Documentation

## Overview

The `followers` table tracks the relationships between users in the system, specifically for following actions and status. It stores the follower and following user IDs, their relationship status, and timestamps for when the follow action was made.

## Table Schema

```sql
CREATE TABLE followers (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  follow_status TEXT DEFAULT 'pending',
  accepted_at TIMESTAMP DEFAULT NULL,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follow_ids_not_equal CHECK (follower_id != following_id)
);
```

## Columns

### 1. `follower_id`

- **Type**: `UUID`
- **Description**: The ID of the user who is following another user.
- **Foreign Key**: References the `id` field in the `users` table.
- **Constraints**: This column cannot be `NULL`.

### 2. `following_id`

- **Type**: `UUID`
- **Description**: The ID of the user who is being followed.
- **Foreign Key**: References the `id` field in the `users` table.
- **Constraints**: This column cannot be `NULL`.

### 3. `follow_status`

- **Type**: `TEXT`
- **Description**: Indicates the current status of the follow request.
  - `pending`: The follow request has been sent but not yet accepted.
  - `accepted`: The follow request has been accepted by the recipient.
- **Default**: `pending`

### 5. `accepted_at`

- **Type**: `TIMESTAMP`
- **Description**: Timestamp of when the following_id (user being followed) accepted the follow request. Defaults to `NULL`.
- **Default**: `NULL`

## Primary Key

The combination of `follower_id` and `following_id` forms the **Primary Key**, ensuring that each following relationship between users is unique.

```sql
PRIMARY KEY (follower_id, following_id)
```

### Foreign Keys

Both `follower_id` and `following_id` are foreign keys referencing the `users(id)` field. If a user is deleted from the `users` table, the corresponding rows in the `followers` table will also be deleted (due to the `ON DELETE CASCADE` clause).

## Constraints

### 1. `follow_ids_not_equal`

This constraint ensures that a user cannot follow themselves.

```sql
CONSTRAINT follow_ids_not_equal CHECK (follower_id != following_id)
```

## Behavior on Deletion

If the following relationship is deleted, the row will be removed automatically. If a user is deleted, the corresponding follower and following relationships are also deleted automatically.

## Usage Examples

### Sending a Follow Request

To send a follow request, insert a row into the `followers` table with `follow_status = 'pending'`:

```sql
INSERT INTO followers (follower_id, following_id, follow_status)
VALUES ('follower_uuid', 'following_uuid', 'pending');
```

### Accepting a Follow Request

When the recipient accepts the follow request, update the status to `accepted`:

```sql
UPDATE followers
SET follow_status = 'accepted'
WHERE follower_id = 'follower_uuid' AND following_id = 'following_uuid';
```

````

### Deleting a Follow Relationship

To delete a follow relationship (if rejected or removed), delete the row from the `followers` table:

```sql
DELETE FROM followers
WHERE follower_id = 'follower_uuid' AND following_id = 'following_uuid';
````

---
