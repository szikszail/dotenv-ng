import { existsSync, statSync, readFileSync } from "fs";
import { splitToLines } from "lines-builder";
import { join } from "path";

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

class EmptyParserRule implements ValueParserRule<string> {
  condition(value: string): boolean {
    return value === "";
  }

  parse(): string {
    return "";
  }
}

class NumberParseRule implements ValueParserRule<number> {
  private static readonly NUMBER_LITERAL_SEPARATORS = /[_\s]/g;

  prepare(value: string): string {
    return value.replace(NumberParseRule.NUMBER_LITERAL_SEPARATORS, "");
  }

  condition(value: string, options: DotEnvParseOptions): boolean {
    const prepared = this.prepare(value);
    return options.parseNumbers && prepared && !isNaN(+prepared);
  }

  parse(value: string): number {
    return +this.prepare(value);
  }
}

class StringLiteralParser implements ValueParserRule<string> {
  private static readonly STRING_LITERAL = /^(['"])(.*)\1$/;

  condition(value: string): boolean {
    return StringLiteralParser.STRING_LITERAL.test(value);
  }

  parse(value: string): string {
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
    return options.ignoreLiteralCase ? value.toLowerCase() : value;
  }

  condition(value: string, options: DotEnvParseOptions): boolean {
    return options.parseLiterals && this.prepare(value, options) in JSLiteralParser.JS_LITERALS;
  }

  parse(value: string, options: DotEnvParseOptions): LiteralValue {
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
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  private static isCommentLine(line: string): boolean {
    return EnvFileParser.COMMENT_LINE.test(line);
  }
  private static parseLine(line: string): ParsedLine {
    const [, key, assignment, value] = line.match(EnvFileParser.VARIABLE_LINE);
    return { key, assignment, value };
  }

  private static interpolateValue(key: string, value: string, values: ParsedData): string {
    return value.replace(EnvFileParser.INTERPOLATION, (m, k): string => {
      if (key !== k && k in values) {
        return String(values[k]);
      }
      return m;
    })
  }

  private intepolateValues(values: ParsedData): ParsedData {
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
    for (const rule of EnvFileParser.rules) {
      if (rule.condition(value, this.options)) {
        return rule.parse(value, this.options);
      }
    }
    return value;
  }

  public parse(path: string): ParseResult {
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
      let folderResults: ParseResult = {
        data: {},
        errors: [],
      };
      for (const p of paths) {
        try {
          const results = this.parseFile(p);
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
          // missing file
        }
      }
      return folderResults;
    }
    throw new Error(`Invalid path: ${path}!`);
  }

  public parseString(content: string, path?: string): ParseResult {
    const lines = splitToLines(content);
    const results: ParseResult = {
      data: {},
      errors: [],
    };
    for (let i = 0; i < lines.length; ++i) {
      const line = lines[i];
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
    return results;
  }

  public parseFile(path: string): ParseResult {
    return this.parseString(readFileSync(path, { encoding: "utf-8" }));
  }
}

const parser = new EnvFileParser();
export default parser;