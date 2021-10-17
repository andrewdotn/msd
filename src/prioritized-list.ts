import { assertNotFalseNullOrUndefined, AssertionError } from "./assert";

interface Prioritized {
  priority?: number;
}

/**
 * A list of objects sorted by priority. There is an API allowing consumers to
 * do normal integer indexing, but objects internally have a floating-point
 * priority field managed by this class. List mutations update the priority
 * field, allowing more efficient database-backed lists where most insert/move
 * operations only change the priority of a single element.
 *
 * Other classes should never touch the priority field, but it’s not
 * encapsulated here because it’s most likely a property of an ActiveRecord
 * instance.
 */
export class PrioritizedList<T extends Prioritized> {
  get(index: number) {
    return this._list[index];
  }

  indexOf(t: T) {
    const ret = this._list.indexOf(t);
    assertNotFalseNullOrUndefined(ret >= 0, "indexOf on element not in list");
    return ret;
  }

  /** Add to end of list, setting priority */
  push(element: T) {
    this.insert(element, this.length);
  }

  /** Insert at position, setting priority. */
  insert(element: T, index: number) {
    let priority: number;
    if (this.isEmpty()) {
      priority = 1;
    } else if (index == 0) {
      assertNotFalseNullOrUndefined(
        this._list[0].priority,
        "first element has undefined priority"
      );
      priority = this._list[0].priority / 2;
    } else if (index == this.length) {
      priority = this._priority(this.length - 1) + 1;
    } else if (index < 0 || index > this.length) {
      throw new AssertionError({
        message: "tried to insert beyond end of list",
      });
    } else {
      priority = (this._priority(index - 1) + this._priority(index)) / 2;
    }
    element.priority = priority;
    this._list.splice(index, 0, element);
  }

  /** Helper function that asserts priority is defined */
  private _priority(index: number): number {
    const priority = this._list[index].priority;
    assertNotFalseNullOrUndefined(
      priority,
      `undefined priority at index ${index}`
    );
    return priority;
  }

  move(fromIndex: number, steps: number) {
    const initialLength = this.length;
    const t = this.delete(fromIndex);
    let newIndex = fromIndex + steps;

    if (newIndex < 0) {
      newIndex = 0;
    }
    if (newIndex >= initialLength) {
      newIndex = initialLength - 1;
    }

    this.insert(t, newIndex);
  }

  delete(index: number) {
    const [t] = this._list.splice(index, 1);
    return t;
  }

  get length() {
    return this._list.length;
  }

  lastElement() {
    return this._list[this.length - 1];
  }

  isEmpty() {
    return this.length === 0;
  }

  asArray() {
    return this._list.slice();
  }

  [Symbol.iterator]() {
    return this._list[Symbol.iterator]();
  }

  private _list: T[] = [];
}
