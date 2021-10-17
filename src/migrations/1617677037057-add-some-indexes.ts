import {MigrationInterface, QueryRunner} from "typeorm";

export class addSomeIndexes1617677037057 implements MigrationInterface {
    name = 'addSomeIndexes1617677037057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_e24c8295492e756188cc913f35" ON "task_comment" ("taskId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f78a909ca6df213ca1a1ab265b" ON "task_history" ("taskId", "changeTime")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_f78a909ca6df213ca1a1ab265b"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e24c8295492e756188cc913f35"
        `);
    }

}
