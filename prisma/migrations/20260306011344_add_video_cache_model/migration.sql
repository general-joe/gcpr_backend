-- CreateTable
CREATE TABLE "VideoCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoSubCategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YouTubeVideo" (
    "id" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubeUrl" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "duration" INTEGER,
    "thumbnailUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YouTubeVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "cachedData" JSONB NOT NULL,
    "pageInfo" JSONB,
    "lastFetch" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ttl" INTEGER NOT NULL DEFAULT 3600,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoCategory_name_key" ON "VideoCategory"("name");

-- CreateIndex
CREATE INDEX "VideoSubCategory_categoryId_idx" ON "VideoSubCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoSubCategory_categoryId_name_key" ON "VideoSubCategory"("categoryId", "name");

-- CreateIndex
CREATE INDEX "YouTubeVideo_subCategoryId_idx" ON "YouTubeVideo"("subCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoCache_cacheKey_key" ON "VideoCache"("cacheKey");

-- AddForeignKey
ALTER TABLE "VideoSubCategory" ADD CONSTRAINT "VideoSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VideoCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouTubeVideo" ADD CONSTRAINT "YouTubeVideo_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "VideoSubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
