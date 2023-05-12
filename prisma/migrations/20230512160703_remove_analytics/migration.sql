/*
  Warnings:

  - You are about to drop the `AnalyticsReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CommandReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CommandReport" DROP CONSTRAINT "CommandReport_analyticsReportMonth_fkey";

-- DropTable
DROP TABLE "AnalyticsReport";

-- DropTable
DROP TABLE "CommandReport";
