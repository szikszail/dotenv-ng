import { load, parse, parseString, values } from "../src";

describe("dotenv-ng", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prevEnv: any;

  beforeEach(() => {
    prevEnv = process.env;
  });

  afterEach(() => {
    process.env = prevEnv;
  });

  test("should parse default env file with defaults", () => {
    expect(parse()).toEqual({
      data: {
        EXPORTED_VARIABLE: 'simple value',
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: 'hello world',
        OTHER_STRING_VARIABLE: 'hello world',
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: true,
        INTERPOLATED_VARIABLE: 'this is also hello world',
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
        'this is also an environment variable': 'with this value',
        EMPTY_VARIABLE: '',
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: null,
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: undefined,
        LITERAL_NULL_VARIABLE: 'null'
      },
      errors: [
        { line: 24, error: 'ORPHAN_KEY', data: 'THIS_WILL_BE_IGNORED' },
        { line: 25, error: 'MISSING_KEY', data: '="this as well."' }
      ]
    })
  });

  test("should parse default env file with overwritten options", () => {
    expect(parse({
      parseLiterals: false,
      parseNumbers: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: 'simple value',
        OTHER_EXPORTED_VARIABLE: '12_123.13',
        SIMPLE_STRING_VARIABLE: 'hello world',
        OTHER_STRING_VARIABLE: 'hello world',
        SIMPLE_NUMBER_VARIABLE: '1',
        SIMPLE_BOOLEAN_VARIABLE: 'false',
        OTHER_BOOLEAN_VARIABLE: 'true',
        OTHER_CASE_BOOLEAN_VARIABLE: 'TRUE',
        INTERPOLATED_VARIABLE: 'this is also hello world',
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
        'this is also an environment variable': 'with this value',
        EMPTY_VARIABLE: '',
        NULL_VARIABLE: 'null',
        OTHER_NULL_VARIABLE: 'NULL',
        UNDEFINED_VARIABLE: 'undefined',
        OTHER_UNDEFINED_VARIABLE: 'UNDEFINED',
        LITERAL_NULL_VARIABLE: 'null'
      },
      errors: [
        { line: 24, error: 'ORPHAN_KEY', data: 'THIS_WILL_BE_IGNORED' },
        { line: 25, error: 'MISSING_KEY', data: '="this as well."' }
      ]
    })
  });

  test("should parse env file with defaults", () => {
    expect(parse('tests/data/.env')).toEqual({
      data: {
        EXPORTED_VARIABLE: 'simple value',
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: 'hello world',
        OTHER_STRING_VARIABLE: 'hello world',
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: true,
        INTERPOLATED_VARIABLE: 'this is also hello world',
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
        'this is also an environment variable': 'with this value',
        EMPTY_VARIABLE: '',
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: null,
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: undefined,
        LITERAL_NULL_VARIABLE: 'null'
      },
      errors: [
        { line: 24, error: 'ORPHAN_KEY', data: 'THIS_WILL_BE_IGNORED' },
        { line: 25, error: 'MISSING_KEY', data: '="this as well."' }
      ]
    })
  });

  test("should parse env file with orphan keys", () => {
    expect(parse('tests/data/.env', {
      allowOrphanKeys: true,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: 'simple value',
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: 'hello world',
        OTHER_STRING_VARIABLE: 'hello world',
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: true,
        INTERPOLATED_VARIABLE: 'this is also hello world',
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
        'this is also an environment variable': 'with this value',
        EMPTY_VARIABLE: '',
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: null,
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: undefined,
        LITERAL_NULL_VARIABLE: 'null',
        THIS_WILL_BE_IGNORED: '',
      },
      errors: [
        { line: 25, error: 'MISSING_KEY', data: '="this as well."' }
      ]
    })
  });

  test("should parse env file without empty variables", () => {
    expect(parse('tests/data/.env', {
      allowEmptyVariables: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: 'simple value',
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: 'hello world',
        OTHER_STRING_VARIABLE: 'hello world',
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: true,
        INTERPOLATED_VARIABLE: 'this is also hello world',
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
        'this is also an environment variable': 'with this value',
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: null,
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: undefined,
        LITERAL_NULL_VARIABLE: 'null'
      },
      errors: [
        { line: 24, error: 'ORPHAN_KEY', data: 'THIS_WILL_BE_IGNORED' },
        { line: 25, error: 'MISSING_KEY', data: '="this as well."' },
        { line: 27, error: 'EMPTY_VARIABLE', data: 'EMPTY_VARIABLE=' }
      ]
    })
  });

  test("should parse env file without ignoring literal case", () => {
    expect(parse('tests/data/.env', {
      ignoreLiteralCase: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: 'simple value',
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: 'hello world',
        OTHER_STRING_VARIABLE: 'hello world',
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: false,
        OTHER_BOOLEAN_VARIABLE: true,
        OTHER_CASE_BOOLEAN_VARIABLE: 'TRUE',
        INTERPOLATED_VARIABLE: 'this is also hello world',
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
        'this is also an environment variable': 'with this value',
        EMPTY_VARIABLE: '',
        NULL_VARIABLE: null,
        OTHER_NULL_VARIABLE: 'NULL',
        UNDEFINED_VARIABLE: undefined,
        OTHER_UNDEFINED_VARIABLE: 'UNDEFINED',
        LITERAL_NULL_VARIABLE: 'null'
      },
      errors: [
        { line: 24, error: 'ORPHAN_KEY', data: 'THIS_WILL_BE_IGNORED' },
        { line: 25, error: 'MISSING_KEY', data: '="this as well."' }
      ]
    })
  });

  test("should parse env file without literals", () => {
    expect(parse('tests/data/.env', {
      parseLiterals: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: 'simple value',
        OTHER_EXPORTED_VARIABLE: 12123.13,
        SIMPLE_STRING_VARIABLE: 'hello world',
        OTHER_STRING_VARIABLE: 'hello world',
        SIMPLE_NUMBER_VARIABLE: 1,
        SIMPLE_BOOLEAN_VARIABLE: 'false',
        OTHER_BOOLEAN_VARIABLE: 'true',
        OTHER_CASE_BOOLEAN_VARIABLE: 'TRUE',
        INTERPOLATED_VARIABLE: 'this is also hello world',
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
        'this is also an environment variable': 'with this value',
        EMPTY_VARIABLE: '',
        NULL_VARIABLE: 'null',
        OTHER_NULL_VARIABLE: 'NULL',
        UNDEFINED_VARIABLE: 'undefined',
        OTHER_UNDEFINED_VARIABLE: 'UNDEFINED',
        LITERAL_NULL_VARIABLE: 'null'
      },
      errors: [
        { line: 24, error: 'ORPHAN_KEY', data: 'THIS_WILL_BE_IGNORED' },
        { line: 25, error: 'MISSING_KEY', data: '="this as well."' }
      ]
    })
  });

  test("should parse env file without numbers", () => {
    expect(parse('tests/data/.env', {
      parseLiterals: false,
      parseNumbers: false,
    })).toEqual({
      data: {
        EXPORTED_VARIABLE: 'simple value',
        OTHER_EXPORTED_VARIABLE: '12_123.13',
        SIMPLE_STRING_VARIABLE: 'hello world',
        OTHER_STRING_VARIABLE: 'hello world',
        SIMPLE_NUMBER_VARIABLE: '1',
        SIMPLE_BOOLEAN_VARIABLE: 'false',
        OTHER_BOOLEAN_VARIABLE: 'true',
        OTHER_CASE_BOOLEAN_VARIABLE: 'TRUE',
        INTERPOLATED_VARIABLE: 'this is also hello world',
        OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
        INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
        'this is also an environment variable': 'with this value',
        EMPTY_VARIABLE: '',
        NULL_VARIABLE: 'null',
        OTHER_NULL_VARIABLE: 'NULL',
        UNDEFINED_VARIABLE: 'undefined',
        OTHER_UNDEFINED_VARIABLE: 'UNDEFINED',
        LITERAL_NULL_VARIABLE: 'null'
      },
      errors: [
        { line: 24, error: 'ORPHAN_KEY', data: 'THIS_WILL_BE_IGNORED' },
        { line: 25, error: 'MISSING_KEY', data: '="this as well."' }
      ]
    })
  });

  test("should not interpolate circular values", () => {
    expect(parseString("HELLO = ${HELLO} WORLD")).toEqual({
      data: {
        HELLO: "${HELLO} WORLD"
      },
      errors: []
    });
  });

  test("should get env file values", () => {
    expect(values('tests/data/.env')).toEqual({
      EXPORTED_VARIABLE: 'simple value',
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: 'hello world',
      OTHER_STRING_VARIABLE: 'hello world',
      SIMPLE_NUMBER_VARIABLE: 1,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: 'this is also hello world',
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
      'this is also an environment variable': 'with this value',
      EMPTY_VARIABLE: '',
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: 'null'
    })
  });

  test("should get env file values with options", () => {
    expect(values('tests/data/.env', {
      parseLiterals: false,
      parseNumbers: false,
    })).toEqual({
      EXPORTED_VARIABLE: 'simple value',
      OTHER_EXPORTED_VARIABLE: '12_123.13',
      SIMPLE_STRING_VARIABLE: 'hello world',
      OTHER_STRING_VARIABLE: 'hello world',
      SIMPLE_NUMBER_VARIABLE: '1',
      SIMPLE_BOOLEAN_VARIABLE: 'false',
      OTHER_BOOLEAN_VARIABLE: 'true',
      OTHER_CASE_BOOLEAN_VARIABLE: 'TRUE',
      INTERPOLATED_VARIABLE: 'this is also hello world',
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
      'this is also an environment variable': 'with this value',
      EMPTY_VARIABLE: '',
      NULL_VARIABLE: 'null',
      OTHER_NULL_VARIABLE: 'NULL',
      UNDEFINED_VARIABLE: 'undefined',
      OTHER_UNDEFINED_VARIABLE: 'UNDEFINED',
      LITERAL_NULL_VARIABLE: 'null'
    })
  });

  test("should get env folder values", () => {
    expect(values('tests/data')).toEqual({
      LOCAL: true,
      EXPORTED_VARIABLE: 'simple value',
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: 'hello local',
      OTHER_STRING_VARIABLE: 'hello world',
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: 'this is also hello local',
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
      'this is also an environment variable': 'with this value',
      EMPTY_VARIABLE: '',
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: 'null'
    })
  });

  test("should get env folder values with environment specific config", () => {
    expect(values('tests/data', {
      environment: 'dev',
    })).toEqual({
      LOCAL: true,
      DEV: true,
      EXPORTED_VARIABLE: 'simple value',
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: 'hello local',
      OTHER_STRING_VARIABLE: 'hello world',
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: 'this is also hello local',
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
      'this is also an environment variable': 'with this value',
      EMPTY_VARIABLE: '',
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: 'null'
    })
  });

  test("should get env folder values with missing environment specific config", () => {
    expect(values('tests/data', {
      environment: 'missing',
    })).toEqual({
      LOCAL: true,
      EXPORTED_VARIABLE: 'simple value',
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: 'hello local',
      OTHER_STRING_VARIABLE: 'hello world',
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: 'this is also hello local',
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
      'this is also an environment variable': 'with this value',
      EMPTY_VARIABLE: '',
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: 'null'
    })
  });

  test('should handle missing path', () => {
    expect(() => parse('not-exist')).toThrow();
  });

  test('should load folder without overwriting process.env', () => {
    load('tests/data', {
      environment: 'tmp',
      overwriteExisting: false,
    });
    expect(process.env).toEqual({
      TMP: "TMP",
      LOCAL: true,
      EXPORTED_VARIABLE: 'simple value',
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: 'hello local',
      OTHER_STRING_VARIABLE: 'hello world',
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: 'this is also hello local',
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${process.env.JAVA_HOME}`,
      'this is also an environment variable': 'with this value',
      EMPTY_VARIABLE: '',
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: 'null',
      ...prevEnv,
    })
  });
  

  test('should load folder with overwriting process.env', () => {
    load('tests/data', {
      environment: 'tmp',
      overwriteExisting: true,
    });
    expect(process.env).toEqual({
      ...prevEnv,
      TMP: "TMP",
      LOCAL: true,
      EXPORTED_VARIABLE: 'simple value',
      OTHER_EXPORTED_VARIABLE: 12123.13,
      SIMPLE_STRING_VARIABLE: 'hello local',
      OTHER_STRING_VARIABLE: 'hello world',
      SIMPLE_NUMBER_VARIABLE: 3,
      SIMPLE_BOOLEAN_VARIABLE: false,
      OTHER_BOOLEAN_VARIABLE: true,
      OTHER_CASE_BOOLEAN_VARIABLE: true,
      INTERPOLATED_VARIABLE: 'this is also hello local',
      OTHER_BUT_NOT_INTERPOLATED: "this won't work $SIMPLE_STRING_VARIABLE (for now)",
      INTERPOLATED_WITH_SYSVARS: `system temp: ${prevEnv.JAVA_HOME}`,
      'this is also an environment variable': 'with this value',
      EMPTY_VARIABLE: '',
      NULL_VARIABLE: null,
      OTHER_NULL_VARIABLE: null,
      UNDEFINED_VARIABLE: undefined,
      OTHER_UNDEFINED_VARIABLE: undefined,
      LITERAL_NULL_VARIABLE: 'null',
    })
  })
});