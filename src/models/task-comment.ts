import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Task } from "./task";

@Index(["taskId", "createdAt"])
@Entity()
export class TaskComment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne((type) => Task, { nullable: false })
  task?: Task;

  @Column()
  taskId?: number;

  @Column()
  text?: string;

  @Column()
  @CreateDateColumn()
  createdAt?: Date;
}
