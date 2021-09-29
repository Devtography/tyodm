import type { Obj } from '../object';
import type { Prop } from '../schema';

/**
 * Abstract class of database client for database actions.
 * @internal
 */
abstract class DBDriver {
  /**
   * Retrieve all records of a TyODM object by it's identifier.
   * @param objId - Unique identifier of the target object.
   * @param Type - Type of the target TyODM object.
   * @returns TyODM object filled with associated records, or `undefined` if
   * no relevant record found.
   * @throws `NonCompatibleDBRecordError`
   * Thrown if the database record(s) retrieve is/are not in compatible format
   * to TyODM.
   */
  abstract getObjById<T extends Obj>(
    objId: string, Type: { new(objId: string): T },
  ): Promise<T | undefined>;

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
   * @throws `NaNError`
   * Thrown if any value of the `decimal` types data (including set & array) is
   * not a number.
   * @virtual
   */
  abstract insertObj<T extends Obj>(obj: T): void;

  /**
   * Prepare the data from the data element entry to ready for the write
   * transaction to be committed to the database.
   * @param pk - Partition key of the data to write into database.
   * @param elm - Data element to write.
   * @param propName - Name of the property the data element belongs to / under.
   * @param propLayout - Schema of the property / `elm` object.
   * @throws `InvalidSchemaError`
   * Thrown if `type` of any property is neither `'single'` nor `'collection'`,
   * or value of `identifier` is missing for type `'collection'`.
   * @throws `NaNError`
   * Thrown if any value of the `decimal` types data (including set & array) is
   * not a number.
   * @virtual
   */
  abstract insertOne(
    pk: string, elm: Record<string, unknown>,
    propName: string, propLayout: Prop,
  ): void;

  /**
   * Prepare the data from data passed in to ready for the write transaction
   * of update action to be committed to the database.
   * @param pk - Partition key of the target record.
   * @param sk - Sort key of the target record.
   * @param val - new value(s) to assign to the target record.
   * @param propSchema - Schema of the property to be updated.
   * @virtual
   */
  abstract update(
    pk: string, sk: string,
    val: Record<string, unknown>,
    propSchema: Prop,
  ): void;

  /**
   * Prepare the delete action by using the `pk` & `sk` to ready for the write
   * transaction to be committed to the database.
   * @param pk - Partition key of the target item.
   * @param sk - Sort key of the target item.
   */
  abstract deleteOne(pk: string, sk: string): void;

  /**
   * Asynchronous function to commit the write transaction to the target
   * database.
   * @throws `MaxWriteActionExceededException`
   * Thrown if the number of write actions pending to write exceeded the maximum
   * allowed actions in a single transaction.
   * @virtual
   */
  abstract commitWriteTransaction(): Promise<void>;

  /**
   * Cancels the write transaction.
   */
  abstract cancelWriteTransaction(): void;
}

export { DBDriver };
