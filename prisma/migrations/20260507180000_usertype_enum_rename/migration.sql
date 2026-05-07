-- Migration: Rename enum Role -> UserType, remove ADMIN value, rename column role -> userType
--
-- Step 1: Create the new UserType enum
CREATE TYPE "UserType" AS ENUM ('CAREGIVER', 'SERVICE_PROVIDER');

-- Step 2: Add userType column using the new enum (temporarily nullable)
ALTER TABLE "User" ADD COLUMN "userType" "UserType";

-- Step 3: Populate userType from existing role column
--   ADMIN users are mapped to SERVICE_PROVIDER since ADMIN is now an RBAC role
UPDATE "User" SET "userType" = CASE
  WHEN role = 'CAREGIVER' THEN 'CAREGIVER'::"UserType"
  ELSE 'SERVICE_PROVIDER'::"UserType"
END;

-- Step 4: Make userType NOT NULL
ALTER TABLE "User" ALTER COLUMN "userType" SET NOT NULL;

-- Step 5: Drop the old role column
ALTER TABLE "User" DROP COLUMN "role";

-- Step 6: Drop the old Role enum
DROP TYPE "Role";
