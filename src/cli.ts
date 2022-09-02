import yargs = require("yargs");
import { statSync } from "fs";
import { values, ParsedData } from ".";
import parser from "./parser";

export async function run(): Promise<void> {
  const args = await yargs
    .options({
      load: {
        type: "string",
        describe: "The path of the env-file or the folder containing the env-files.",
        coerce: args => {
          if (!args) {
            return true;
          }
          const stat = statSync(args);
          return stat.isDirectory() || stat.isFile();
        }
      },
      environment: {
        type: "string",
        describe: "The environment specific environment file to be loaded, if a folder is processed."
      },
      "ignore-literal-case": {
        type: "boolean",
        describe: "Should the casing of special literals (e.g. true, false, null, undefined, NaN) be ignored.",
        default: true
      },
      "parse-literals": {
        type: "boolean",
        describe: "Should special literals be parsed as their JS values (e.g. true, false, null, undefined, NaN) or parsed as strings.",
        default: true
      },
      "parse-numbers": {
        type: "boolean",
        describe: "Should number literals be parsed as numbers or parsed as strings.",
        default: true
      },
      "allow-empty-variables": {
        type: "boolean",
        describe: "Should empty variables (without a values set) be allowed.",
        default: true
      },
      "allow-orphan-keys": {
        type: "boolean",
        describe: "Should orphan keys be allowed (line 24) or parsed as empty variables.",
        default: false
      },
      "interpolation-enabled": {
        type: "boolean",
        describe: "Should string interpolation evaluated for other environment variables or handled as literal strings.",
        default: true
      },
      "overwrite-existing": {
        type: "boolean",
        describe: "Should the existing environment variable values be overwritten.",
        default: false
      },
      var: {
        type: "string",
        array: true,
        describe: "Key-value pairs of the environment variables to be set",
        coerce: vars => {
          for (const envVar of vars) {
            const [key, value] = envVar.trim().split(/\s*=\s*/);
            if (!key || !value) {
              throw new Error("The following environment variable is not correct: " + envVar);
            }
          }
          return vars;
        }
      }
    })
    .usage("$0 [options] [--var KEY=value KEY=value ...] -- command")
    .check(argv => {
      if (!process.argv.includes("--")) {
        throw new Error("Separator argument (--) must be set!");
      }
      if (!argv.load && (!Array.isArray(argv.var) || argv.var.length === 0)) {
        throw new Error("Either load or var must be set!");
      }
      return true;
    })
    .help()
    .argv;

  parser.setOptions({
    ignoreLiteralCase: args.ignoreLiteralCase,
    parseLiterals: args.parseLiterals,
    parseNumbers: args.parseNumbers,
    allowEmptyVariables: args.allowEmptyVariables,
    allowOrphanKeys: args.allowOrphanKeys,
    interpolationEnabled: args.interpolationEnabled,
    overwriteExisting: args.overwriteExisting,
    environment: args.environment,
  });

  let envValues: ParsedData = {};
  if (args.load) {
    envValues = values(args.load);
  }
  if (Array.isArray(args.var)) {
    for (const envVar of args.var) {
      const result = parser.parseLine(envVar);
      if (result) {
        envValues[result[0]] = result[1];
      }
    }
  }
  const processedEnvValues = !args.overwriteExisting
    ? { ...process.env, ...envValues }
    : { ...envValues, ...process.env };
  console.log({ envValues, processedEnvValues });
}