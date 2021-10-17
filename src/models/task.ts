import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { TaskLink } from "./task-link";
import { i } from "../i";
import { Duration } from "../duration";
import { TaskComment } from "./task-comment";

type TaskConstructorParams = Pick<Task, "id" | "title" | "status">;

export type Status = "x" | " " | "-" | "!";

@Entity()
export class Task extends BaseEntity {
  constructor(params?: TaskConstructorParams) {
    super();
    if (params) {
      let k: keyof TaskConstructorParams;
      for (k in params) {
        // @ts-ignore
        this[k] = params[k];
      }
    }
  }

  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  title?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: " " })
  // This should be a defined type, but typeorm gives a validation error
  status?: "x" | " " | "-" | "!";

  static readonly allStatuses: Status[] = ["x", " ", "-", "!"];

  static verboseStatus(status: Status) {
    switch (status) {
      case " ":
        return "To do";
      case "-":
        return "Cancelled";
      case "x":
        return "Done";
      case "!":
        return "Started";
      default:
        throw new Error(i`unknown status ${status}`);
    }
  }

  /**
   * How long is the task estimated to take?
   */
  @Column({ nullable: true })
  estimatedMinutes?: number | null;

  estimate() {
    if (this.estimatedMinutes == null) {
      return "";
    }
    return new Duration(this.estimatedMinutes).toString();
  }

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToMany((type) => TaskLink, (link) => link.parentTask)
  parentLinks?: TaskLink[];

  @OneToMany((type) => TaskLink, (link) => link.childTask)
  childLinks?: TaskLink[];

  @OneToMany((type) => TaskComment, (comment) => comment.task)
  comments?: TaskComment[];

  toggle() {
    if (this.status === "x") {
      this.status = " ";
    } else if (this.status === " " || this.status === "!") {
      this.status = "x";
    }
  }

  startTask() {
    if (this.status !== "!") {
      this.status = "!";
    }
  }

  isOpen(): boolean {
    return this.status === " " || this.status === "!";
  }

  displayString() {
    return `[${this.status}] ${this.id}◆ ${this.title}`;
  }

  toggleCancel() {
    if (this.status === " ") {
      this.status = "-";
    } else if (this.status === "-") {
      this.status = " ";
    }
  }
}
