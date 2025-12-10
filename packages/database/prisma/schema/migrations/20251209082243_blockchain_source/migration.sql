/*
  Warnings:

  - You are about to drop the `tbl_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_activities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_activity_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_activity_managers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_daily_monitoring` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_phases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_sources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_sources_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_stats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_trigger_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_triggers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tbl_activities" DROP CONSTRAINT "tbl_activities_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "tbl_activities" DROP CONSTRAINT "tbl_activities_managerId_fkey";

-- DropForeignKey
ALTER TABLE "tbl_activities" DROP CONSTRAINT "tbl_activities_phaseId_fkey";

-- DropForeignKey
ALTER TABLE "tbl_daily_monitoring" DROP CONSTRAINT "tbl_daily_monitoring_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "tbl_phases" DROP CONSTRAINT "tbl_phases_riverBasin_fkey";

-- DropForeignKey
ALTER TABLE "tbl_sources_data" DROP CONSTRAINT "tbl_sources_data_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "tbl_trigger_history" DROP CONSTRAINT "tbl_trigger_history_phaseId_fkey";

-- DropForeignKey
ALTER TABLE "tbl_triggers" DROP CONSTRAINT "tbl_triggers_phaseId_fkey";

-- DropTable
DROP TABLE "mock"."tbl_settings";

-- DropTable
DROP TABLE "tbl_activities";

-- DropTable
DROP TABLE "tbl_activity_categories";

-- DropTable
DROP TABLE "tbl_activity_managers";

-- DropTable
DROP TABLE "tbl_applications";

-- DropTable
DROP TABLE "tbl_daily_monitoring";

-- DropTable
DROP TABLE "tbl_phases";

-- DropTable
DROP TABLE "tbl_settings";

-- DropTable
DROP TABLE "tbl_sources";

-- DropTable
DROP TABLE "tbl_sources_data";

-- DropTable
DROP TABLE "tbl_stats";

-- DropTable
DROP TABLE "tbl_trigger_history";

-- DropTable
DROP TABLE "tbl_triggers";

-- DropEnum
DROP TYPE "mock"."MockSettingDataType";

-- DropEnum
DROP TYPE "ActivityStatus";

-- DropEnum
DROP TYPE "ApplicationEnvironment";

-- DropEnum
DROP TYPE "DataSource";

-- DropEnum
DROP TYPE "Phases";

-- DropEnum
DROP TYPE "SettingDataType";

-- DropEnum
DROP TYPE "SourceType";
