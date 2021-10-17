import { resolve as pathResolve } from "path";
import { ConnectionOptionsReader, createConnection } from "typeorm";

export async function getConnection({ database }: { database?: string } = {}) {
  const root = pathResolve(__dirname, "..");
  const dbOptions = await new ConnectionOptionsReader({ root }).get("default");
  if (database !== undefined) {
    // @ts-ignore

  }
  const connection = await createConnection(dbOptions);
  return connection;
}
