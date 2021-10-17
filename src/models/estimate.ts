import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Task } from "./task";

@Entity()
export class TaskEstimate extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  durationInMinutes?: number;

  @ManyToOne((type) => Task, { nullable: false })
  task?: Task;

  @Column({ nullable: false })
  taskId?: number;

  @Column()
  estimateTime?: Date;
}
