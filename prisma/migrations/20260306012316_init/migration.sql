/*
  Warnings:

  - You are about to drop the `VideoCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VideoSubCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `YouTubeVideo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VideoSubCategory" DROP CONSTRAINT "VideoSubCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "YouTubeVideo" DROP CONSTRAINT "YouTubeVideo_subCategoryId_fkey";

-- DropTable
DROP TABLE "VideoCategory";

-- DropTable
DROP TABLE "VideoSubCategory";

-- DropTable
DROP TABLE "YouTubeVideo";
