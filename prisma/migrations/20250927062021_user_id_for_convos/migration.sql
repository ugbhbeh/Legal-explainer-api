/*
  Warnings:

  - Made the column `userId` on table `Conversation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Conversation" DROP CONSTRAINT "Conversation_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Conversation" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
