import { NotImplementedError } from '../utils/errors';
import { DynamoDBConfig, MongoDBConfig } from './config';
import * as connection from './connection';
import * as db from './db-drivers';
import { Obj } from './object';
import { ODMMode } from './odm-mode';
import { Results } from './results';

/**
 * A `TyODM` instance represents a database.
 * @sealed
 * @public
 */
class TyODM {
  /**
   * Indicates which type of database is this instance representing.
   * @readonly
   */
  readonly mode: ODMMode;
  /**
   * The config used to initialise this instance.
   * @readonly
   */
  readonly config: DynamoDBConfig | MongoDBConfig;

  private dbClient?: db.DBDriver;

  /**
   * {@link TyODM} constructor.
   * @remarks
   * Only one `TyODM` should be initialised for each database. Multiple
   * connections to the same database will be created if otherwise.
   * @param config - See {@link DynamoDBConfig} or {@link MongoDBConfig} doc.
   */
  constructor(config: DynamoDBConfig | MongoDBConfig) {
    this.config = config;

    if (Object.prototype.hasOwnProperty.call(this.config, 'uri')) {
      this.mode = ODMMode.MongoDB;
    } else {
      this.mode = ODMMode.DynamoDB;
    }
  }

  /**
   * Attaches the {@link TyODM} instance to the underlying remote database.
   * @returns Resolved {@link Promise}
   */
  async attach(): Promise<void> {
    switch (this.mode) {
      case ODMMode.DynamoDB:
        this.attachToDynamoDB();
        break;
      case ODMMode.MongoDB:
        await this.attachToMongoDB();
        break;
      default:
        break;
    }

    return Promise.resolve();
  }

  /**
   * Scan the database for all records of {@link Obj} specified.
   * @param Type - Subclass of {@link Obj}.
   * @returns Collection {@link Results} of {@link Obj} specified.
   * @throws `Error` if data models specified is not part of the schema defined
   * in the config the {@link TyODM} instance initialised with.
   */
  async objects<T extends Obj>(Type: { new(): T }): Promise<Results<T>> {
    const obj = new Type();

    return new Results<T>(...[obj]);
  }

  /**
   * Find the object in database by its' unique identifier.
   * @param Type - Subclass of {@link Obj}.
   * @param key - Unique identifier of the target object.
   * @see {@link Obj#objectId} for the value of `key`.
   * @returns Instance of {@link Obj} or `undefined` if no object is found.
   * @Throws `Error` if data models specified is not part of the schema defined
   * in the config the {@link TyODM} instance initialised with.
   */
  async objectByKey<T extends Obj>(
    Type: { new(): T }, key: string,
  ): Promise<T | undefined> {
    const obj = new Type();

    return obj;
  }

  /**
   * Query the exact item of record in database by object's unique identifier
   * and the target property.
   * @param Type - Subclass of {@link Obj}.
   * @param key - Unique identifier of the target object.
   * @param prop - The target property to query from the `Type` specified.
   * @returns The query result.
   * @experimental
   */
  async partialObject<T extends Obj>(
    Type: { new(): T }, key: string,
    prop: string | { name: string, key: string },
  ): Promise<T> {
    const obj = new Type();

    return obj;
  }

  /**
   * Synchronously call the provided `callback` inside a write transaction. If
   * an exception happens inside a transaction, you'll lose the changes in that
   * transaction, but the database itself won't be affected (or corrupted).
   *
   * Nested transactions (calling `write()` within `write()`) is not possible.
   * @param callback - function of transaction details.
   * @throws `Error` if exception happens when committing the transaction.
   */
  async write(callback: () => void): Promise<void> {
    this.beginTransaction();

    try {
      callback();
      await this.commitTransaction();
    } catch (err) {
      this.cancelTransaction();

      throw err;
    }

    return Promise.resolve();
  }

  private beginTransaction(): void {
    // Start a queue/map ready to save the action.
    // Register an event handler to understand the underlying operations.
  }

  private async commitTransaction(): Promise<void> {
    // Read the queue/map and form the transactional write action
    // based on items stored in the queue/map.
    return Promise.resolve();
  }

  private cancelTransaction(): void {
    // Clean the queue/map & unregister the event handler.
  }

  /**
   * Initial an `DynamoDBDriver` instance with `DynamoDBClient`.
   * @throws {@link connection#NotDynamoDBModeError}
   * Thrown if {@link TyODM#mode} isn't {@link ODMMode#DynamoDB}.
   */
  private attachToDynamoDB() {
    try {
      const client = connection.attachDynamoDBClient(this);
      this.dbClient = new db.DynamoDBDriver(client);
    } catch (err) {
      if (err instanceof connection.NotDynamoDBModeError) {
        throw err;
      }
    }
  }

  /**
   * Initial on `MongoDBDriver` instance.
   * @throws {@link NotImplementedError}
   * Thrown if the function is called.
   */
  private async attachToMongoDB(): Promise<void> {
    this.dbClient = new db.MongoDBDriver();

    throw new NotImplementedError(this.attachToMongoDB.name);
  }
}

export default TyODM;
export { TyODM };
