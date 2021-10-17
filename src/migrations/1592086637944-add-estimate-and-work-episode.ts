import {MigrationInterface, QueryRunner} from "typeorm";

export class addEstimate1592086637944 implements MigrationInterface {
    name = 'addEstimate1592086637944'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "task_estimate" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "durationInMinutes" integer NOT NULL, "taskId" integer NOT NULL, "estimateTime" datetime NOT NULL, CONSTRAINT "FK_74903e3ecb8c40db05bb1c379c9" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "task_estimate"`, undefined);
    }

}
