-- AlterEnum
-- Add new values to ToolCategory enum (before OTHER so display order matches schema)
ALTER TYPE "ToolCategory" ADD VALUE IF NOT EXISTS 'MS_OFFICE_WINDOWS_KEY' BEFORE 'OTHER';
ALTER TYPE "ToolCategory" ADD VALUE IF NOT EXISTS 'VPNS' BEFORE 'OTHER';
ALTER TYPE "ToolCategory" ADD VALUE IF NOT EXISTS 'SOFTWARES' BEFORE 'OTHER';
