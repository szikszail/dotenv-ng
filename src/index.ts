import debug = require("debug");

const log = debug("xdotenv");

export function noop() {
  log("noop");
}