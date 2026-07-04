# Security Specification - Product Label Generator

This document details the security model, invariants, and test payload definitions for the Product Label Generator backend in Firestore.

## 1. Data Invariants
- **Identity Integrity**: Every product document has an `ownerId` which must strictly match the creator's authentication UID (`request.auth.uid`). No user can create or update a product with an `ownerId` belonging to another user.
- **Strict Owners-Only Reading & Writing**: Reads and writes on products are strictly locked to the owner of the document. Blanket or public reading of product lists is prohibited.
- **Temporal Integrity**: The `createdAt` timestamp must match the server's execution time (`request.time`) upon creation and must remain immutable on updates. The `updatedAt` timestamp must equal `request.time` on both creation and updates.
- **Value Constraints**:
  - `name`: Must be a string of length between 1 and 150.
  - `sku`: Must be an alphanumeric string of length between 3 and 32, containing only standard ID/barcode-safe characters (letters, numbers, hyphens).
  - `price`: Must be a non-negative number.
  - `stock`: Must be a non-negative integer.
  - `category`: Must be a non-empty string under 50 characters.
  - `templateId`: If present, must be a string under 50 characters.

## 2. The "Dirty Dozen" Payloads (Denial of Security Attacks)

These payloads are designed to challenge and test the integrity of the database rules. They must all be rejected with `PERMISSION_DENIED`.

1. **Unauthenticated Write**: Creating a product document without any authentication.
2. **Owner Spoofing (Create)**: Authenticated user `user_A` attempts to create a product document with `ownerId` set to `user_B`.
3. **Owner Spoofing (Update)**: Authenticated user `user_A` attempts to change a product's `ownerId` from `user_A` to `user_B`.
4. **Theft of Data (Read)**: Authenticated user `user_B` attempts to read a product document belonging to `user_A`.
5. **Theft of Data (List)**: Authenticated user `user_B` attempts to list products without filtering by `ownerId == user_B`, or attempts to fetch `user_A`'s products.
6. **Temporal Bypass (Create)**: Authenticated user `user_A` attempts to write `createdAt` with a backdated or future timestamp instead of `request.time`.
7. **Temporal Bypass (Update)**: Authenticated user `user_A` attempts to modify the immutable `createdAt` field on update.
8. **Negative Price Poisoning**: Authenticated user `user_A` attempts to write a product with `price = -5.0`.
9. **Negative Stock Poisoning**: Authenticated user `user_A` attempts to write a product with `stock = -10`.
10. **Shadow Key Injection**: Authenticated user `user_A` attempts to write a product containing an un-declared key `isVerifiedAdmin: true`.
11. **Path Variable ID Poisoning**: Authenticated user `user_A` attempts to write to a path `/products/INVALID_ID_WITH_SPECIAL_CHARACTERS_$$$` where the ID violates alphanumeric path standards.
12. **Junk Value Overflow**: Authenticated user `user_A` attempts to write a product with a `name` exceeding 200 characters, or an extremely long SKU of 500 characters.

## 3. Test Runner Definition

Tests will verify that our rules successfully reject these dirty dozen operations while allowing standard compliant operations for authenticated owners.
