import {MigrationInterface, QueryRunner} from "typeorm";

export class addTaskHistory1617639575928 implements MigrationInterface {
    name = 'addTaskHistory1617639575928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "task_history" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "taskId" integer NOT NULL,
                "changes" varchar NOT NULL,
                "changeTime" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "task_history"
        `);
    }

}
