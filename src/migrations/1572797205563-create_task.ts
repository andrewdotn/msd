import { MigrationInterface, QueryRunner } from "typeorm";

export class createTask1572797205563 implements MigrationInterface {
  name = "createTask1572797205563";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "task" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "status" varchar NOT NULL)`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE "task"`, undefined);
  }
}
