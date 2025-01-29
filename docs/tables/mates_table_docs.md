
# Mates Table Documentation

## Overview

The `mates` table handles the one-to-one relationship between users in the system, specifically for mate requests and status. It tracks the request status, the users involved, and timestamps for when requests are made.

## Table Schema

```sql
CREATE TABLE mates (
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  accepted_at TIMESTAMP DEFAULT NULL,
  PRIMARY KEY (initiator_id, mate_id),
  CONSTRAINT mate_ids_not_equal CHECK (initiator_id != mate_id)
);
```

## Columns

### 1. `initiator_id`
- **Type**: `UUID`
- **Description**: The ID of the user who sends the mate request (initiator).
- **Foreign Key**: References the `id` field in the `users` table.
- **Constraints**: This column cannot be `NULL`.

### 2. `mate_id`
- **Type**: `UUID`
- **Description**: The ID of the user receiving the mate request (the recipient).
- **Foreign Key**: References the `id` field in the `users` table.
- **Constraints**: This column cannot be `NULL`.

### 3. `status`
- **Type**: `TEXT`
- **Description**: Indicates the current status of the mate request.
  - `pending`: The request has been sent but not yet accepted or rejected.
  - `accepted`: The recipient has accepted the mate request.
- **Default**: `pending`

### 4. `accepted_at`
- **Type**: `TIMESTAMP`
- **Description**: Timestamp of when the mate_id (user being requested) accepted the mate request. Defaults to `NULL`.
- **Default**: `NULL`

## Primary Key

The combination of `initiator_id` and `mate_id` forms the **Primary Key**, ensuring that each pair of users can only have one unique mate relationship. This prevents duplicate rows for the same pair.

```sql
PRIMARY KEY (initiator_id, mate_id)
```

## Foreign Keys

Both `initiator_id` and `mate_id` are foreign keys referencing the `users(id)` field. If a user is deleted from the `users` table, the corresponding rows in the `mates` table will also be deleted (due to the `ON DELETE CASCADE` clause).

## Constraints

### 1. `mate_ids_not_equal`
This constraint ensures that a user cannot send a mate request to themselves.

```sql
CONSTRAINT mate_ids_not_equal CHECK (initiator_id != mate_id)
```

## Behavior on Deletion

If the mates relationship is deleted, the row will be removed automatically. If a user is deleted, the corresponding mate relationships are also deleted automatically.

## Usage Examples

### Sending a Mate Request

To send a mate request, insert a row into the `mates` table with `status = 'pending'`:

```sql
INSERT INTO mates (initiator_id, mate_id, status)
VALUES ('initiator_uuid', 'mate_uuid', 'pending');
```

### Accepting a Mate Request

When the recipient accepts the request, update the status to `accepted`:

```sql
UPDATE mates
SET status = 'accepted'
WHERE initiator_id = 'initiator_uuid' AND mate_id = 'mate_uuid';
```

### Rejecting a Mate Request

To reject a request, delete the row from the `mates` table:

```sql
DELETE FROM mates
WHERE initiator_id = 'initiator_uuid' AND mate_id = 'mate_uuid';
```

---

