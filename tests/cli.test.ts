import { run } from "../src/cli";
import { INCORRECT_ENV_VARIABLE, MISSING_COMMAND, MISSING_SEPARATOR, MISSING_VARIABLE, NON_EXISTING_ENV_FILE_OR_FOLDER } from "../src/error";

interface CLIResult {
  args?: string[];
  success?: boolean;
  stderr?: string;
  stdout?: string;
}

describe("CLI", () => {
  const cli = async (args: string[] = [], env: NodeJS.ProcessEnv = {}): Promise<CLIResult> => {
    const prevArgv = [...process.argv];
    const prevEnv = { ...process.env };
    const result: CLIResult = {};
    try {
      process.argv = [
        ...process.argv.slice(0, 1),
        "dotenv-ng.ts",
        ...args,
      ]
      result.args = process.argv;
      process.env = {
        ...process.env,
        ...env,
      }
      result.stdout = await run(true);
      result.success = true;
    } catch (e) {
      result.stderr = e.toString();
      result.success = false;
    } finally {
      process.argv = [...prevArgv];
      process.env = { ...prevEnv };
    }
    return result;
  };

  const nodeCommand = (js: string) => `node -e "${js}"`;

  test("should fail without any command, var or the separator", async () => {
    const r = await cli();
    expect(r.success).toBeFalsy();
  });

  test("should fail without command, with var and separator", async () => {
    const r = await cli(["--var", "HELLO=world", "--"]);
    expect(r.success).toBeFalsy();
    expect(r.stderr).toContain(MISSING_COMMAND);
  });

  test("should fail without separator, with var and command", async () => {
    const r = await cli(["--var", "HELLO=world", "command"]);
    expect(r.success).toBeFalsy();
    expect(r.stderr).toContain(MISSING_SEPARATOR);
  });

  test("should fail without var or load, with separator and command", async () => {
    const r = await cli(["--", "command"]);
    expect(r.success).toBeFalsy();
    expect(r.stderr).toContain(MISSING_VARIABLE);
  });

  test("should fail with incorrect env variable (only key)", async () => {
    const r = await cli(["--var", "HELLO", "--", "command"]);
    expect(r.success).toBeFalsy();
    expect(r.stderr).toContain(INCORRECT_ENV_VARIABLE);
    expect(r.stderr).toContain("HELLO");
  });

  test("should fail with incorrect env variable (only value)", async () => {
    const r = await cli(["--var", "=world", "--", "command"]);
    expect(r.success).toBeFalsy();
    expect(r.stderr).toContain(INCORRECT_ENV_VARIABLE);
    expect(r.stderr).toContain("=world");
  });

  test("should fail with incorrect env variable (incorrect separator)", async () => {
    const r = await cli(["--var", "HELLO:world", "--", "command"]);
    expect(r.success).toBeFalsy();
    expect(r.stderr).toContain(INCORRECT_ENV_VARIABLE);
    expect(r.stderr).toContain("HELLO:world");
  });

  test("should fail with non-existing env-file", async () => {
    const r = await cli(["--load", "non-existing", "--", "command"]);
    expect(r.success).toBeFalsy();
    expect(r.stderr).toContain(NON_EXISTING_ENV_FILE_OR_FOLDER);
    expect(r.stderr).toContain("non-existing");
  });

  test("should load env-file", async () => {
    const r = await cli(["--load", "tests/data/.env", "--", nodeCommand("console.log(process.env.SIMPLE_STRING_VARIABLE);")]);
    expect(r.success).toBeTruthy();
    expect(r.stdout).toContain("hello world");
  });
  test("should handle tripple-dash", async () => {
    const r = await cli(["--load", "tests/data/.env", "---", nodeCommand("console.log(process.env.SIMPLE_STRING_VARIABLE);")]);
    expect(r.success).toBeTruthy();
    expect(r.stdout).toContain("hello world");
  });

  test("should load env-folder without environment", async () => {
    const r = await cli(["--load", "tests/data", "--", nodeCommand("console.log(process.env.SIMPLE_STRING_VARIABLE);")]);
    expect(r.success).toBeTruthy();
    expect(r.stdout).toContain("hello local");
  });

  test("should load env-folder with environment", async () => {
    const r = await cli(["--load", "tests/data", "--environment", "dev", "--", nodeCommand("console.log(process.env.DEV);")]);
    expect(r.success).toBeTruthy();
    expect(r.stdout).toContain("true");
    });

  test("should load env-folder with environment and handle env-vars", async () => {
    const r = await cli(["--var", "DEV=false", "--load", "tests/data", "--environment", "dev", "--", nodeCommand("console.log(process.env.DEV);")]);
    expect(r.success).toBeTruthy();
    expect(r.stdout).toContain("false");
  });

  test("should handle parsing options", async () => {
    const r = await cli(["--load", "tests/data", "--no-ignore-literal-case", "--environment", "dev", "--", nodeCommand("console.log(process.env.OTHER_UNDEFINED_VARIABLE);")]);
    expect(r.success).toBeTruthy();
    expect(r.stdout).toContain("UNDEFINED");
  });
});