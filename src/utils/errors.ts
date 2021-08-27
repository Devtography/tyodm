/* eslint-disable max-classes-per-file */
/* Above rule disabled for this file as this module is only suppose to contain
 * custom error types by extending `Error`.
 */

class NotImplementedError extends Error {
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

export { NotImplementedError };
