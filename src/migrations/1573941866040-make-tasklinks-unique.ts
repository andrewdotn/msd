import { MigrationInterface, QueryRunner } from "typeorm";

export class makeTasklinksUnique1573941866040 implements MigrationInterface {
  name = "makeTasklinksUnique1573941866040";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0d4eff35d8b854e2303e24240c" ON "task_link" ("childTaskId", "parentTaskId") `,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `DROP INDEX "IDX_0d4eff35d8b854e2303e24240c"`,
      undefined
    );
  }
}
