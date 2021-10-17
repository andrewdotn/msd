export type Environment = "production" | "test" | "dev";

export function environment(): Environment {
  if (process.env.NODE_ENV === "production") {
    return "production";
  } else if (process.env.NODE_ENV === "test") {
    return "test";
  } else {
    return "dev";
  }
}
