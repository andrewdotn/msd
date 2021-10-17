import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Task } from "./task";

@Entity()
export class TaskStatusHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne((type) => Task, { nullable: false })
  task?: Task;

  @Column()
  taskId?: number;

  @Column()
  status?: "x" | " " | "-" | "!";

  @CreateDateColumn()
  endTime?: Date;
}
