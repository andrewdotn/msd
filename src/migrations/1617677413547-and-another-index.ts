import {MigrationInterface, QueryRunner} from "typeorm";

export class andAnotherIndex1617677413547 implements MigrationInterface {
    name = 'andAnotherIndex1617677413547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_a968d85d688c95c9c1249340fb" ON "task_link" ("parentTaskId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_a968d85d688c95c9c1249340fb"
        `);
    }

}
