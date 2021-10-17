import { ConnectionOptions } from "typeorm";
import { environment } from "./environment";
import { relative, resolve } from "path";

const extension = __filename.split(".").pop();

const env = environment();

function relPath(path: string) {
  const path1 = resolve(__dirname, path);
  return relative(process.cwd(), path1);
}

const config: ConnectionOptions = {
  type: "sqlite",
  database: `${env}.sqlite3`,
  entities: [relPath(`models/*.${extension}`)],
  logging: false,
  // goes to ormlogs.log, typeorm tries to put it near package.json, but likely
  // ends up one directory above.
  logger: "file",
  migrations: [relPath(`migrations/*.${extension}`)],
  subscribers: [relPath(`subscribers/*.${extension}`)],
  cli: {
    migrationsDir: relPath(`migrations`),
  },
};

module.exports = config;
