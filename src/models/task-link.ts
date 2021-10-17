import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Task } from "./task";

@Entity()
@Index(["childTaskId", "parentTaskId"], { unique: true })
export class TaskLink extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne((type) => Task, (task) => task.parentLinks, { nullable: false })
  parentTask?: Task;

  @Index()
  @Column()
  parentTaskId?: number;

  @ManyToOne((type) => Task, (task) => task.childLinks, { nullable: false })
  childTask?: Task;

  @Column()
  childTaskId?: number;

  @Column()
  priority?: number;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
