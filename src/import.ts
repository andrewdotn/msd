import { getConnection } from "./db";
import { createReadStream } from "fs-extra";
import { createInterface } from "readline";
import yargs from "yargs";
import { ROOT_TASK, TaskNode } from "./task-node";
import { Task } from "./models/task";

const usage = `
$0 [options] IMPORT_FILE

Very dumb task import script: For every line in IMPORT_LINE, a new top-level
task is created.
`;

async function* linesFromFile(filename: string) {
  const inputStream = createReadStream(filename);

  const rl = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  yield* rl;
}

async function main() {
  const argv = yargs
    .strict()
    .demandCommand(1, 1)
    .usage(usage)
    .option("database", { type: "string" })
    .option("root-task-id", { type: "number" }).argv;
  await getConnection({ database: argv.database });

  let rootTask: Task = ROOT_TASK;
  if (argv.rootTaskId !== undefined) {
    rootTask = await Task.findOneOrFail({ id: argv.rootTaskId as number });
  }
  const tn0 = new TaskNode(rootTask);
  let count = 0;
  for await (const line of linesFromFile(argv._[0])) {
    count++;
    const tn = tn0.pushChild(new Task({ title: line }));
    await tn.save();
  }
  console.log(`Saved ${count} tasks.`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
