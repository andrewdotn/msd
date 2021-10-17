import { getConnection } from "./db";
import yargs from "yargs";
import { assertNotFalseNullOrUndefined } from "./assert";
import { TaskLink } from "./models/task-link";
import { Task } from "./models/task";
import { saferParseFloat } from "./util/safer-parse-int";

const usage = `
$0 [options] PARENT_ID CHILD_ID [PRIORITY]

Create a new task link.
`;

async function main() {
  const argv = yargs
    .strict()
    .demandCommand(2, 3)
    .usage(usage)
    .option("database", { type: "string" }).argv;
  await getConnection({ database: argv.database });

  assertNotFalseNullOrUndefined(typeof argv._[0] === "number", "not a number");
  assertNotFalseNullOrUndefined(typeof argv._[1] === "number", "not a number");
  const parentId = argv._[0];
  const childId = argv._[1];

  let priority = 1;
  if (argv._[2] !== undefined) {
    priority = saferParseFloat(argv._[2]);
  }

  const t0 = await Task.findOneOrFail(parentId);
  const t1 = await Task.findOneOrFail(childId);

  const tl = new TaskLink();
  tl.parentTaskId = t0.id;
  tl.childTaskId = t1.id;
  tl.priority = priority;
  await tl.save();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
