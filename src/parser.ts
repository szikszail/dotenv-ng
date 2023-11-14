import { existsSync, statSync, readFileSync } from "fs";
import { join } from "path";

import debug = require("debug");
const log = debug("dotenv-ng:parser");

export interface DotEnvParseOptions {
  /**
   * Should the casing of special literals
   * (e.g. `true`, `false`, `null`, `undefined`, `NaN`) be ignored.
   * Defaults to true.
   */
  ignoreLiteralCase?: boolean;
  /**
   * Should special literals be parsed as their JS values
   * (e.g. `true`, `false`, `null`, `undefined`, `NaN`)
   * or parsed as strings. Defaults to true.
   */
  parseLiterals?: boolean;
  /**
   * Should number literals be parsed as numbers or parsed as strings.
   * Defaults to true.
   */
  parseNumbers?: boolean;
  /**
   * Should empty variables (without a values set) be allowed.
   * Defaults to true.
   */
  allowEmptyVariables?: boolean;
  /**
   * Should orphan keys be allowed (line 24) or parsed as empty variables.
   * Defaults to false.
   */
  allowOrphanKeys?: boolean;
  /**
   * Should string interpolation evaluated for other
   * environment variables or handled as literal strings.
   * Defaults to true.
   */
  interpolationEnabled?: boolean;
  /**
   * Should the existing environment variable values be overwritten.
   * Defaults to false.
   */
  overwriteExisting?: boolean;
  /**
   * The environment specific environment file to be loaded,
   * if a folder is processed.
   */
  environment?: string;
  /**
   * Should the environment variable names be normalized,
   * and a normalized version be appended to the set
   * of environment variables. Normalized names should
   * be uppercase and instead of white space contain underscore.
   */
  normalize?: boolean;
}

export const DEFAULT_OPTIONS: DotEnvParseOptions = {
  ignoreLiteralCase: true,
  parseLiterals: true,
  parseNumbers: true,
  allowEmptyVariables: true,
  allowOrphanKeys: false,
  interpolationEnabled: true,
  overwriteExisting: false,
  normalize: false,
}

export interface ParseError {
  file?: string;
  line: number;
  error: "ORPHAN_KEY" | "MISSING_KEY" | "INVALID_EXPRESSION" | "EMPTY_VARIABLE";
  data: string;
}

export type LiteralValue = undefined | null | number | boolean;
export type ParsedValue = string | LiteralValue;
export interface ParsedData {
  [key: string]: ParsedValue;
}
export interface ParseResult {
  data: ParsedData;
  errors: ParseError[];
  optional: string[];
}

interface ParsedLine {
  key: string;
  assignment: string;
  value: string;
  optional: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ValueParserRule<T = any> {
  condition(value: string, options: DotEnvParseOptions): boolean;
  parse(value: string, options: DotEnvParseOptions): T;
}

function splitToLines(s: string): string[] {
  return s.split(/\r?\n\r?/g);
}

class EmptyParserRule implements ValueParserRule<string> {
  condition(value: string): boolean {
    log("EmptyParserRule:condition(value: %s)", value);
    return value === "";
  }

  parse(): string {
    log("EmptyParserRule:parse()");
    return "";
  }
}

class NumberParseRule implements ValueParserRule<number> {
  private static readonly NUMBER_LITERAL_SEPARATORS = /[_\s]/g;

  prepare(value: string): string {
    log("NumberParseRule:prepare(value: %s)", value);
    return value.replace(NumberParseRule.NUMBER_LITERAL_SEPARATORS, "");
  }

  condition(value: string, options: DotEnvParseOptions): boolean {
    log("NumberParseRule:condition(value: %s, options: %o)", value, options);
    const prepared = this.prepare(value);
    return options.parseNumbers && prepared && !isNaN(+prepared);
  }

