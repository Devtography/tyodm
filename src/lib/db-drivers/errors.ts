/**
 * Error to indicate the number of write actions exceeded the maximum allowed
 * actions in a single transaction.
 * @public
 */
class MaxWriteActionExceededError extends Error {
  constructor(actions: number, maxAllowed: number) {
    const message = `${actions} actions included in the transaction. `
      + `The maximum allowed actions in a single transaction is ${maxAllowed}.`;

    super(message);

    Object.setPrototypeOf(this, MaxWriteActionExceededError.prototype);
  }
}

export { MaxWriteActionExceededError };
