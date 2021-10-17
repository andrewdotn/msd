// An attempt to deal with difficulties of dynamically importing `src` vs. `lib`
// from typescript. Keep everything in typescript under src, where relative
// paths can easily refer to other typescript files. And at the top level, use
// this .js module to dynamically figure out where to load from.

// Based on https://github.com/nodejs/node/issues/1381
// “Module API to check if a module has been loaded”
function moduleLoaded(name) {
  let path;
  try {
    path = require.resolve(name);
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
      return false;
    }
    throw e;
  }
  return !!require.cache[path];
}

// If running with babel-register, read ormconfig.ts from src dir. Otherwise
// use lib dir.
let dir;
if (moduleLoaded("@babel/register")) {
  dir = "src";
} else {
  dir = "lib";
}

const config = require(`./${dir}/ormconfig`);

module.exports = config;