  parse(value: string): number {
    log("NumberParseRule:parse(value: %s)", value);
    return +this.prepare(value);
  }
}

class StringLiteralParser implements ValueParserRule<string> {
  private static readonly STRING_LITERAL = /^(['"])(.*)\1$/;

  condition(value: string): boolean {
    log("StringLiteralParser:condition(value: %s)", value);
    return StringLiteralParser.STRING_LITERAL.test(value);
  }

  parse(value: string): string {
    log("StringLiteralParser:parse(value: %s)", value);
    return value.match(StringLiteralParser.STRING_LITERAL)[2];
  }
}

class JSLiteralParser implements ValueParserRule<LiteralValue> {
  private static readonly JS_LITERALS: { [key: string]: LiteralValue } = {
    "null": null,
    "undefined": undefined,
    "true": true,
    "false": false,
    "nan": NaN,
    "NaN": NaN,
  }

  prepare(value: string, options: DotEnvParseOptions): string {
    log("JSLiteralParser:prepare(value: %s, options: %o)", value, options);
    return options.ignoreLiteralCase ? value.toLowerCase() : value;
  }

  condition(value: string, options: DotEnvParseOptions): boolean {
    log("JSLiteralParser:condition(value: %s, options: %o)", value, options);
    return options.parseLiterals && this.prepare(value, options) in JSLiteralParser.JS_LITERALS;
  }

  parse(value: string, options: DotEnvParseOptions): LiteralValue {
    log("JSLiteralParser:parse(value: %s, options: %o)", value, options);
    return JSLiteralParser.JS_LITERALS[this.prepare(value, options)];
  }
}

class MissingKeyError extends Error {
  CODE = "MISSING_KEY";
}
class OrphanKeyError extends Error {
  CODE = "ORPHAN_KEY";
}
class EmptyVariableError extends Error {
  CODE = "EMPTY_VARIABLE";
}

export class EnvFileParser {
  private options: DotEnvParseOptions = DEFAULT_OPTIONS;
  private static readonly rules: ValueParserRule[] = [
    new EmptyParserRule(),
    new NumberParseRule(),
    new StringLiteralParser(),
    new JSLiteralParser(),
  ];
  private static readonly COMMENT_LINE = /^#/i;
  private static readonly VARIABLE_LINE = /^(?:export\s+)?([^=?]*)(\?)?\s*(=)?([^#\n]*?)(?:#|$|\n)/i;
  private static readonly INTERPOLATION = /\$\{(.*?)}/;

  public setOptions(options: DotEnvParseOptions): void {
    log("setOptions(options: %o)", options);
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  private static isCommentLine(line: string): boolean {
    log("isCommentLine(line: %s)", line);
    return EnvFileParser.COMMENT_LINE.test(line);
  }

  private static parseLine(line: string): ParsedLine {
    const [, key, def, assignment, value] = line.match(EnvFileParser.VARIABLE_LINE);
    log(
      "parseLine(line: %s) -> { key: %s, assignment: %s, value: %s }",
      line, key, assignment, value,
    );
    return { key, assignment, value, optional: !!def };
  }

  private static interpolateValue(key: string, value: string, values: ParsedData): string {
    log("interpolateValue(key: %s, value: %s, values: %o)", key, value, Object.keys(values));
    return value.replace(EnvFileParser.INTERPOLATION, (m, k): string => {
      log("interpolateValue -> replace(m: %s, k: %s)", m, k);
      if (key !== k && k in values) {
        return String(values[k]);
      }
      return m;
    })
  }

  public static normalizeEnv(values: ParsedData): ParsedData {
    log("normalizeEnv(values: %o)", values);
    const normalized: ParsedData = { ...values };
    for (const key in values) {
      normalized[key.toUpperCase().replace(/\s+/g, "_")] = values[key];
    }
    return normalized;
  }

  public getInterpolatedEnv(values: ParsedData, optional: string[]): ParsedData {
    log("getInterpolatedEnv(values: %o, overwrite: %b)", values, this.options.overwriteExisting);
    const interpolated: ParsedData = { ...process.env };
    for (const key in values) {
      const value = values[key];
      if (!(key in interpolated) || (!optional.includes(key) && this.options.overwriteExisting)) {
        interpolated[key] = value;
      }
    }
    return interpolated;
  }

  private interpolateValues(values: ParsedData, optional: string[]): ParsedData {
    log("interpolateValues(values: %o, optionals: %o)", values, optional);
    for (const key in values) {
      const sourceValues = this.getInterpolatedEnv(values, optional);
      const value = values[key];
      if (typeof value === "string") {
        values[key] = EnvFileParser.interpolateValue(key, value, sourceValues);
      }
    }
    return values;
  }

  private parseValue(value: string): ParsedValue {
    log("parseValue(value: %s)", value);
    for (const rule of EnvFileParser.rules) {
      if (rule.condition(value, this.options)) {
        return rule.parse(value, this.options);
      }
    }
    log("parseValue -> %s", value);
    return value;
  }

  public parse(path: string): ParseResult {
    log("parse(path: %s)", path);
    if (!existsSync(path)) {
      throw new Error(`Path does not exist: ${path}!`);
    }
    if (statSync(path).isFile()) {
      return this.parseFile(path);
    }
    if (statSync(path).isDirectory()) {
      const paths = [
        join(path, ".env"),
        join(path, ".env.local"),
      ];
      if (this.options.environment) {
        paths.splice(1, 0, join(path, `.env.${this.options.environment}`));
      }
      log("parse -> paths: %o", paths);
      let folderResults: ParseResult = {
        data: {},
        errors: [],
        optional: [],
      };
      for (const p of paths) {
        try {
          const results = this.parseFile(p);
          log("parse -> parsed: %s", p);
          folderResults = {
            data: {
              ...folderResults.data,
              ...results.data,
            },
            errors: [
              ...folderResults.errors,
              ...results.errors,
            ],
            optional: [
              ...folderResults.optional,
              ...results.optional,
            ]
          };
        } catch (e) {
          log("parse -> error: %s", e);
          // missing file
        }
      }
      return folderResults;
    }
    throw new Error(`Invalid path: ${path}!`);
  }

  public parseLine(line: string): [string, ParsedValue, boolean] {
    log("parseLine(line: %s)", line);

    line = line.trim();

    if (EnvFileParser.isCommentLine(line)) {
      return;
    }

    const { key, assignment, value, optional } = EnvFileParser.parseLine(line);
    if (!key) {
      throw new MissingKeyError();
    }

    const trimmedKey = key.trim().replace(/(^"|"$)/, "");

    if (!assignment && !this.options.allowOrphanKeys) {
      throw new OrphanKeyError();
    }

    const trimmedValue = value.trim();

    if (!trimmedValue && !this.options.allowEmptyVariables) {
      throw new EmptyVariableError();
    }

    return [trimmedKey, this.parseValue(trimmedValue), optional];
  }

  public parseString(content: string, path?: string): ParseResult {
    log("parseString(content: %s, path: %s)", content, path);
    const lines = splitToLines(content);
    log("parseString -> lines: %d", lines.length);
    const results: ParseResult = {
      data: {},
      errors: [],
      optional: [],
    };
    for (let i = 0; i < lines.length; ++i) {
      const line = lines[i];
      log("parseString -> line %d: %s", i + 1, line);

      try {
        const result = this.parseLine(line);
        if (result) {
          const [key, value, optional] = result;
          results.data[key] = value;
          if (optional) {
            results.optional.push(key);
          }
        }
      } catch (e) {
        results.errors.push({
          file: path,
          line: i + 1,
          error: e.CODE,
          data: line,
        });
      }
    }
    results.data = this.interpolateValues(results.data, results.optional);
    if (this.options.normalize) {
      results.data = EnvFileParser.normalizeEnv(results.data);
    }
    log("parseString -> %o", results);
    return results;
  }

  public parseFile(path: string): ParseResult {
    log("parseFile(path: %s)", path);
    return this.parseString(readFileSync(path, { encoding: "utf-8" }));
  }
}

const parser = new EnvFileParser();
export default parser;
