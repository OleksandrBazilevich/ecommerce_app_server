/*
  Warnings:

  - You are about to drop the `ProductView` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductView" DROP CONSTRAINT "ProductView_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductView" DROP CONSTRAINT "ProductView_userId_fkey";

-- DropTable
DROP TABLE "ProductView";
