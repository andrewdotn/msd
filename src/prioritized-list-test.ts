import { expect } from "chai";
import { PrioritizedList } from "./prioritized-list";

class TestNode {
  constructor(name: string) {
    this.name = name;
  }

  name: string;
  priority?: number;
}

describe("PrioritizedList", function () {
  it("can accept one elements", function () {
    const pl = new PrioritizedList<TestNode>();
    const a = new TestNode("a");
    pl.push(a);

    expect(pl.length).to.eql(1);
    expect(pl.get(0)).to.eql(a);
  });

  it("can accept multiple elements", function () {
    const pl = new PrioritizedList<TestNode>();
    for (const name of ["a", "b", "c"]) {
      pl.push(new TestNode(name));
    }

    expect(pl.length).to.eql(3);
    expect(pl.asArray().map((tn) => tn.name)).to.eql(["a", "b", "c"]);
    expect(pl.asArray().map((tn) => tn.priority)).to.eql([1, 2, 3]);
  });

  it("can insert an element at the beginning", function () {
    const pl = new PrioritizedList<TestNode>();
    const a = new TestNode("a");
    pl.insert(a, 0);
    expect(a.priority).to.eql(1);
    const b = new TestNode("b");
    pl.insert(b, 0);

    expect(b.priority).to.eql(0.5);
    expect(pl.get(0)).to.eql(b);
    expect(pl.get(1)).to.eql(a);
  });

  it("can insert an element in the middle", function () {
    const pl = new PrioritizedList<TestNode>();
    pl.push(new TestNode("a"));
    pl.push(new TestNode("b"));
    pl.insert(new TestNode("a1"), 1);

    expect(pl.asArray().map((tn) => tn.name)).to.eql(["a", "a1", "b"]);
    expect(pl.asArray().map((tn) => tn.priority)).to.eql([1, 1.5, 2]);
  });

  it("can move elements", function () {
    const pl = new PrioritizedList<TestNode>();
    pl.push(new TestNode("a"));
    pl.push(new TestNode("b"));
    pl.push(new TestNode("c"));

    pl.move(2, -2);
    expect(pl.asArray().map((tn) => tn.name)).to.eql(["c", "a", "b"]);
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
      const pl = new PrioritizedList<TestNode>();
      for (const e of initial) {
        pl.push(new TestNode(e));
      }

      pl.move(index, moveAmount);

      expect(pl.asArray().map((t) => t.name)).to.eql(expected);
    });
  }

  it("is iterable", function () {
    const testItems = ["a", "b", "c", "d", "e"];
    const pl = new PrioritizedList<TestNode>();
    for (const e of testItems) {
      pl.push(new TestNode(e));
    }

    expect(Array.from(pl).map((pe) => pe.name)).to.eql(testItems);
  });
});

type ReorderTest = [string[], number, number, string[]];
