import { MigrationInterface, QueryRunner } from "typeorm";

export class addTaskStatusHistory1573332996184 implements MigrationInterface {
  name = "addTaskStatusHistory1573332996184";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "task_status_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "taskId" integer NOT NULL, "status" varchar NOT NULL, "endTime" datetime NOT NULL DEFAULT (datetime('now')))`,
      undefined
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_task_status_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "taskId" integer NOT NULL, "status" varchar NOT NULL, "endTime" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_51198f2d2ac614940d606cc4b9e" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "temporary_task_status_history"("id", "taskId", "status", "endTime") SELECT "id", "taskId", "status", "endTime" FROM "task_status_history"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "task_status_history"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "temporary_task_status_history" RENAME TO "task_status_history"`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "task_status_history" RENAME TO "temporary_task_status_history"`,
      undefined
    );
    await queryRunner.query(
      `CREATE TABLE "task_status_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "taskId" integer NOT NULL, "status" varchar NOT NULL, "endTime" datetime NOT NULL DEFAULT (datetime('now')))`,
      undefined
    );
    await queryRunner.query(
      `INSERT INTO "task_status_history"("id", "taskId", "status", "endTime") SELECT "id", "taskId", "status", "endTime" FROM "temporary_task_status_history"`,
      undefined
    );
    await queryRunner.query(
      `DROP TABLE "temporary_task_status_history"`,
      undefined
    );
    await queryRunner.query(`DROP TABLE "task_status_history"`, undefined);
  }
}
