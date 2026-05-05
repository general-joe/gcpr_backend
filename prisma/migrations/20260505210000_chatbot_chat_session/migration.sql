-- Create ChatRole enum
DO $$ BEGIN
  CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create ChatSession table
CREATE TABLE IF NOT EXISTS "ChatSession" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "title"     TEXT,
  "context"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- FK: ChatSession → User
ALTER TABLE "ChatSession"
  ADD CONSTRAINT "ChatSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indices
CREATE INDEX IF NOT EXISTS "ChatSession_userId_idx"     ON "ChatSession"("userId");
CREATE INDEX IF NOT EXISTS "ChatSession_createdAt_idx"  ON "ChatSession"("createdAt");

-- Create ChatMessage table
CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id"        TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role"      "ChatRole" NOT NULL,
  "content"   TEXT NOT NULL,
  "tokens"    INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- FK: ChatMessage → ChatSession
ALTER TABLE "ChatMessage"
  ADD CONSTRAINT "ChatMessage_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indices
CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_idx"  ON "ChatMessage"("sessionId");
CREATE INDEX IF NOT EXISTS "ChatMessage_createdAt_idx"  ON "ChatMessage"("createdAt");
