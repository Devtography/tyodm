/**
 * Abstract class of database client for database actions.
 * @internal
 */
abstract class DBDriver {
  /**
   * Asynchronous function to commit the write transaction to the target
   * database.
   * @throws `MaxWriteActionExceededException`
   * Thrown if the number of write actions pending to write exceeded the maximum
   * allowed actions in a single transaction.
   * @virtual
   */
  abstract commitWriteTransaction(): Promise<void>;
}

export { DBDriver };
