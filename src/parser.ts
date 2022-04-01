import { readFileSync } from "fs";
import { splitToLines } from "lines-builder";

export interface DotEnvParseOptions {
  ignoreLiteralCase?: boolean;
  parseLiterals?: boolean;
  parseNumbers?: boolean;
  allowEmptyVariables?: boolean;
  allowOrphanKeys?: boolean;
  interpolationEnabled?: boolean;
  environment?: string;
}

export const DEFAULT_OPTIONS: DotEnvParseOptions = {
  ignoreLiteralCase: true,
  parseLiterals: true,
  parseNumbers: true,
  allowEmptyVariables: true,
  allowOrphanKeys: false,
  interpolationEnabled: true,
}

export interface ParseError {
  line: number;
  error: "ORPHAN_KEY" | "MISSING_KEY" | "INVALID_EXPRESSION" | "EMPTY_VARIABLE";
  data: string;
}

export type ParsedValue = string | number | boolean | undefined | null;
export interface ParsedData {
  [key: string]: ParsedValue;
}
export interface ParseResult {
  data: ParsedData;
  errors: ParseError[];
}

export class EnvFileParser {
  private options: DotEnvParseOptions;
  private static readonly COMMENT_LINE = /^\s*#/i;
  private static readonly VARIABLE_LINE = /^\s*(?:export\s+)?([^=]*)\s*(=)?(.*?)(?:#|$)/i;
  private static readonly STRING_LITERAL = /^(['"])(.*)\1$/;
  private static readonly INTERPOLATION = /\$\{(.*?)\}/;

  constructor() {
    this.options = DEFAULT_OPTIONS;
  }

  public setOptions(options: DotEnvParseOptions): void {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  private static isCommentLine(line: string): boolean {
    return EnvFileParser.COMMENT_LINE.test(line);
  }

  private static parseStringLiteral(value: string): string {
    const m = value.match(EnvFileParser.STRING_LITERAL);
    return m ? m[2] : null;
  }

  private static parseLine(line: string): RegExpMatchArray {
    return line.match(EnvFileParser.VARIABLE_LINE);
  }

  private static interpolateValues(value: string, values: any) {
    while (EnvFileParser.INTERPOLATION.test(value)) {
      value.replace(EnvFileParser.INTERPOLATION, (m, k) => {
        return (k in values) ? values[k] : m;
      });
    }
    return value;
  }

  private parseValue(value: string, values: any): ParsedValue {
    if (value === "") {
      return value;
    }
    const s = EnvFileParser.parseStringLiteral(value);
    if (s) {
      return s;
    }
    if (this.options.parseNumbers) {
      const n = +value;
      if (!isNaN(n)) {
        return n;
      }
    }
    if (this.options.parseLiterals) {
      switch (value.toLowerCase()) {
        case 'null':
          return null;
        case 'undefined':
          return undefined;
        case 'nan':
          return NaN;
        case 'true':
          return true;
        case 'false':
          return false;
      }
    }
    return EnvFileParser.interpolateValues(value, values);
  }

  public parseFile(path: string): ParseResult {
    const lines = splitToLines(readFileSync(path, { encoding: "utf-8" }));
    const results: ParseResult = {
      data: {},
      errors: [],
    };
    for (let i = 0; i < lines.length; ++i) {
      const line = lines[i];
      if (EnvFileParser.isCommentLine(line)) {
        continue;
      }

      const m = EnvFileParser.parseLine(line);
      if (!m) {
        results.errors.push({
          line: i + 1,
          error: "INVALID_EXPRESSION",
          data: line,
        });
        continue;
      }
      const [, key, assignment, value] = m;
      if (!key) {
        results.errors.push({
          line: i + 1,
          error: "MISSING_KEY",
          data: line,
        });
        continue;
      }

      const trimmedKey = key.trim();

      if (!assignment && !this.options.allowOrphanKeys) {
        results.errors.push({
          line: i + 1,
          error: "ORPHAN_KEY",
          data: line,
        });
        continue;
      }

      const trimmedValue = value.trim();

      if (!trimmedValue && !this.options.allowEmptyVariables) {
        results.errors.push({
          line: i + 1,
          error: "EMPTY_VARIABLE",
          data: line,
        });
        continue;
      }

      results.data[trimmedKey] = this.parseValue(trimmedValue, {
        ...process.env,
        ...results.data,
      });
    }
    return results;
  }
}

const parser = new EnvFileParser();
export default parser;