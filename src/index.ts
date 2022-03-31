import debug = require("debug");

const log = debug("dotenv-ng");

export function noop() {
  log("noop");
}