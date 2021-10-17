import {MigrationInterface, QueryRunner} from "typeorm";
import {SqliteCheckForeignKeysOperation} from "typeorm/driver/sqlite-abstract/SqliteCheckForeignKeysOperation";
import {SqliteDisableForeignKeysOperation} from "typeorm/driver/sqlite-abstract/SqliteDisableForeignKeysOperation";

export class addTaskDescription1617589711387 implements MigrationInterface {
    name = 'addTaskDescription1617589711387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await new SqliteDisableForeignKeysOperation().execute(queryRunner);
        await queryRunner.query(`
            CREATE TABLE "temporary_task" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "title" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT (' '),
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "description" varchar
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_task"(
                    "id",
                    "title",
                    "status",
                    "createdAt",
                    "updatedAt"
                )
            SELECT "id",
                "title",
                "status",
                "createdAt",
                "updatedAt"
            FROM "task"
        `);
        await queryRunner.query(`
            DROP TABLE "task"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_task"
                RENAME TO "task"
        `);
        await new SqliteCheckForeignKeysOperation().execute(queryRunner);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await new SqliteDisableForeignKeysOperation().execute(queryRunner);
        await queryRunner.query(`
            CREATE TABLE "temporary_task" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "title" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT (' '),
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_task"(
                    "id",
                    "title",
                    "status",
                    "createdAt",
                    "updatedAt"
                )
            SELECT "id",
                "title",
                "status",
                "createdAt",
                "updatedAt"
            FROM "task"
        `);
        await queryRunner.query(`
            DROP TABLE "task"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_task"
                RENAME TO "task"
        `);
        await new SqliteCheckForeignKeysOperation().execute(queryRunner);

    }

}
