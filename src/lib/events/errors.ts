/* eslint-disable max-classes-per-file */
/* Above rule disabled for this file as this module is only suppose to contain
 * custom error types by extending `Error`.
 */

/**
 * Error to indicate an action is not being supported yet.
 * @public
 */
class ActionNotSupportedException extends Error {
  constructor(action: string) {
    const msg = `Action \`${action}\` is not yet supported`;

    super(msg);

    Object.setPrototypeOf(this, ActionNotSupportedException.prototype);
  }
}

/**
 * @internal
 */
class MaxListenerExceededException extends Error {
  constructor(event: string) {
    const msg = 'Number of listeners exceeded the maximum listeners allowed '
      + `for event ${event}`;

    super(msg);

    Object.setPrototypeOf(this, MaxListenerExceededException.prototype);
  }
}

export { ActionNotSupportedException, MaxListenerExceededException };
