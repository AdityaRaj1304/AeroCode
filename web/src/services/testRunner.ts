// ============================================================
// AeroCode Web — In-Browser Test Evaluator
// ============================================================
// Safely executes user code against provided unit tests using
// a lightweight sandboxed expect() utility.
// ============================================================

export interface TestResult {
  passed: boolean;
  stackTrace?: string;
}

/**
 * Creates a lightweight expect() assertion utility.
 */
function createExpectContext() {
  return function expect(actual: any) {
    return {
      toEqual: (expected: any) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Assertion failed: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
      },
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Assertion failed: expected ${expected} (strictly) but got ${actual}`);
        }
      },
      toBeDefined: () => {
        if (typeof actual === 'undefined') {
          throw new Error(`Assertion failed: expected value to be defined`);
        }
      },
      toBeNull: () => {
        if (actual !== null) {
          throw new Error(`Assertion failed: expected value to be null but got ${actual}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Assertion failed: expected truthy value but got ${actual}`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Assertion failed: expected falsy value but got ${actual}`);
        }
      },
    };
  };
}

/**
 * Cleans ES6 import/export statements and other module boilerplate
 * to ensure raw code can run inside a standard new Function constructor.
 */
function cleanCodeForSandbox(code: string): string {
  return code
    // Strip ES6 default exports: "export default function foo" -> "function foo"
    .replace(/^\s*export\s+default\s+/gm, '')
    // Strip ES6 named exports declarations: "export function foo" -> "function foo"
    .replace(/^\s*export\s+(function|const|let|var|class)\s+/gm, '$1 ')
    // Strip ES6 export lists: "export { foo, bar };"
    .replace(/^\s*export\s*\{[\s\S]*?\}\s*;?/gm, '')
    // Strip ES6 import statements
    .replace(/^\s*import\s+[\s\S]*?\s+from\s+['"].*?['"];?/gm, '')
    // Strip raw require calls: "require('lodash');"
    .replace(/^\s*require\s*\(.*?\)\s*;?/gm, '');
}

/**
 * Executes code and testCode within a safe-ish new Function sandbox.
 * Injects `expect`, `module`, and `exports` into the scope.
 */
export function runTests(code: string, testCode: string): TestResult {
  try {
    const expectFunc = createExpectContext();
    const cleanedCode = cleanCodeForSandbox(code);
    
    // We construct a Function that receives 'expect', 'module', and 'exports' as arguments.
    // The code and testCode are combined inside the function body.
    const fn = new Function('expect', 'module', 'exports', `
      // Inject user code
      ${cleanedCode}
      
      // Inject test assertions
      ${testCode}
    `);

    const mockModule = { exports: {} };
    fn(expectFunc, mockModule, mockModule.exports);
    
    return { passed: true };
  } catch (error: any) {
    return {
      passed: false,
      stackTrace: error.stack || error.message || String(error),
    };
  }
}
