/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NotImplementedError } from '../utils/errors';
import { DynamoDBConfig, MongoDBConfig } from './config';
import * as connection from './connection';
import type { PendingWriteAction } from './datatype/typings';
import * as db from './db-drivers';
import { DBClientNotAttachedError } from './errors';
import * as writeEvents from './events/db-write-events';
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
  private dbWriteQueue: Array<PendingWriteAction> = [];

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
   * Indicates if the instance is attached to the targeted database client.
   * @readonly
   */
  get attached(): boolean {
    return this.dbClient !== undefined;
  }

  /**
   * Attaches the {@link TyODM} instance to the targeted database client.
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
   * Detach the {@link TyODM} instance from the targeted database client
   * attached.
   * @returns `true` if detached successfully. `false` if instance specified
   * isn't attached or internal mapping failed.
   */
  async detach(): Promise<boolean> {
    let result = false;

    switch (this.mode) {
      case ODMMode.DynamoDB:
        result = this.detachFromDynamoDB();
        break;
      case ODMMode.MongoDB:
        result = await this.detachFromMongoDB();
        break;
      default:
        break;
    }

    return result;
  }

  /**
   * Scan the database for all records of {@link Obj} specified.
   * @param Type - Subclass of {@link Obj}.
   * @returns Collection {@link Results} of {@link Obj} specified.
   * @throws `Error` if data models specified is not part of the schema defined
   * in the config the {@link TyODM} instance initialised with.
   * @experimental
   */
  async objects<T extends Obj>(_Type: { new(): T }): Promise<Results<T>> {
    // const obj = new Type();

    // return new Results<T>(...[obj]);
    throw new NotImplementedError(this.objects.name);
  }

  /**
   * Find the object in database by its' unique identifier.
   * @param Type - Subclass of {@link Obj}.
   * @param key - Unique identifier of the target object.
   * @see {@link Obj#objectId} for the value of `key`.
   * @returns Instance of {@link Obj} or `undefined` if no object is found.
   * @throws {@link DBClientNotAttachedError}
   * Thrown if {@link TyODM} instance is not attached to the database
   * client.
   * @throws if data models specified is not part of the schema defined
   * in the config the {@link TyODM} instance initialised with.
   */
  async objectByKey<T extends Obj>(
    Type: { new(): T }, key: string,
  ): Promise<T | undefined> {
    if (!this.attached) { throw new DBClientNotAttachedError(); }

    return this.dbClient?.getObjById(key, Type);
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
    _Type: { new(): T }, _key: string,
    _prop: string | { name: string, key: string },
  ): Promise<T> {
    // const obj = new Type();

    // return obj;
    throw new NotImplementedError(this.partialObject.name);
  }

  /**
   * Synchronously call the provided `callback` inside a write transaction. If
   * an exception happens inside a transaction, you'll lose the changes in that
   * transaction, but the database itself won't be affected (or corrupted).
   *
   * Nested transactions (calling `write()` within `write()`) is not possible.
   * @param callback - function of transaction details.
   * @throws {@link DBClientNotAttachedError}
   * Thrown if {@link TyODM} instance is not attached to the database client.
   * @throws `Error` if exception happens when committing the transaction.
   */
  async write(callback: () => void): Promise<void> {
    if (!this.attached) { throw new DBClientNotAttachedError(); }
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
    // Register event handlers to handle the underlying operations.
    writeEvents.onInsertObjEvent((obj) => {
      this.dbClient?.insertObj(obj);
    });

    writeEvents.onInsertOneEvent((obj, toProp, val) => {
      this.insertOneEventHandler(obj, toProp, val);
    });

    writeEvents.onUpdateOneEvent((obj, toProp, identifier, val) => {
      this.updateOneEventHandler(obj, toProp, identifier, val);
    });

    writeEvents.onDeleteOneEvent((obj, targetProp, colId) => {
      this.deleteOneEventHandler(obj, targetProp, colId);
    });
  }

  private async commitTransaction(): Promise<void> {
    // return this.dbClient?.commitWriteTransaction();
    await this.dbClient?.commitWriteTransaction();
    // Reflects the changes into the corresponding object(s).
    this.updateObjects();

    this.postCommitTransaction();
  }

  private cancelTransaction(): void {
    // Clean the queue/map & unregister the event handler.
    this.dbClient?.cancelWriteTransaction();

    this.postCommitTransaction();
  }

  /**
   * Initial an `DynamoDBDriver` instance with `DynamoDBClient`.
   * @throws {@link connection#NotDynamoDBModeError}
   * Thrown if {@link TyODM#mode} isn't {@link ODMMode#DynamoDB}.
   */
  private attachToDynamoDB() {
    try {
      const client = connection.attachDynamoDBClient(this);
      const { table } = this.config as DynamoDBConfig;
      this.dbClient = new db.DynamoDBDriver(client, table);
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

  /**
   * Detach the `DynamoDBClient` attached with this instance.
   * @returns Detach result.
   */
  private detachFromDynamoDB(): boolean {
    const result = connection.detachDynamoDBClient(this);

    if (result) {
      this.dbClient = undefined;
    }

    return result;
  }

  /**
   * Detach the MongoDB client attached with this instance.
   * @returns Detach result.
   */
  private async detachFromMongoDB(): Promise<boolean> {
    this.dbClient = undefined;

    throw new NotImplementedError(this.detachFromDynamoDB.name);
  }

  private insertOneEventHandler(
    obj: Obj, toProp: string, val: Record<string, unknown>,
  ): void {
    this.dbWriteQueue.push({
      event: writeEvents.Event.InsertOne,
      value: { obj, toProp, val },
    });

    this.dbClient?.insertOne(
      `${obj.objectSchema().name}#${obj.objectId}`, val, toProp,
      obj.objectSchema().props[toProp],
    );
  }

  private updateOneEventHandler(
    obj: Obj, toProp: string, identifier: string | undefined,
    val: Record<string, unknown>,
  ): void {
    this.dbWriteQueue.push({
      event: writeEvents.Event.UpdateOne,
      value: {
        obj, toProp, identifier, val,
      },
    });

    if (identifier === undefined) {
      this.dbClient?.update(
        `${obj.objectSchema().name}#${obj.objectId}`, toProp,
        val, obj.objectSchema().props[toProp],
      );
    } else {
      this.dbClient?.update(
        `${obj.objectSchema().name}#${obj.objectId}`,
        `${toProp}#${identifier}`, val, obj.objectSchema().props[toProp],
      );
    }
  }

  private deleteOneEventHandler(
    obj: Obj, targetProp: string, identifier: string | undefined,
  ): void {
    this.dbWriteQueue.push({
      event: writeEvents.Event.DeleteOne,
      value: { obj, targetProp, identifier },
    });

    if (identifier !== undefined) {
      this.dbClient?.deleteOne(
        `${obj.objectSchema().name}#${obj.objectId}`,
        `${targetProp}#${identifier}`,
      );
    } else {
      this.dbClient?.deleteOne(`${obj.objectSchema().name}#${obj.objectId}`,
        targetProp);
    }
  }

  private updateObjects(): void {
    // No schema validation in this function. Relies on functions from
    // `DBDriver` called in pervious steps.
    this.dbWriteQueue.forEach((task) => {
      const { obj } = task.value as writeEvents.actions.Base;

      switch (task.event) {
        case (writeEvents.Event.InsertOne): {
          const { toProp, val } = task.value as
            writeEvents.actions.InsertOne;

          if (obj.objectSchema().props[toProp].type === 'single') {
            obj[toProp] = val;
          } else if (obj.objectSchema().props[toProp].type === 'collection') {
            if (obj[toProp] === undefined) { obj[toProp] = new Map(); }
            (obj[toProp] as Map<string, unknown>).set(
              val[obj.objectSchema().props[toProp].identifier!] as string,
              val,
            );
          }
          break;
        }
        case (writeEvents.Event.UpdateOne): {
          const { toProp, identifier, val } = task.value as
            writeEvents.actions.UpdateOne;

          let elm: Record<string, unknown> | undefined;

          if (identifier !== undefined) {
            elm = (obj[toProp] as Map<string, Record<string, unknown>>)
              .get(identifier);
          }

          Object.keys(val).forEach((key) => {
            if (identifier === undefined) {
              (obj[toProp] as Record<string, unknown>)[key] = val[key];
            } else { elm![key] = val[key]; }
          });
          break;
        }
        case (writeEvents.Event.DeleteOne): {
          const { targetProp, identifier } = task.value as
            writeEvents.actions.DeleteOne;

          if (obj.objectSchema().props[targetProp].type === 'single') {
            obj[targetProp] = undefined;
          } else if (obj.objectSchema().props[targetProp]
            .type === 'collection') {
            if ((obj[targetProp] as Map<string, unknown>).size === 1) {
              // Remove the entire map object if it only contains one record.
              obj[targetProp] = undefined;
            } else {
              (obj[targetProp] as Map<string, unknown>).delete(identifier!);
            }
          }
          break;
        }
        default: break;
      }
    });
  }

  private postCommitTransaction(): void {
    this.dbWriteQueue.length = 0;
    writeEvents.emitter.removeAllListeners();
  }
}

export default TyODM;
export { TyODM };
