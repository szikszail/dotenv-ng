import { parse } from "../src";

describe("dotenv-ng", () => {
  test("should parse env file", () => {
    console.log(parse('tests/data/.env'));
  });
});