#!/usr/bin/env node
/* istanbul ignore file */
import {run} from "../cli";

(async () => {
  try {
    await run(false);
  } catch (e) {
    console.error(e.toString());
    e.stderr && console.error(e.stderr);
    process.exit(e.status);
  }
})();