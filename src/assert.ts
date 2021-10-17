import assertModule from "assert";

const ok: (value: any, message?: string | Error) => asserts value =
  assertModule.strict.ok;

export const AssertionError = assertModule.AssertionError;

export function assertNotFalseNullOrUndefined(
  condition: unknown,
  message: string,
  diagnoser?: () => void
): asserts condition {
  const assertion =
    condition !== undefined && condition !== null && condition !== false;
  if (diagnoser && !assertion) {
    diagnoser();
  }
  ok(assertion, message);
}
