/*
  Warnings:

  - Added the required column `createdById` to the `Form` table without a default value. This is not possible if the table is not empty.

*/

-- First, let's ensure we have at least one user to assign as creator
INSERT OR IGNORE INTO "User" (id, email, name, password, role)
VALUES ('default-admin', 'admin@example.com', 'Default Admin', '$2a$10$default', 'ADMIN');

-- CreateTable
CREATE TABLE "FormResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormResponse_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Form" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "fields" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL DEFAULT 'default-admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Form_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Form_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Form" ("createdAt", "description", "factoryId", "fields", "id", "name", "type", "updatedAt") 
SELECT "createdAt", "description", "factoryId", "fields", "id", "name", "type", "updatedAt" FROM "Form";
DROP TABLE "Form";
ALTER TABLE "new_Form" RENAME TO "Form";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
