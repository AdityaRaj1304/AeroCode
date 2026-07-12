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
 * Executes code and testCode within a safe-ish new Function sandbox.
 * Injects `expect` into the scope.
 */
export function runTests(code: string, testCode: string): TestResult {
  try {
    const expectFunc = createExpectContext();
    
    // We construct a Function that receives 'expect' as an argument.
    // The code and testCode are combined inside the function body.
    const fn = new Function('expect', `
      // Inject user code
      ${code}
      
      // Inject test assertions
      ${testCode}
    `);

    fn(expectFunc);
    
    return { passed: true };
  } catch (error: any) {
    return {
      passed: false,
      stackTrace: error.stack || error.message || String(error),
    };
  }
}
