import {load, parse, parseString, values} from "../src";

describe("dotenv-ng", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prevEnv: any;

  beforeEach(() => {
    prevEnv = {...process.env};
  });

  afterEach(() => {
    process.env = {...prevEnv};
  });

  test("should parse default env file with defaults", () => {
    process.env.SIMPLE_STRING_VARIABLE = "NOT TO BE OVERWRITTEN";
    expect(parse()).toEqual({
      data: {
        EXPORTED_VARIABLE: "simple value",
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: "hello world",
        OTHER_STRING_VARIABLE: "hello world",
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: true,
        INTERPOLATED_VARIABLE: "this is also NOT TO BE OVERWRITTEN",
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
        "this is also an environment variable": "with this value",
        EMPTY_VARIABLE: "",
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: null,
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: undefined,
        LITERAL_NULL_VARIABLE: "null",
      },
      errors: [
        {line: 24, error: "ORPHAN_KEY", data: "THIS_WILL_BE_IGNORED"},
        {line: 25, error: "MISSING_KEY", data: "=\"this as well.\""}
      ],
      optional: []
    })
  });

  test("should parse default env file with overwritten options", () => {
    expect(parse({
      parseLiterals: false,
      parseNumbers: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: "simple value",
        OTHER_EXPORTED_VARIABLE: "12_123.13",
        SIMPLE_STRING_VARIABLE: "hello world",
        OTHER_STRING_VARIABLE: "hello world",
        SIMPLE_NUMBER_VARIABLE: "1",
        SIMPLE_BOOLEAN_VARIABLE: "false",
        OTHER_BOOLEAN_VARIABLE: "true",
        OTHER_CASE_BOOLEAN_VARIABLE: "TRUE",
        INTERPOLATED_VARIABLE: "this is also hello world",
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
        "this is also an environment variable": "with this value",
        EMPTY_VARIABLE: "",
        NULL_VARIABLE: "null",
        OTHER_NULL_VARIABLE: "NULL",
        UNDEFINED_VARIABLE: "undefined",
        OTHER_UNDEFINED_VARIABLE: "UNDEFINED",
        LITERAL_NULL_VARIABLE: "null",
      },
      errors: [
        {line: 24, error: "ORPHAN_KEY", data: "THIS_WILL_BE_IGNORED"},
        {line: 25, error: "MISSING_KEY", data: "=\"this as well.\""}
      ],
      optional: []
    })
  });

  test("should parse env file with defaults", () => {
    expect(parse("tests/data/.env")).toEqual({
      data: {
        EXPORTED_VARIABLE: "simple value",
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: "hello world",
        OTHER_STRING_VARIABLE: "hello world",
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: true,
        INTERPOLATED_VARIABLE: "this is also hello world",
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
        "this is also an environment variable": "with this value",
        EMPTY_VARIABLE: "",
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: null,
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: undefined,
        LITERAL_NULL_VARIABLE: "null",
        FILE: ".env",
      },
      errors: [
        {line: 24, error: "ORPHAN_KEY", data: "THIS_WILL_BE_IGNORED"},
        {line: 25, error: "MISSING_KEY", data: "=\"this as well.\""}
      ],
      optional: []
    })
  });

  test("should parse env file with orphan keys", () => {
    expect(parse("tests/data/.env", {
      allowOrphanKeys: true,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: "simple value",
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: "hello world",
        OTHER_STRING_VARIABLE: "hello world",
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: true,
        INTERPOLATED_VARIABLE: "this is also hello world",
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
        "this is also an environment variable": "with this value",
        EMPTY_VARIABLE: "",
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: null,
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: undefined,
        LITERAL_NULL_VARIABLE: "null",
        THIS_WILL_BE_IGNORED: "",
        FILE: ".env",
      },
      errors: [
        {line: 25, error: "MISSING_KEY", data: "=\"this as well.\""}
      ],
      optional: []
    })
  });

  test("should parse env file without empty variables", () => {
    expect(parse("tests/data/.env", {
      allowEmptyVariables: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: "simple value",
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: "hello world",
        OTHER_STRING_VARIABLE: "hello world",
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: true,
        INTERPOLATED_VARIABLE: "this is also hello world",
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
        "this is also an environment variable": "with this value",
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: null,
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: undefined,
        LITERAL_NULL_VARIABLE: "null",
        FILE: ".env",
      },
      errors: [
        {line: 24, error: "ORPHAN_KEY", data: "THIS_WILL_BE_IGNORED"},
        {line: 25, error: "MISSING_KEY", data: "=\"this as well.\""},
        {line: 27, error: "EMPTY_VARIABLE", data: "EMPTY_VARIABLE="}
      ],
      optional: []
    })
  });

  test("should parse env file without ignoring literal case", () => {
    expect(parse("tests/data/.env", {
      ignoreLiteralCase: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: "simple value",
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: "hello world",
        OTHER_STRING_VARIABLE: "hello world",
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: "TRUE",
        INTERPOLATED_VARIABLE: "this is also hello world",
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
        "this is also an environment variable": "with this value",
        EMPTY_VARIABLE: "",
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: "NULL",
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: "UNDEFINED",
        LITERAL_NULL_VARIABLE: "null",
        FILE: ".env",
      },
      errors: [
        {line: 24, error: "ORPHAN_KEY", data: "THIS_WILL_BE_IGNORED"},
        {line: 25, error: "MISSING_KEY", data: "=\"this as well.\""}
      ],
      optional: []
    })
  });

  test("should parse env file without literals", () => {
    expect(parse("tests/data/.env", {
      parseLiterals: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: "simple value",
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: "hello world",
        OTHER_STRING_VARIABLE: "hello world",
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: "false",
        OTHER_BOOLEAN_VARIABLE: "true",
        OTHER_CASE_BOOLEAN_VARIABLE: "TRUE",
        INTERPOLATED_VARIABLE: "this is also hello world",
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
        "this is also an environment variable": "with this value",
        EMPTY_VARIABLE: "",
        NULL_VARIABLE: "null",
        OTHER_NULL_VARIABLE: "NULL",
        UNDEFINED_VARIABLE: "undefined",
        OTHER_UNDEFINED_VARIABLE: "UNDEFINED",
        LITERAL_NULL_VARIABLE: "null",
        FILE: ".env",
      },
      errors: [
        {line: 24, error: "ORPHAN_KEY", data: "THIS_WILL_BE_IGNORED"},
        {line: 25, error: "MISSING_KEY", data: "=\"this as well.\""}
      ],
      optional: []
    })
  });

  test("should parse env file without numbers", () => {
    expect(parse("tests/data/.env", {
      parseLiterals: false,
      parseNumbers: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: "simple value",
        OTHER_EXPORTED_VARIABLE: "12_123.13",
        SIMPLE_STRING_VARIABLE: "hello world",
        OTHER_STRING_VARIABLE: "hello world",
        SIMPLE_NUMBER_VARIABLE: "1",
        SIMPLE_BOOLEAN_VARIABLE: "false",
        OTHER_BOOLEAN_VARIABLE: "true",
        OTHER_CASE_BOOLEAN_VARIABLE: "TRUE",
        INTERPOLATED_VARIABLE: "this is also hello world",
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
        "this is also an environment variable": "with this value",
        EMPTY_VARIABLE: "",
        NULL_VARIABLE: "null",
        OTHER_NULL_VARIABLE: "NULL",
        UNDEFINED_VARIABLE: "undefined",
        OTHER_UNDEFINED_VARIABLE: "UNDEFINED",
        LITERAL_NULL_VARIABLE: "null",
        FILE: ".env",
      },
      errors: [
        {line: 24, error: "ORPHAN_KEY", data: "THIS_WILL_BE_IGNORED"},
        {line: 25, error: "MISSING_KEY", data: "=\"this as well.\""}
      ],
      optional: []
    })
  });

  test("should parse env file with defaults", () => {
    expect(parse("tests/data/.env.default", {
      parseLiterals: false,
      parseNumbers: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: "simple value",
        OTHER_EXPORTED_VARIABLE: "12_123.13",
        SIMPLE_STRING_VARIABLE: "hello world",
        OTHER_STRING_VARIABLE: "hello world",
        SIMPLE_NUMBER_VARIABLE: "1",
        SIMPLE_BOOLEAN_VARIABLE: "false",
        OTHER_BOOLEAN_VARIABLE: "true",
        OTHER_CASE_BOOLEAN_VARIABLE: "TRUE",
        INTERPOLATED_VARIABLE: "this is also hello world",
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
        "this is also an environment variable": "with this value",
        EMPTY_VARIABLE: "",
        NULL_VARIABLE: "null",
        OTHER_NULL_VARIABLE: "NULL",
        UNDEFINED_VARIABLE: "undefined",
        OTHER_UNDEFINED_VARIABLE: "UNDEFINED",
        LITERAL_NULL_VARIABLE: "null",
        FILE: ".env.default",
        DOES_NOT_EXIST_YET: "DEFAULT",
      },
      errors: [
        {line: 24, error: "ORPHAN_KEY", data: "THIS_WILL_BE_IGNORED"},
        {line: 25, error: "MISSING_KEY", data: "=\"this as well.\""}
      ],
      optional: ["DOES_NOT_EXIST_YET", "FILE"]
    })
  });

  test("should not interpolate circular values", () => {
    expect(parseString("HELLO = ${HELLO} WORLD")).toEqual({
      data: {
        HELLO: "${HELLO} WORLD"
      },
      errors: [],
      optional: []
    });
  });

  test("should get env file values", () => {
    expect(values("tests/data/.env")).toEqual({
      EXPORTED_VARIABLE: "simple value",
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: "hello world",
      OTHER_STRING_VARIABLE: "hello world",
      SIMPLE_NUMBER_VARIABLE: 1,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: "this is also hello world",
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
      "this is also an environment variable": "with this value",
      EMPTY_VARIABLE: "",
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: "null",
      FILE: ".env",
    })
  });

  test("should get env file values with options", () => {
    expect(values("tests/data/.env", {
      parseLiterals: false,
      parseNumbers: false,
    })).toEqual({
      EXPORTED_VARIABLE: "simple value",
      OTHER_EXPORTED_VARIABLE: "12_123.13",
      SIMPLE_STRING_VARIABLE: "hello world",
      OTHER_STRING_VARIABLE: "hello world",
      SIMPLE_NUMBER_VARIABLE: "1",
      SIMPLE_BOOLEAN_VARIABLE: "false",
      OTHER_BOOLEAN_VARIABLE: "true",
      OTHER_CASE_BOOLEAN_VARIABLE: "TRUE",
      INTERPOLATED_VARIABLE: "this is also hello world",
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
      "this is also an environment variable": "with this value",
      EMPTY_VARIABLE: "",
      NULL_VARIABLE: "null",
      OTHER_NULL_VARIABLE: "NULL",
      UNDEFINED_VARIABLE: "undefined",
      OTHER_UNDEFINED_VARIABLE: "UNDEFINED",
      LITERAL_NULL_VARIABLE: "null",
      FILE: ".env",
    })
  });

  test("should get env folder values", () => {
    expect(values("tests/data")).toEqual({
      LOCAL: true,
      EXPORTED_VARIABLE: "simple value",
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: "hello local",
      OTHER_STRING_VARIABLE: "hello world",
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: "this is also hello local",
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
      "this is also an environment variable": "with this value",
      EMPTY_VARIABLE: "",
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: "null",
      FILE: ".env.local",
    })
  });

  test("should get env folder values with environment specific config", () => {
    expect(values("tests/data", {
      environment: "dev",
    })).toEqual({
      LOCAL: true,
      DEV: true,
      EXPORTED_VARIABLE: "simple value",
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: "hello local",
      OTHER_STRING_VARIABLE: "hello world",
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: "this is also hello local",
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
      "this is also an environment variable": "with this value",
      EMPTY_VARIABLE: "",
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: "null",
      FILE: ".env.local",
    })
  });

  test("should get env folder values with missing environment specific config", () => {
    expect(values("tests/data", {
      environment: "missing",
    })).toEqual({
      LOCAL: true,
      EXPORTED_VARIABLE: "simple value",
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: "hello local",
      OTHER_STRING_VARIABLE: "hello world",
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: "this is also hello local",
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
      "this is also an environment variable": "with this value",
      EMPTY_VARIABLE: "",
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: "null",
      FILE: ".env.local",
    })
  });

  test("should handle missing path", () => {
    expect(() => parse("not-exist")).toThrow();
  });

  test("should load folder without overwriting process.env", () => {
    process.env.SIMPLE_STRING_VARIABLE = "NOT TO BE OVERWRITTEN";
    load("tests/data", {
      environment: "tmp",
      overwriteExisting: false,
    });
    expect(process.env).toEqual({
      TMP: "TMP",
      LOCAL: true,
      EXPORTED_VARIABLE: "simple value",
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: "NOT TO BE OVERWRITTEN",
      OTHER_STRING_VARIABLE: "hello world",
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: "this is also NOT TO BE OVERWRITTEN",
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.HOME}`,
      "this is also an environment variable": "with this value",
      EMPTY_VARIABLE: "",
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: "null",
      FILE: ".env.local",
      ...prevEnv,
    })
  });

  test("should load folder with overwriting process.env", () => {
    process.env.SIMPLE_STRING_VARIABLE = "TO BE OVERWRITTEN";
    load("tests/data", {
      environment: "tmp",
      overwriteExisting: true,
    });
    expect(process.env).toEqual({
      ...prevEnv,
      TMP: "TMP",
      LOCAL: true,
      EXPORTED_VARIABLE: "simple value",
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: "hello local",
      OTHER_STRING_VARIABLE: "hello world",
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: "this is also hello local",
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${prevEnv.HOME}`,
      "this is also an environment variable": "with this value",
      EMPTY_VARIABLE: "",
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: "null",
      FILE: ".env.local",
    });
  });

  test("should load folder with default values", () => {
    process.env.SIMPLE_STRING_VARIABLE = "TO BE OVERWRITTEN";
    load("tests/data", {
      environment: "default",
      overwriteExisting: true,
    });
    expect(process.env).toEqual({
      ...prevEnv,
      LOCAL: true,
      EXPORTED_VARIABLE: "simple value",
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: "hello local",
      OTHER_STRING_VARIABLE: "hello world",
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: "this is also hello local",
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${prevEnv.HOME}`,
      "this is also an environment variable": "with this value",
      EMPTY_VARIABLE: "",
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: "null",
      DOES_NOT_EXIST_YET: "DEFAULT",
      FILE: ".env.local",
    });
  });
});