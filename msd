#!/bin/bash

set -eu

DIR="$(dirname -- "${0}")"
DIR="$(cd "${DIR}" && pwd -P)"

exec node --require "${DIR}/babel-register" \
    "${DIR}/src/main.ts" \
    "${@+"${@}"}"
