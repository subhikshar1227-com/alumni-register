-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FoodPreference" AS ENUM ('VEG', 'NON_VEG');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('NOT_APPLICABLE', 'NOT_GENERATED', 'GENERATED', 'SENT');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('REGISTRATION_ACKNOWLEDGEMENT', 'MEMBERSHIP_CARD', 'ENTRY_PASS', 'REJECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "AlumniRegistration" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "batchYear" INTEGER NOT NULL,
    "branch" TEXT NOT NULL,
    "usn" TEXT,
    "photoUrl" TEXT,
    "photoPath" TEXT,
    "attending" BOOLEAN NOT NULL,
    "peopleCount" INTEGER,
    "food" "FoodPreference",
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT,
    "awards" TEXT,
    "experience" TEXT,
    "linkedinUrl" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "membershipStatus" "DocumentStatus" NOT NULL DEFAULT 'NOT_GENERATED',
    "membershipCardPath" TEXT,
    "entryPassStatus" "DocumentStatus" NOT NULL DEFAULT 'NOT_GENERATED',
    "entryPassPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlumniRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniIdCounter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AlumniIdCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "emailType" "EmailType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailLogStatus" NOT NULL,
    "failureReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlumniRegistration_alumniId_key" ON "AlumniRegistration"("alumniId");

-- CreateIndex
CREATE INDEX "AlumniRegistration_email_idx" ON "AlumniRegistration"("email");

-- CreateIndex
CREATE INDEX "AlumniRegistration_phone_idx" ON "AlumniRegistration"("phone");

-- CreateIndex
CREATE INDEX "AlumniRegistration_status_idx" ON "AlumniRegistration"("status");

-- CreateIndex
CREATE INDEX "AlumniRegistration_createdAt_idx" ON "AlumniRegistration"("createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_registrationId_idx" ON "EmailLog"("registrationId");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "AlumniRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
