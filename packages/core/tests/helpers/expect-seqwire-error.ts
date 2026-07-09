import { SeqWireError } from "../../src/errors/error";

import type { ErrorCode, ErrorPayload } from "../../src/errors/registry";

export function expectSeqWireError<C extends ErrorCode>(
  thrown: unknown,
  code: C,
): asserts thrown is SeqWireError<C> {
  if (!(thrown instanceof SeqWireError)) {
    throw new Error(`Expected SeqWireError<${code}>, got ${String(thrown)}`);
  }
  if (thrown.code !== code) {
    throw new Error(`Expected code ${code}, got ${String(thrown.code)}`);
  }
}

export function getDetails<C extends ErrorCode>(
  err: SeqWireError<C>,
): ErrorPayload<C> {
  return err.details;
}
