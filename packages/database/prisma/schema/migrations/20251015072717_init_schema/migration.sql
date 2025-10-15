-- CreateEnum
CREATE TYPE "Phases" AS ENUM ('PREPAREDNESS', 'READINESS', 'ACTIVATION');

-- CreateEnum
CREATE TYPE "SettingDataType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'OBJECT');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('RAINFALL', 'WATER_LEVEL');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('DHM', 'GLOFAS', 'MANUAL', 'DAILY_MONITORING', 'GFH');

-- CreateTable
CREATE TABLE "tbl_phases" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" "Phases" NOT NULL,
    "activeYear" TEXT NOT NULL,
    "requiredMandatoryTriggers" INTEGER DEFAULT 0,
    "requiredOptionalTriggers" INTEGER DEFAULT 0,
    "receivedMandatoryTriggers" INTEGER DEFAULT 0,
    "receivedOptionalTriggers" INTEGER DEFAULT 0,
    "canRevert" BOOLEAN NOT NULL DEFAULT false,
    "canTriggerPayout" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "riverBasin" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_triggers" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "repeatKey" TEXT NOT NULL,
    "repeatEvery" TEXT,
    "triggerStatement" JSONB,
    "triggerDocuments" JSONB,
    "notes" TEXT,
    "title" TEXT,
    "description" TEXT,
    "phaseId" TEXT,
    "source" "DataSource",
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isDailyMonitored" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "triggeredBy" TEXT,
    "transactionHash" TEXT,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_settings" (
    "name" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "dataType" "SettingDataType" NOT NULL,
    "requiredFields" TEXT[],
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tbl_settings_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "tbl_sources" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "source" "DataSource"[],
    "riverBasin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_sources_data" (
    "id" SERIAL NOT NULL,
    "type" "SourceType" NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "dataSource" "DataSource",
    "info" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_sources_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_phases_uuid_key" ON "tbl_phases"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_phases_riverBasin_activeYear_name_key" ON "tbl_phases"("riverBasin", "activeYear", "name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_triggers_uuid_key" ON "tbl_triggers"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_triggers_repeatKey_key" ON "tbl_triggers"("repeatKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_settings_name_key" ON "tbl_settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_sources_uuid_key" ON "tbl_sources"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_sources_riverBasin_key" ON "tbl_sources"("riverBasin");

-- AddForeignKey
ALTER TABLE "tbl_phases" ADD CONSTRAINT "tbl_phases_riverBasin_fkey" FOREIGN KEY ("riverBasin") REFERENCES "tbl_sources"("riverBasin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_triggers" ADD CONSTRAINT "tbl_triggers_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "tbl_phases"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_sources_data" ADD CONSTRAINT "tbl_sources_data_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "tbl_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
