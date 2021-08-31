/* eslint-disable max-classes-per-file */
/* Above rule disabled for this file as this module is only suppose to contain
 * custom error types by extending `Error`.
 */

/**
 * Error to indicate the database client is not yet attached, thus no database
 * action can be performed.
 * @public
 */
export class DBClientNotAttachedError extends Error {
  constructor() {
    const msg = 'Database action can\'t be performed as '
      + 'database client is not attached';

    super(msg);

    Object.setPrototypeOf(this, DBClientNotAttachedError.prototype);
  }
}

/**
 * Error to indicate the data schema of an `Obj` instance does not match
 * the property/data of the instance itself.
 * @public
 */
export class SchemaNotMatchError extends Error {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, SchemaNotMatchError.prototype);
  }
}

/**
 * Error to indicate part(s) of the schema is invalid.
 * @public
 */
export class InvalidSchemaError extends Error {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, SchemaNotMatchError.prototype);
  }
}
