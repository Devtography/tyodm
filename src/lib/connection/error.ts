/* eslint-disable max-classes-per-file */
/* Above rule disabled for this file as this module is only suppose to contain
 * custom error types by extending `Error`.
 */

/**
 * Error to indicate the ODM in action is already attached to a database client.
 * @internal
 */
class ODMAttachedError extends Error {
  constructor(message?: string) {
    let msg = message;

    if (msg === undefined) {
      msg = 'Specified ODM instance has already attached to a database client';
    }

    super(msg);

    Object.setPrototypeOf(this, ODMAttachedError.prototype);
  }
}

/**
 * Error to indicate the ODM in action isn't configured to DynamoDB mode.
 * @internal
 */
class ODMNotDynamoDBModeError extends Error {
  constructor(message?: string) {
    let msg = message;

    if (msg === undefined) {
      msg = 'Specified ODM instance not suppose to attach with DynamoDBClient';
    }

    super(msg);

    Object.setPrototypeOf(this, ODMNotDynamoDBModeError.prototype);
  }
}

export { ODMNotDynamoDBModeError as NotDynamoDBModeError, ODMAttachedError };
