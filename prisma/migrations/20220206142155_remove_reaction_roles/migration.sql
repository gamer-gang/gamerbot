/*
  Warnings:

  - You are about to drop the `ReactionRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReactionRoleMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReactionRole" DROP CONSTRAINT "ReactionRole_messageId_fkey";

-- DropForeignKey
ALTER TABLE "ReactionRoleMessage" DROP CONSTRAINT "ReactionRoleMessage_guildId_fkey";

-- DropTable
DROP TABLE "ReactionRole";

-- DropTable
DROP TABLE "ReactionRoleMessage";
