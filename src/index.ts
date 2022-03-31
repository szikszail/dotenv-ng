import debug = require("debug");

const log = debug("npm-package");

export function noop() {
  log("noop");
}