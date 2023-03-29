-- CreateEnum
CREATE TYPE "TODPlayerOrder" AS ENUM ('Random', 'OldestFirst', 'YoungestFirst', 'Manual');

-- CreateEnum
CREATE TYPE "TODGameMode" AS ENUM ('Normal', 'TruthOnly', 'DareOnly');

-- CreateTable
CREATE TABLE "TruthOrDareConfig" (
    "guildId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "autoRole" BOOLEAN NOT NULL,
    "autoPin" BOOLEAN NOT NULL,
    "askTimeout" INTEGER NOT NULL,
    "respondTimeout" INTEGER NOT NULL,
    "prepareTimeout" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "rounds" INTEGER NOT NULL,
    "playerOrder" "TODPlayerOrder" NOT NULL,
    "gameMode" "TODGameMode" NOT NULL,

    CONSTRAINT "TruthOrDareConfig_pkey" PRIMARY KEY ("guildId")
);
