import parser, { DEFAULT_OPTIONS, DotEnvParseOptions, ParsedData, ParseResult } from "./parser";
export type { DotEnvParseOptions, ParseError, ParseResult, ParsedData, ParsedValue, LiteralValue } from "./parser";

import debug = require("debug");
const log = debug("dotenv-ng");

export const DEFAULT_ENV_FILE = ".env";
export const LOCAL_ENV_FILE = ".env.local";

interface PreparedParameters {
  path: string;
  options: DotEnvParseOptions;
}

function prepareParameters(
  path?: string | DotEnvParseOptions,
  options?: DotEnvParseOptions,
  defaultOptions?: DotEnvParseOptions
): PreparedParameters {
  log(
    "prepareParameters(path: %s, options: %o, defaultOptions: %o)",
    typeof path === "string" ? path : JSON.stringify(path),
    options, defaultOptions,
  );
  // call()
  if (!path) {
    const final: PreparedParameters = {
      path: DEFAULT_ENV_FILE,
      options: {
        ...DEFAULT_OPTIONS,
        ...(defaultOptions || {}),
      },
    };
    log("prepareParameters -> call(): %o", final);
    return final;
  }
  // call({options})
  if (typeof path === "object") {
    const final: PreparedParameters = {
      path: DEFAULT_ENV_FILE,
      options: {
        ...DEFAULT_OPTIONS,
        ...(defaultOptions || {}),
        ...(path as DotEnvParseOptions || {}),
      },
    };
    log("prepareParameters -> call(options): %o", final);
    return final;
  }
  // call("path")
  // call("path", options)
  const final: PreparedParameters = {
    path,
    options: {
      ...DEFAULT_OPTIONS,
      ...(defaultOptions || {}),
      ...(options || {}),
    },
  };
  log("prepareParameters -> call(path, options?): %o", final);
  return final;
}

/**
 * Parses environment file content and returns parsed data and errors.
 * @param content The content of the environment file.
 * @param options The parse-options.
 * @returns 
 */
export function parseString(content: string, options?: DotEnvParseOptions): ParseResult {
  log("parseString(content: %s, options: %o)", content, options);
  parser.setOptions(options);
  const result = parser.parseString(content);
  log("parseString -> %o", result);
  return result;
}

export function parse(options?: DotEnvParseOptions): ParseResult;
export function parse(path: string, options?: DotEnvParseOptions): ParseResult;
/**
 * Parses environment files and returns parsed data and errors.
 * @param path Either the path to the file or the path to the folder
 *             containing environment files. Defaults to (CWD)/.env
 * @param options The parse-options.
 * @returns 
 */
export function parse(path?: string | DotEnvParseOptions, options?: DotEnvParseOptions): ParseResult {
  const { path: parsedPath, options: parsedOptions } = prepareParameters(path, options);
  log("parse(path: %s, options: %o)", parsedPath, parsedOptions);
  parser.setOptions(parsedOptions);
  const result = parser.parse(parsedPath);
  log("parse -> %o", result);
  return result;
}

export function values<D extends ParsedData>(options?: DotEnvParseOptions): D;
export function values<D extends ParsedData>(path: string, options?: DotEnvParseOptions): D;
/**
 * Parses environment files and returns parsed data.
 * @param path Either the path to the file or the path to the folder
 *             containing environment files. Defaults to (CWD)/.env
 * @param options The parse-options.
 * @returns 
 */
export function values<D extends ParsedData>(path?: string | DotEnvParseOptions, options?: DotEnvParseOptions): D {
  const { path: parsedPath, options: parsedOptions } = prepareParameters(path, options);
  log("values(path: %s, options: %o)", parsedPath, parsedOptions);
  const parsed = parse(parsedPath, parsedOptions);
  const result = parsed.data as D;
  log("values -> %o", result);
  return result;
}

export function load(options?: DotEnvParseOptions): void;
export function load(path: string, options?: DotEnvParseOptions): void;
/**
 * Parses environment files and loads the parsed data to process.env.
 * @param path Either the path to the file or the path to the folder
 *             containing environment files. Defaults to (CWD)/.env
 * @param options The parse-options.
 * @returns 
 */
export function load(path?: string | DotEnvParseOptions, options?: DotEnvParseOptions): void {
  const { path: parsedPath, options: parsedOptions } = prepareParameters(path, options);
  log("load(path: %s, options: %o)", parsedPath, parsedOptions);
  const v = values(parsedPath, parsedOptions);
  log("load -> %o", v);
  // @ts-ignore ENV can only contain string, but we can ignore it
  process.env = parsedOptions.overwriteExisting
    ? { ...process.env, ...v }
    : { ...v, ...process.env };
}