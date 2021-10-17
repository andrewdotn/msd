import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from "typeorm";
import { Task } from "../models/task";
import { TaskHistory } from "../models/task-history";

@EventSubscriber()
export class TaskSubscriber implements EntitySubscriberInterface<Task> {
  listenTo() {
    return Task;
  }

  async beforeUpdate(event: UpdateEvent<Task>) {
    const taskHistory = new TaskHistory();
    taskHistory.task = event.entity;
    taskHistory.changes = JSON.stringify(
      TaskHistory.computeChanges(event.databaseEntity, event.entity)
    );
    await taskHistory.save();
  }
}
