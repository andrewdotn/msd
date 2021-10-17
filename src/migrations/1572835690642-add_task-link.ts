import { MigrationInterface, QueryRunner } from "typeorm";

export class addTaskLink1572835690642 implements MigrationInterface {
  name = "addTaskLink1572835690642";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "task_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "priority" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "parentTaskId" integer NOT NULL, "childTaskId" integer NOT NULL)`,
      undefined
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_task" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "status" varchar NOT NULL DEFAULT (' '), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "temporary_task"("id", "title", "status", "createdAt", "updatedAt") SELECT "id", "title", "status", "createdAt", "updatedAt" FROM "task"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "task"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "temporary_task" RENAME TO "task"`,
      undefined
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_task_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "priority" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "parentTaskId" integer NOT NULL, "childTaskId" integer NOT NULL, CONSTRAINT "FK_a968d85d688c95c9c1249340fba" FOREIGN KEY ("parentTaskId") REFERENCES "task" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_5c2cead2ff02b7cf77d8af61be8" FOREIGN KEY ("childTaskId") REFERENCES "task" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "temporary_task_link"("id", "priority", "createdAt", "updatedAt", "parentTaskId", "childTaskId") SELECT "id", "priority", "createdAt", "updatedAt", "parentTaskId", "childTaskId" FROM "task_link"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "task_link"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "temporary_task_link" RENAME TO "task_link"`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "task_link" RENAME TO "temporary_task_link"`,
      undefined
    );
    await queryRunner.query(
      `CREATE TABLE "task_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "priority" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "parentTaskId" integer NOT NULL, "childTaskId" integer NOT NULL)`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "task_link"("id", "priority", "createdAt", "updatedAt", "parentTaskId", "childTaskId") SELECT "id", "priority", "createdAt", "updatedAt", "parentTaskId", "childTaskId" FROM "temporary_task_link"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "temporary_task_link"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "task" RENAME TO "temporary_task"`,
      undefined
    );
    await queryRunner.query(
      `CREATE TABLE "task" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "status" varchar NOT NULL DEFAULT (' '), "priority" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "task"("id", "title", "status", "createdAt", "updatedAt") SELECT "id", "title", "status", "createdAt", "updatedAt" FROM "temporary_task"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "temporary_task"`, undefined);
    await queryRunner.query(`DROP TABLE "task_link"`, undefined);
  }
}
