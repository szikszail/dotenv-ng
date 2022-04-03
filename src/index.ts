// import debug = require("debug");
import parser, { DEFAULT_OPTIONS, DotEnvParseOptions, ParsedData, ParseResult } from "./parser";

// const log = debug("dotenv-ng");

export interface DotEnvLoadOptions extends DotEnvParseOptions {
  overwriteExisting?: boolean;
}

export const DEFAULT_ENV_FILE = ".env";
export const LOCAL_ENV_FILE = ".env.local";


interface PreparedParameters<O extends DotEnvParseOptions> {
  path: string;
  options: O;
}

function prepareParameters<O extends DotEnvParseOptions>(path?: string | O, options?: O, defaultOptions?: O): PreparedParameters<O> {
  // call()
  if (!path) {
    return {
      path: DEFAULT_ENV_FILE,
      options: {
        ...DEFAULT_OPTIONS,
        ...(defaultOptions || {}),
      } as O,
    };
  }
  // call({options})
  if (typeof path === "object") {
    return {
      path: DEFAULT_ENV_FILE,
      options: {
        ...DEFAULT_OPTIONS,
        ...(defaultOptions || {}),
        ...(path as O || {}),
      } as O,
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
    } as O,
  };
}

export function parseString(content: string, options?: DotEnvParseOptions): ParseResult {
  parser.setOptions(options);
  return parser.parseString(content);
}

export function parse(options?: DotEnvParseOptions): ParseResult;
export function parse(path: string, options?: DotEnvParseOptions): ParseResult;
export function parse(path?: string | DotEnvParseOptions, options?: DotEnvParseOptions): ParseResult {
  const { path: parsedPath, options: parsedOptions } = prepareParameters<DotEnvParseOptions>(path, options);
  // console.log({ parsedPath, parsedOptions });
  parser.setOptions(parsedOptions);
  return parser.parse(parsedPath);
}

export function values<D extends ParsedData>(options?: DotEnvParseOptions): D;
export function values<D extends ParsedData>(path: string, options?: DotEnvParseOptions): D;
export function values<D extends ParsedData>(path?: string | DotEnvParseOptions, options?: DotEnvParseOptions): D {
  const { path: parsedPath, options: parsedOptions } = prepareParameters<DotEnvParseOptions>(path, options);
  const parsed = parse(parsedPath, parsedOptions);
  return parsed.data as D;
}

export function load(options?: DotEnvLoadOptions): void;
export function load(path: string, options?: DotEnvLoadOptions): void;
export function load(path?: string | DotEnvLoadOptions, options?: DotEnvLoadOptions): void {
  const { path: parsedPath, options: parsedOptions } = prepareParameters<DotEnvLoadOptions>(path, options);
  const v = values(parsedPath, parsedOptions);
  // @ts-ignore ENV can only contain string, but we can ignore it
  process.env = parsedOptions.overwriteExisting
    ? { ...process.env, ...v }
    : { ...v, ...process.env };
}