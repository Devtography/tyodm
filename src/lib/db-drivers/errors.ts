/* eslint-disable max-classes-per-file */
/* Above rule disabled for this file as this module is only suppose to contain
 * custom error types by extending `Error`.
 */

/**
 * Error to indicate the number of write actions exceeded the maximum allowed
 * actions in a single transaction.
 * @public
 */
export class MaxWriteActionExceededError extends Error {
  constructor(actions: number, maxAllowed: number) {
    const message = `${actions} actions included in the transaction. `
      + `The maximum allowed actions in a single transaction is ${maxAllowed}.`;

    super(message);

    Object.setPrototypeOf(this, MaxWriteActionExceededError.prototype);
  }
}

/**
 * Error to indicate the database record(s) retrieve is not compatible with
 * TyODM.
 * @internal
 */
export class NonCompatibleDBRecordError extends Error {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, NonCompatibleDBRecordError.prototype);
  }
}
