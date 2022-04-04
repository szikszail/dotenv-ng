import { existsSync, statSync, readFileSync } from "fs";
import { join } from "path";

import debug = require("debug");
const log = debug("dotenv-ng:parser");

export interface DotEnvParseOptions {
  ignoreLiteralCase?: boolean;
  parseLiterals?: boolean;
  parseNumbers?: boolean;
  allowEmptyVariables?: boolean;
  allowOrphanKeys?: boolean;
  interpolationEnabled?: boolean;
  overwriteExisting?: boolean;
  environment?: string;
}

export const DEFAULT_OPTIONS: DotEnvParseOptions = {
  ignoreLiteralCase: true,
  parseLiterals: true,
  parseNumbers: true,
  allowEmptyVariables: true,
  allowOrphanKeys: false,
  interpolationEnabled: true,
  overwriteExisting: false,
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
}

interface ParsedLine {
  key: string;
  assignment: string;
  value: string;
}

interface ValueParserRule<T> {
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
    'null': null,
    'undefined': undefined,
    'true': true,
    'false': false,
    'nan': NaN,
    'NaN': NaN,
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

export class EnvFileParser {
  private options: DotEnvParseOptions = DEFAULT_OPTIONS;
  private static readonly rules: ValueParserRule<any>[] = [
    new EmptyParserRule(),
    new NumberParseRule(),
    new StringLiteralParser(),
    new JSLiteralParser(),
  ];
  private static readonly COMMENT_LINE = /^\s*#/i;
  private static readonly VARIABLE_LINE = /^\s*(?:export\s+)?([^=]*)\s*(=)?(.*?)(?:#|$)/i;
  private static readonly INTERPOLATION = /\$\{(.*?)\}/;

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
    const [, key, assignment, value] = line.match(EnvFileParser.VARIABLE_LINE);
    log(
      "parseLine(line: %s) -> { key: %s, assignment: %s, value: %s }",
      line, key, assignment, value,
    );
    return { key, assignment, value };
  }

  private static interpolateValue(key: string, value: string, values: ParsedData): string {
    log("interpolateValue(key: %s, value: %s, values: %o)", key, value, values);
    return value.replace(EnvFileParser.INTERPOLATION, (m, k): string => {
      log("interpolateValue -> replace(m: %s, k: %s)", m, k);
      if (key !== k && k in values) {
        return String(values[k]);
      }
      return m;
    })
  }

  private intepolateValues(values: ParsedData): ParsedData {
    log("intepolateValues(values: %o)", values);
    for (const key in values) {
      const value = values[key];
      if (typeof value === "string") {
        const sourceValues = this.options.overwriteExisting
          ? { ...process.env, ...values }
          : { ...values, ...process.env };
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
    } else if (statSync(path).isDirectory()) {
      const paths = [
        join(path, '.env'),
        join(path, '.env.local'),
      ];
      if (this.options.environment) {
        paths.splice(1, 0, join(path, `.env.${this.options.environment}`));
      }
      log("parse -> paths: %o", paths);
      let folderResults: ParseResult = {
        data: {},
        errors: [],
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

  public parseString(content: string, path?: string): ParseResult {
    log("parseString(content: %s, path: %s)", content, path);
    const lines = splitToLines(content);
    log("parseString -> lines: %d", lines.length);
    const results: ParseResult = {
      data: {},
      errors: [],
    };
    for (let i = 0; i < lines.length; ++i) {
      const line = lines[i];
      log("parseString -> line %d: %s", i + 1, line);
      if (EnvFileParser.isCommentLine(line)) {
        continue;
      }

      const { key, assignment, value } = EnvFileParser.parseLine(line);
      if (!key) {
        results.errors.push({
          file: path,
          line: i + 1,
          error: "MISSING_KEY",
          data: line,
        });
        continue;
      }

      const trimmedKey = key.trim();

      if (!assignment && !this.options.allowOrphanKeys) {
        results.errors.push({
          file: path,
          line: i + 1,
          error: "ORPHAN_KEY",
          data: line,
        });
        continue;
      }

      const trimmedValue = value.trim();

      if (!trimmedValue && !this.options.allowEmptyVariables) {
        results.errors.push({
          file: path,
          line: i + 1,
          error: "EMPTY_VARIABLE",
          data: line,
        });
        continue;
      }

      results.data[trimmedKey] = this.parseValue(trimmedValue);
    }
    results.data = this.intepolateValues(results.data);
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