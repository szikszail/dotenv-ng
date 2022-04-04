> **IMPORTANT** This pacakge is <font coloe="red">Work In Progress</font>, it is just a placeholder for the actual package release later (v1.0.0)

# dotenv-ng

![Downloads](https://img.shields.io/npm/dw/dotenv-ng?style=flat-square) ![Version@npm](https://img.shields.io/npm/v/dotenv-ng?label=version%40npm&style=flat-square) ![Version@git](https://img.shields.io/github/package-json/v/szikszail/dotenv-ng/main?label=version%40git&style=flat-square) ![CI](https://img.shields.io/github/workflow/status/szikszail/dotenv-ng/CI/main?label=ci&style=flat-square) ![Docs](https://img.shields.io/github/workflow/status/szikszail/dotenv-ng/Docs/main?label=docs&style=flat-square)

This tool is a custom implementation to handle `.env` files, inspired by [dotenv (NPM)](https://www.npmjs.com/package/dotenv) and [python-dotenv (PyPi)](https://pypi.org/project/python-dotenv/), including features like:
 - Handling simple `.env` file
 - Handling environment variable interpolation
 - Handling file hierarchy
 - Handling JavaScript literals

## Usage

### Environment files

You can define a `.env` file containing configuration, environment variables, with
 - Simple number, string, boolean values
 - Comments
 - Environment variables interpolation

```sh
# .env
# This is an environment file (simplified)
export EXPORTED_VARIABLE=simple value # this will be a string
export OTHER_EXPORTED_VARIABLE=123 # this will be a number
# You can leave the export statement and set
# just key-value pairs
SIMPLE_STRING_VARIABLE = "hello world" # string can be also set in quotes
OTHER_STRING_VARIABLE = 'hello world' # or apostrophes
SIMPLE_NUMBER_VARIABLE = 1
# Boolean variables can have true,false values
SIMPLE_BOOLEAN_VARIABLE = false
OTHER_BOOLEAN_VARIABLE = true
OTHER_CASE_BOOLEAN_VARIABLE = TRUE
# String interpolation will also wrok
# with the ${KEY} format
INTERPOLATED_VARIABLE = "this is also ${SIMPLE_STRING_VARIABLE}"
OTHER_BUT_NOT_INTERPOLATED = "this won't work $SIMPLE_STRING_VARIABLE (for now)" # this won't work yet
INTERPOLATED_WITH_SYSVARS = "system temp: ${JAVA_HOME}" # use environment variables
# We suggest following the standard naming conventions
# for environment variables (CAPITALS with _)
# but others will work as well
this is also an environment variable = "with this value"
# These lines are ignored, without =, or without key
THIS_WILL_BE_IGNORED
="this as well."
# This will be an empty variable (empty string)
EMPTY_VARIABLE=
# Special values are also supported
NULL_VARIABLE=null
OTHER_NULL_VARIABLE=NULL
UNDEFINED_VARIABLE=undefined
OTHER_UNDEFINED_VARIABLE=UNDEFINED
LITERAL_NULL_VARIABLE="null" # to use these particular values as strings set them as a string
```

### Parsing

An environment file can be parsed with the `parse` function. This will parse the valid values and the parsing errors as well.

```typescript
import { parse } from "dotenv-ng"

const results = parse(".env")
console.log(results.data);
// {
//   "EXPORTED_VARIABLE": "simple value",
//   "OTHER_EXPORTED_VARIABLE": 123,
//   "SIMPLE_STRING_VARIABLE": "hello world",
//   "OTHER_STRING_VARIABLE": "hello world",
//   "SIMPLE_NUMBER_VARIABLE": 1,
//   "SIMPLE_BOOLEAN_VARIABLE": false,
//   "OTHER_BOOLEAN_VARIABLE": true,
//   "OTHER_CASE_BOOLEAN_VARIABLE": true,
//   "INTERPOLATE_VARIABLE": "this is also hello world",
//   "OTHER_BUT_NOT_INTERPOLATED": "this won't work $SIMPLE_STRING_VARIABLE (for now)",
//   "INTERPOLATED_WITH_SYSVARS": "sytem temp: C:\\bin\\java",
//   "this is also an environment variable": "with this value",
//   "EMPTY_VARIABLE": "",
//   "NULL_VARIABLE": null,
//   "OTHER_NULL_VARIABLE": null,
//   "UNDEFINED_VARIABLE": undefined,
//   "OTHER_UNDERFINED_VARIABLE: undefined,
//   "LITERAL_NULL_VARIABLE": "null"
// }

console.log(results.errors);
// [
//   { "line": 24, "error": "ORPHAN_KEY", "data": "THIS_WILL_BE_IGNORED" },
//   { "line": 25, "error": "MISSING_KEY", "data": "=\"this as well\"" }
// ]
```

### Values

To retrieve the valid, parsed values, you can use the `values` function:

```typescript
import { values } from "dotenv-ng";

const v = values(".env")
console.log(v);

// {
//   "EXPORTED_VARIABLE": "simple value",
//   "OTHER_EXPORTED_VARIABLE": 123,
//   ...
//   "OTHER_UNDERFINED_VARIABLE: undefined,
//   "LITERAL_NULL_VARIABLE": "null"
// }
```

### Updating environment variables

To update the environment variables in the scripts context (`process.env`), you can use the `load` function:

```typescript
import { load } from "dotenv-ng";

load(".env");
console.log(process.env);

// {
//   ...
//   "EXPORTED_VARIABLE": "simple value",
//   "OTHER_EXPORTED_VARIABLE": 123,
//   ...
//   "OTHER_UNDERFINED_VARIABLE: undefined,
//   "LITERAL_NULL_VARIABLE": "null"
//   ...
// }
```

By default, `load` won't overwrite the existing environment variables, to enable it set the `overwriteExisting: boolean` configuration option:

```typescript
load(".env", { overwriteExisting: true })
```

### Configuration

`parse` (and other functions such as `load` and `values`) accepts an optional configuration to adjust parsing logic:

| Option                 | Type      | Description                                                                                                                   | Default |
| :--------------------- | :-------- | :---------------------------------------------------------------------------------------------------------------------------- | :------ |
| `ingoreLiteralCase`    | `boolean` | Should the casing of special literals (e.g. `true`, `false`, `null`, `undefined`, `NaN`) be ignored.                          | `true`  |
| `parseLiterals`        | `boolean` | Should special literals be parsed as their JS values (e.g. `true`, `false`, `null`, `undefined`, `NaN`) or parsed as strings. | `true`  |
| `parseNumbers`         | `boolean` | Should number literals be parsed as numbers or parsed as strings.                                                             | `true`  |
| `allowEmptyVariables`  | `boolean` | Should empty variables (without a values set) be allowed.                                                                     | `true`  |
| `allowOrphanKeys`      | `boolean` | Should orphan keys be allowed (line 24) or parsed as empty variables.                                                         | `false` |
| `interpolationEnabled` | `boolean` | Should string interpolation evaluated for other environment variables or handled as literal strings.                          | `true`  |
| `overwriteExisting`    | `boolean` | Should the existing environment variable values be overwritten.                                                               | `false` |
| `environment`          | `string`  | The environment specific environment file to be loaded, if a folder is processed.                                             | -       |

All functions process the `.env` (or folder containing `.env` files) path and accept the configuration mentioned previously.
- If no path is passed to the function, the `.env` file in the current working directory will be processed
- If a path to an environment file is passed to the function, that environment file is processed
- If a path to a folder (that contains environment files) is passed to the function, all `.env*` files are processed, and the combined results are returned.
  The precedence of loading and combination is:
  1. Default environment file (`.env`), if it exists
  2. Environment specific environment file (e.g. `.env.development`), if set in the options and exists
  3. Local environment file (`.env.local`), if it exists

## Other

For detailed documentation see the [TypeDocs documentation](https://szikszail.github.io/dotenv-ng/).

This package uses [debug](https://www.npmjs.com/package/debug) for logging, use `dotenv-ng` to see debug logs:

```shell
DEBUG=dotenv-ng node my-script.js
```
