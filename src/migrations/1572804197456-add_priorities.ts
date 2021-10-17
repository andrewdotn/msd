import { MigrationInterface, QueryRunner } from "typeorm";

export class addPriorities1572804197456 implements MigrationInterface {
  name = "addPriorities1572804197456";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "temporary_task" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "status" varchar NOT NULL, "priority" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "temporary_task"("id", "title", "status") SELECT "id", "title", "status" FROM "task"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "task"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "temporary_task" RENAME TO "task"`,
      undefined
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_task" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "status" varchar NOT NULL DEFAULT (' '), "priority" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "temporary_task"("id", "title", "status", "priority", "createdAt", "updatedAt") SELECT "id", "title", "status", "priority", "createdAt", "updatedAt" FROM "task"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "task"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "temporary_task" RENAME TO "task"`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "task" RENAME TO "temporary_task"`,
      undefined
    );
    await queryRunner.query(
      `CREATE TABLE "task" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "status" varchar NOT NULL, "priority" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "task"("id", "title", "status", "priority", "createdAt", "updatedAt") SELECT "id", "title", "status", "priority", "createdAt", "updatedAt" FROM "temporary_task"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "temporary_task"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "task" RENAME TO "temporary_task"`,
      undefined
    );
    await queryRunner.query(
      `CREATE TABLE "task" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "status" varchar NOT NULL)`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "task"("id", "title", "status") SELECT "id", "title", "status" FROM "temporary_task"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "temporary_task"`, undefined);
  }
}
