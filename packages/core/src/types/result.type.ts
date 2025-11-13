export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

export function Ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function Err<T>(error: string, details?: unknown): Result<T> {
  return { success: false, error, details };
}

// Type guard to check if Result is an error
export function isErr<T>(
  result: Result<T>,
): result is { success: false; error: string; details?: unknown } {
  return !result.success;
}

// Type guard to check if Result is successful
export function isOk<T>(
  result: Result<T>,
): result is { success: true; data: T } {
  return result.success;
}

/**
 * Railway Oriented Programming - Chain operations on Result
 * If result is Ok, applies the function. If Err, short-circuits and returns the error.
 */
export function chain<T, U>(
  result: Result<T>,
  fn: (data: T) => Result<U>,
): Result<U> {
  if (!result.success) {
    return result;
  }
  return fn(result.data);
}

/**
 * Async version of chain for Promise-based operations
 */
export async function chainAsync<T, U>(
  result: Result<T> | Promise<Result<T>>,
  fn: (data: T) => Promise<Result<U>> | Result<U>,
): Promise<Result<U>> {
  const resolvedResult = await result;
  if (!resolvedResult.success) {
    return resolvedResult;
  }
  return fn(resolvedResult.data);
}

/**
 * Map over the data if Result is Ok, otherwise pass through the error
 */
export function map<T, U>(result: Result<T>, fn: (data: T) => U): Result<U> {
  if (!result.success) {
    return result;
  }
  return Ok(fn(result.data));
}

/**
 * Async version of map
 */
export async function mapAsync<T, U>(
  result: Result<T> | Promise<Result<T>>,
  fn: (data: T) => Promise<U> | U,
): Promise<Result<U>> {
  const resolvedResult = await result;
  if (!resolvedResult.success) {
    return resolvedResult;
  }
  const mappedData = await fn(resolvedResult.data);
  return Ok(mappedData);
}

/**
 * Execute a function with Result - catches exceptions and returns Result
 */
export function tryCatch<T>(fn: () => T): Result<T> {
  try {
    return Ok(fn());
  } catch (error: any) {
    return Err(error instanceof Error ? error.message : 'Unknown error', error);
  }
}

/**
 * Async version of tryCatch
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
): Promise<Result<T>> {
  try {
    return Ok(await fn());
  } catch (error: any) {
    return Err(error instanceof Error ? error.message : 'Unknown error', error);
  }
}
