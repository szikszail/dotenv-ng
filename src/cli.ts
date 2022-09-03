import yargs = require("yargs/yargs");
import { execSync } from "child_process";
import { statSync } from "fs";
import { values, ParsedData } from ".";
import parser, { DotEnvParseOptions } from "./parser";

import debug = require("debug");
import { INCORRECT_ENV_VARIABLE, MISSING_COMMAND, MISSING_SEPARATOR, MISSING_VARIABLE, NON_EXISTING_ENV_FILE_OR_FOLDER } from "./error";
const log = debug("dotenv-ng:cli");

export async function run(pipeIO = false): Promise<string> {
  log("process.argv: %o", process.argv);
  const args = await yargs(process.argv.slice(2))
    .options({
      load: {
        type: "string",
        describe: "The path of the env-file or the folder containing the env-files.",
        coerce: args => {
          try {
            statSync(args);
            return args;
          } catch (e) {
            throw new Error(NON_EXISTING_ENV_FILE_OR_FOLDER + " " + args);
          }
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
        default: true
      },
      var: {
        type: "string",
        array: true,
        describe: "Key-value pairs of the environment variables to be set"
      }
    })
    .usage("$0 [options] [--var KEY=value KEY=value ...] -- command")
    .check(argv => {
      if (!process.argv.includes("--")) {
        throw new Error(MISSING_SEPARATOR);
      }
      if (!argv.load && (!Array.isArray(argv.var) || argv.var.length === 0)) {
        throw new Error(MISSING_VARIABLE);
      }
      if (!Array.isArray(argv._) || argv._.length === 0) {
        throw new Error(MISSING_COMMAND);
      }
      if (argv.var?.length) {
        for (const envVar of argv.var) {
          const [key, value] = envVar.trim().split(/\s*=\s*/);
          if (!key || !value) {
            throw new Error(INCORRECT_ENV_VARIABLE + " " + envVar);
          }
        }
      }
      return true;
    })
    .help()
    .fail(false)
    .argv;

  log("argv: %O", args);

  const options: DotEnvParseOptions = {
    ignoreLiteralCase: args.ignoreLiteralCase,
    parseLiterals: args.parseLiterals,
    parseNumbers: args.parseNumbers,
    allowEmptyVariables: args.allowEmptyVariables,
    allowOrphanKeys: args.allowOrphanKeys,
    interpolationEnabled: args.interpolationEnabled,
    overwriteExisting: args.overwriteExisting,
    environment: args.environment,
  };
  log("parseOptions: %O", options);
  parser.setOptions(options);

  let envValues: ParsedData = {};
  if (args.load) {
    log("loaded: %O", envValues);
    envValues = values(args.load, options);
  }
  if (Array.isArray(args.var)) {
    for (const envVar of args.var) {
      const result = parser.parseLine(envVar);
      if (result) {
        envValues[result[0]] = result[1];
      }
    }
  }
  log("parsed: %O", envValues);
  const processedEnvValues = parser.getInterpolatedEnv(envValues);
  log("processed: %o", processedEnvValues);
  log("command: %s", args._.join(" "));
  const r = execSync(args._.join(" "), {
    // @ts-ignore
    env: processedEnvValues,
    cwd: process.cwd(),
    stdio: pipeIO ? "pipe" : "inherit",
    encoding: "utf-8",
  });
  log("result: %o", r);
  return r;
}