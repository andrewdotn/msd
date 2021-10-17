import {MigrationInterface, QueryRunner} from "typeorm";

export class addTaskCommentTable1617658734733 implements MigrationInterface {
    name = 'addTaskCommentTable1617658734733'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "task_comment" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "taskId" integer NOT NULL,
                "text" varchar NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "task_comment"
        `);
    }

}
