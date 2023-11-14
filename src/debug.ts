
import debug = require("debug");

const MAX_P_LENGTH = 10;

debug.formatters.p = v => {
  if (typeof v !== "string") {
    return "";
  }
  if (v.length > MAX_P_LENGTH) {
    return ("*".repeat(MAX_P_LENGTH) + "~" + v.length).slice(-MAX_P_LENGTH);
  }
  return "*".repeat(v?.length);
}
debug.formatters.a = a => `[${a.join(",")}]`;
debug.formatters.k = o => debug.formatters.a(Object.keys(o));

export default debug;
