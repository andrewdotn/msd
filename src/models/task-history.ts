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

export interface TaskHistoryChangeItem {
  fieldName: string & keyof Task;
  before: string;
  after: string;
}

export type TaskHistoryChange = TaskHistoryChangeItem[];

@Index(["taskId", "changeTime"])
@Entity()
export class TaskHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne((type) => Task, { nullable: false })
  task?: Task;

  @Column()
  taskId?: number;

  /**
   * This is really JSON
   */
  @Column()
  changes?: string;

  @Column()
  @CreateDateColumn()
  changeTime?: Date;

  getChanges(): TaskHistoryChange | null {
    if (!this.changes) {
      return null;
    }
    const list = JSON.parse(this.changes);
    if (!list || list.length === 0) {
      return null;
    }

    const ret = [];

    function hasNonEmptyBeforeOrAfter(i: TaskHistoryChangeItem) {
      return (
        (i.before != null && i.before !== "") ||
        (i.after != null && i.after !== "")
      );
    }

    for (const e of list) {
      const h = e as TaskHistoryChangeItem;
      // could also potentially skip saving these in the first place?
      if (hasNonEmptyBeforeOrAfter(h)) {
        ret.push(e);
      }
    }
    if (ret.length > 0) {
      return ret;
    }
    return null;
  }

  static computeChanges(
    existingTask: Task,
    updatedTask: Task
  ): TaskHistoryChange {
    const changes: TaskHistoryChange = [];
    for (const fieldName of [
      "title",
      "description",
      "status",
      "estimatedMinutes",
    ] as (keyof Task)[]) {
      const before = JSON.stringify(existingTask[fieldName]);
      const after = JSON.stringify(updatedTask[fieldName]);
      if (before !== after) {
        changes.push({ fieldName, before, after });
      }
    }
    return changes;
  }
}
