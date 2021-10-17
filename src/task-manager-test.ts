import chai, { Assertion, expect } from "chai";
import { TaskManager } from "./task-manager";
import { inspect } from "util";

chai.use((chai, utils) => {
  utils.addProperty(
    chai.Assertion.prototype,
    "strictlyOrdered",
    function (this: typeof Assertion) {
      const obj = utils.flag(this, "object");
      let failMessage = "";
      for (let i = 0; i < obj.length - 1; i++) {
        if (!(obj[i] < obj[i + 1])) {
          failMessage = `Not strictly ordered: element ${i} is less or equal to element ${
            i + 1
          }: ${inspect(obj[i])} >= ${inspect(obj[i + 1])}`;
          break;
        }
      }
      this.assert(
        failMessage === "",
        failMessage,
        "is strictly ordered",
        "strictly ordered"
      );
    }
  );
});

describe("TaskManager", function () {
  it("can create a new task with some priority", function () {
    const tm = new TaskManager();
    const t = tm.createTaskNode();
    expect(t.priority).not.to.eql(undefined);
  });

  it("can create tasks with different priorities", function () {
    const tm = new TaskManager();
    const t1 = tm.createTaskNode();
    const t2 = tm.createTaskNode();
    expect(t1.priority).to.be.lessThan(t2.priority!);
  });

  it("can create tasks with intermediate priorities", function () {
    const tm = new TaskManager();
    const t1 = tm.createTaskNode();
    const t2 = tm.createTaskNode();
    const t3 = tm.createTaskNode({ after: t1 });
    expect([t1.priority, t3.priority, t2.priority]).to.be.strictlyOrdered;
  });
});
