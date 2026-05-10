-- Hotfix migration: ensure User.userType exists and is populated even if prior rename migration was missed.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'UserType'
  ) THEN
    CREATE TYPE "UserType" AS ENUM ('CAREGIVER', 'SERVICE_PROVIDER');
  END IF;
END
$$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "userType" "UserType";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'role'
  ) THEN
    EXECUTE '
      UPDATE "User"
      SET "userType" = CASE
        WHEN "role"::text = ''CAREGIVER'' THEN ''CAREGIVER''::"UserType"
        ELSE ''SERVICE_PROVIDER''::"UserType"
      END
      WHERE "userType" IS NULL
    ';
  END IF;
END
$$;

UPDATE "User"
SET "userType" = 'SERVICE_PROVIDER'::"UserType"
WHERE "userType" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "userType" SET NOT NULL;

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "role";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'Role'
  ) THEN
    DROP TYPE "Role";
  END IF;
END
$$;
