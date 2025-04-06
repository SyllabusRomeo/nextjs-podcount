/*
  Warnings:

  - A unique constraint covering the columns `[name,factoryId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Form_name_factoryId_key" ON "Form"("name", "factoryId");
