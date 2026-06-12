-- CreateTable
CREATE TABLE "UserSignature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signatureUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "data" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signatureUrl" TEXT NOT NULL,
    "relatedModel" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "documentHash" TEXT,
    "hmac" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentSignature_relatedModel_relatedId_idx" ON "DocumentSignature"("relatedModel", "relatedId");

-- AddForeignKey
ALTER TABLE "UserSignature" ADD CONSTRAINT "UserSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
