/* eslint-disable max-classes-per-file */
/* Above rule disabled for this file as this module is only suppose to contain
 * custom error types by extending `Error`.
 */

/**
 * Error to indicate an action is not being supported yet.
 * @public
 */
export class ActionNotSupportedError extends Error {
  constructor(action: string) {
    const msg = `Action \`${action}\` is not yet supported`;

    super(msg);

    Object.setPrototypeOf(this, ActionNotSupportedError.prototype);
  }
}

/**
 * @internal
 */
export class MaxListenerExceededError extends Error {
  constructor(event: string) {
    const msg = 'Number of listeners exceeded the maximum listeners allowed '
      + `for event ${event}`;

    super(msg);

    Object.setPrototypeOf(this, MaxListenerExceededError.prototype);
  }
}
