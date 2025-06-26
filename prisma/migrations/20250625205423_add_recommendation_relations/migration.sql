-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('view', 'like', 'purchase');

-- CreateTable
CREATE TABLE "UserProductInteraction" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "type" "InteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProductInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSimilarity" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "similar_product_id" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProductSimilarity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserProductInteraction_user_id_idx" ON "UserProductInteraction"("user_id");

-- CreateIndex
CREATE INDEX "UserProductInteraction_product_id_idx" ON "UserProductInteraction"("product_id");

-- CreateIndex
CREATE INDEX "ProductSimilarity_product_id_idx" ON "ProductSimilarity"("product_id");

-- CreateIndex
CREATE INDEX "ProductSimilarity_similar_product_id_idx" ON "ProductSimilarity"("similar_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSimilarity_product_id_similar_product_id_key" ON "ProductSimilarity"("product_id", "similar_product_id");

-- AddForeignKey
ALTER TABLE "UserProductInteraction" ADD CONSTRAINT "UserProductInteraction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProductInteraction" ADD CONSTRAINT "UserProductInteraction_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSimilarity" ADD CONSTRAINT "ProductSimilarity_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSimilarity" ADD CONSTRAINT "ProductSimilarity_similar_product_id_fkey" FOREIGN KEY ("similar_product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
