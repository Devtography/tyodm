/* eslint-disable max-classes-per-file */
/* Above rule disabled for this file as this module is only suppose to contain
 * custom error types by extending `Error`.
 */

export class NotImplementedError extends Error {
  constructor(func?: string) {
    let msg = func;

    if (msg === undefined) {
      msg = 'Function called in not yet implemented';
    } else {
      msg = `Function ${msg} is not yet implemented`;
    }

    super(msg);

    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}

/**
 * Error to indicate the property in question is invalid to the process.
 * @public
 */
export class InvalidPropertyError extends Error {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, InvalidPropertyError.prototype);
  }
}

/**
 * Error to indicate the value is not a number.
 * @public
 */
export class NaNError extends Error {
  constructor(value?: string) {
    let msg: string | undefined;

    if (value !== undefined) {
      msg = `${value} is not a number`;
    }

    super(msg);

    Object.setPrototypeOf(this, NaNError.prototype);
  }
}
