// import debug = require("debug");
import parser, { DEFAULT_OPTIONS, DotEnvParseOptions, ParsedData, ParseResult } from "./parser";

// const log = debug("dotenv-ng");

export const DEFAULT_ENV_FILE = ".env";
export const LOCAL_ENV_FILE = ".env.local";


interface PreparedParameters {
  path: string;
  options: DotEnvParseOptions;
}

function prepareParameters(path?: string | DotEnvParseOptions, options?: DotEnvParseOptions, defaultOptions?: DotEnvParseOptions): PreparedParameters {
  // call()
  if (!path) {
    return {
      path: DEFAULT_ENV_FILE,
      options: {
        ...DEFAULT_OPTIONS,
        ...(defaultOptions || {}),
      },
    };
  }
  // call({options})
  if (typeof path === "object") {
    return {
      path: DEFAULT_ENV_FILE,
      options: {
        ...DEFAULT_OPTIONS,
        ...(defaultOptions || {}),
        ...(path as DotEnvParseOptions || {}),
      },
    };
  }
  // call("path")
  // call("path", options)
  return {
    path,
    options: {
      ...DEFAULT_OPTIONS,
      ...(defaultOptions || {}),
      ...(options || {}),
    },
  };
}

export function parseString(content: string, options?: DotEnvParseOptions): ParseResult {
  parser.setOptions(options);
  return parser.parseString(content);
}

export function parse(options?: DotEnvParseOptions): ParseResult;
export function parse(path: string, options?: DotEnvParseOptions): ParseResult;
export function parse(path?: string | DotEnvParseOptions, options?: DotEnvParseOptions): ParseResult {
  const { path: parsedPath, options: parsedOptions } = prepareParameters(path, options);
  // console.log({ parsedPath, parsedOptions });
  parser.setOptions(parsedOptions);
  return parser.parse(parsedPath);
}

export function values<D extends ParsedData>(options?: DotEnvParseOptions): D;
export function values<D extends ParsedData>(path: string, options?: DotEnvParseOptions): D;
export function values<D extends ParsedData>(path?: string | DotEnvParseOptions, options?: DotEnvParseOptions): D {
  const { path: parsedPath, options: parsedOptions } = prepareParameters(path, options);
  const parsed = parse(parsedPath, parsedOptions);
  return parsed.data as D;
}

export function load(options?: DotEnvParseOptions): void;
export function load(path: string, options?: DotEnvParseOptions): void;
export function load(path?: string | DotEnvParseOptions, options?: DotEnvParseOptions): void {
  const { path: parsedPath, options: parsedOptions } = prepareParameters(path, options);
  const v = values(parsedPath, parsedOptions);
  // @ts-ignore ENV can only contain string, but we can ignore it
  process.env = parsedOptions.overwriteExisting
    ? { ...process.env, ...v }
    : { ...v, ...process.env };
}