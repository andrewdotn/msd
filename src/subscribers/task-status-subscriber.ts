import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from "typeorm";
import { Task } from "../models/task";
import { TaskStatusHistory } from "../models/task-status-history";

@EventSubscriber()
export class TaskStatusSubscriber implements EntitySubscriberInterface<Task> {
  listenTo() {
    return Task;
  }

  async beforeUpdate(event: UpdateEvent<Task>) {
    const taskStatusHistory = new TaskStatusHistory();
    taskStatusHistory.task = event.entity;
    taskStatusHistory.status = event.databaseEntity.status;
    await taskStatusHistory.save();
  }
}
