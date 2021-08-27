/**
 * Error to indicate the database client is not yet attached, thus no database
 * action can be performed.
 * @public
 */
class DBClientNotAttachedError extends Error {
  constructor() {
    const msg = 'Database action can\'t be performed as '
      + 'database client is not attached';

    super(msg);

    Object.setPrototypeOf(this, DBClientNotAttachedError.prototype);
  }
}

export { DBClientNotAttachedError };
