import { Task } from "./models/task";

export type TaskDetailInfoMap = Map<
  number,
  { hasComments: boolean; hasDescription: boolean }
>;

export async function loadTaskInfoMap(): Promise<TaskDetailInfoMap> {
  const tasksWithCommentsOrDescription = (await Task.query(`
      SELECT *
      FROM (
          SELECT id AS taskId,
              CASE
                  WHEN description IS NOT NULL
                      AND description != ''
                      THEN 1
                  ELSE 0
                  END AS hasDescription,
              EXISTS(SELECT * FROM task_comment WHERE taskid = task.id)
                      AS hasComments
          FROM task)
      WHERE hasComments
         OR hasDescription;
    `)) as {
    taskId: number;
    hasComments: "0" | "1" | 0 | 1;
    hasDescription: "0" | "1" | 0 | 1;
  }[];
  return new Map(
    tasksWithCommentsOrDescription.map((t) => [
      t.taskId,
      {
        hasComments: t.hasComments == "1",
        hasDescription: t.hasDescription == "1",
      },
    ])
  );
}
