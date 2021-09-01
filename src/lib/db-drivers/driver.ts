import type { Obj } from '../object';

/**
 * Abstract class of database client for database actions.
 * @internal
 */
abstract class DBDriver {
  /**
   * Process the entire TyODM object to prepare the data for being write into
   * the targeted database.
   * @param obj - TyODM data object to insert ot the database.
   * @throws `SchemaNotMatchError`
   * Thrown if the schema defined for the object doesn't appear to completely
   * matches the properties found in the object.
   * @throws `InvalidSchemaError`
   * Thrown if `type` of any property is neither `'single'` nor `'collection'`,
   * or value of `identifier` is missing for type `'collection'`.
   * @throws `InvalidPropertyError`
   * Thrown if any of the top level class property found other than the
   * identifier defined isn't an object.
   * @virtual
   */
  abstract insertObj<T extends Obj>(obj: T): void;

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
