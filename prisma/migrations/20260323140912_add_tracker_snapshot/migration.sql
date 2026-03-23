-- CreateTable
CREATE TABLE "TrackerSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tabState" JSONB NOT NULL,
    "taskState" JSONB NOT NULL,
    "migrationCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackerSnapshot_userId_key" ON "TrackerSnapshot"("userId");
