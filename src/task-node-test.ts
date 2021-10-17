import { expect } from "chai";
import { Task } from "./models/task";
import { TaskLink } from "./models/task-link";
import { ParentedTaskNode, ROOT_TASK, TaskNode } from "./task-node";

type ReorderTest = [string[], number, number, string[]];

describe("TaskNode", function () {
  it("can assemble a basic graph", function () {
    const t1 = new Task();
    t1.id = 1;
    const t2 = new Task();
    t2.id = 2;
    const t3 = new Task();
    t3.id = 3;

    const l1 = new TaskLink();
    l1.parentTaskId = ROOT_TASK.id;
    l1.childTaskId = t1.id;
    l1.priority = 1;

    const l2 = new TaskLink();
    l2.parentTaskId = t1.id;
    l2.childTaskId = t2.id;
    l2.priority = 1.5;

    const l3 = new TaskLink();
    l3.parentTaskId = ROOT_TASK.id;
    l3.childTaskId = t3.id;
    l3.priority = 2.3;

    const tree = TaskNode.assemble([t1, t2, t3], [l1, l2, l3]);

    const tn1 = tree.findChild(t1);
    expect(tn1?.task).to.eql(t1);
    expect(tn1?.copyOfChildren[0]?.task).to.eql(t2);
    const tn2 = tree.findChild(t2);
    expect(tn2?.parent).to.eql(tn1);
    expect(tn2?.priority).to.eql(1.5);
  });

  it("can traverse copyOfChildren", function () {
    const tn0 = new TaskNode(ROOT_TASK);
    const tna = tn0.pushChild(new Task({ title: "a" }));
    const tnb = tn0.pushChild(new Task({ title: "b" }));
    const tna1 = tna.pushChild(new Task({ title: "a1" }));

    expect(Array.from(tn0.allChildren())).to.eql([tna, tna1, tnb]);
  });

  describe("movement", function () {
    it("can move a task up", function () {
      const tn0 = new TaskNode(ROOT_TASK);
      const t1 = tn0.pushChild(new Task({ title: "1" }));
      const t2 = tn0.pushChild(new Task({ title: "2" }));
      const t3 = tn0.pushChild(new Task({ title: "3" }));
      expect([t1.priority, t2.priority, t3.priority]).to.be.strictlyOrdered;
      t3.move(-1);
      expect([t1.priority, t3.priority, t2.priority]).to.be.strictlyOrdered;
    });

    const reorderTests: ReorderTest[] = [
      [["a", "b", "c"], 0, 1, ["b", "a", "c"]],
      [["a", "b", "c"], 1, 1, ["a", "c", "b"]],
      [["a", "b", "c"], 0, 2, ["b", "c", "a"]],
      [["a", "b", "c"], 1, 0, ["a", "b", "c"]],
      [["a", "b", "c"], 1, -1, ["b", "a", "c"]],
      [["a", "b", "c"], 2, -1, ["a", "c", "b"]],
      [["a", "b", "c"], 2, -2, ["c", "a", "b"]],
    ];
    for (const test of reorderTests) {
      const [initial, index, moveAmount, expected] = test;
      it(`Can move element ${index} of ${initial} ${moveAmount} units to get ${expected}`, function () {
        const tm = new TaskNode(ROOT_TASK);
        const tasks: ParentedTaskNode[] = [];
        for (let i of initial) {
          const t = tm.pushChild(new Task({ title: i }));
          tasks.push(t);
        }

        tasks[index].move(moveAmount);

        expect(tm.copyOfChildren.map((t) => t.title)).to.eql(expected);
      });
    }

    it("can move up into the previous task", function () {
      this.skip();
    });
  });

  describe("levels", function () {
    it("can increase depth", function () {
      const tn0 = new TaskNode(ROOT_TASK);
      const t1 = tn0.pushChild(new Task({ title: "1" }));
      const t2 = tn0.pushChild(new Task({ title: "2" }));
      t2.increaseDepth();
      expect(t2.parent).to.eql(t1);
      expect(t2.parentLink.parentTask).to.eql(t1.task);
      expect(t2.parent?.parent?.task.id).to.eql(ROOT_TASK.id);
    });

    it("can decrease depth", function () {
      const tn0 = new TaskNode(ROOT_TASK);
      const t1 = tn0.pushChild(new Task({ title: "1" }));
      const t2 = t1.pushChild(new Task({ title: "2" }));
      expect(t2.parent).to.eql(t1);
      t2.decreaseDepth();
      expect(t2.parent).to.eql(t1.parent);
      expect(t2.parentLink.parentTask).to.eql(t1.parentLink.parentTask);
    });
  });
});
