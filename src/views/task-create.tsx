import React, { Fragment } from "react";
import { randomBytes } from "crypto";
import { Status, Task } from "../models/task";
import { ROOT_TASK } from "../task-node";

function randomId() {
  return randomBytes(12).toString("hex");
}

function initialTitle(s: string) {
  return s[0].toUpperCase() + s.substring(1);
}

function Input({
  name,
  value,
  errors,
}: {
  name: string;
  value: string;
  errors: string[];
}) {
  const id = randomId();

  return (
    <div className="form__control">
      <label className="form__label" htmlFor={id}>
        {initialTitle(name)}
      </label>
      {errors.map((s) => (
        <div className="form__field_error">{s}</div>
      ))}
      <input className="form__input" id={id} name={name} value={value}></input>
    </div>
  );
}

function Choice({
  name,
  value,
  options,
  errors,
}: {
  name: string;
  value: string;
  options: { name: string; value: string }[];
  errors: string[];
}) {
  const id = randomId();

  return (
    <div className="form__control">
      <label className="form__label" htmlFor={id}>
        {initialTitle(name)}
      </label>
      {errors.map((s) => (
        <div className="form__field_error">{s}</div>
      ))}
      <select name={name} defaultValue={value} id={id}>
        {options.map((o) => (
          <option value={o.value}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}

export function TaskCreate({
  task,
  fieldErrors,
  parentTask,
}: {
  task: Task;
  fieldErrors: Map<string, string[]>;
  parentTask?: Task;
}) {
  const statusOptions: { value: Status; name: string }[] = [];
  for (const c of Task.allStatuses) {
    statusOptions.push({ value: c, name: Task.verboseStatus(c) });
  }

  return (
    <Fragment>
      <h1>{task?.hasId() ? `Editing task ${task.id}` : "New Task"}</h1>
      <form method="POST">
        <div className="form">
          {task?.hasId() ? (
            <Choice
              name="status"
              value={task?.status ?? " "}
              options={statusOptions}
              errors={fieldErrors.get("status") ?? []}
            />
          ) : (
            ""
          )}
          {parentTask && parentTask.id !== ROOT_TASK.id ? (
            <>Parent: {parentTask.title} </>
          ) : null}
          <Input
            name="title"
            value={task?.title ?? ""}
            errors={fieldErrors.get("title") ?? []}
          />
          <Input
            name="estimate"
            value={task?.estimate()}
            errors={fieldErrors.get("estimate") ?? []}
          />
          <div className="form__control">
            <label className="form__label">Description</label>
            <textarea
              className="form__input"
              name="description"
              rows={10}
              defaultValue={task?.description}
            />
          </div>
          <div className="form__control">
            <button type="submit" className="form__submit">
              {task.hasId() ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </Fragment>
  );
}
