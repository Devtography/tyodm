import { ulid } from 'ulid';
import * as writeEvents from './events/db-write-events';
import { Schema } from './schema';

/**
 * TyODM objects must inherit from this class.
 * @remarks
 * A static property of {@link Schema} should be provided by the subclass.
 * @public
 */
abstract class Obj {
  [key: string]: unknown; // to allow assigning `objId` to custom field.

  private readonly objId: string;

  constructor(objId?: string) {
    if (objId) {
      const { identifier } = this.objectSchema();
      if (identifier !== undefined) {
        this.objId = '_customId';
        // It's then user's responsibility to assign ID to custom field.
      } else { this.objId = objId; }
    } else {
      this.objId = this.objectSchema().identifier ? '_customId' : ulid();
    }
  }

  /**
   * Returns the schema for the type this object belongs to.
   * @returns The schema that describes this object.
   * @virtual
   */
  abstract objectSchema(): Schema;

  /**
   * The unique identifier of the object in database.
   * @sealed
   */
  get objectId(): string {
    if (this.objId === '_customId') {
      const key = this.objectSchema().identifier as keyof Obj;

      return this[key] as string;
    }

    return this.objId;
  }

  /**
   * Inserts the entire object to database.
   */
  insertObj(): void {
    writeEvents.insertObj(this);
  }

  /**
   * Inserts a record to the target property of this {@link Obj} instance.
   * @param toProp - Name of the target property. Must be one of the keys
   * defined in `objectSchema().props`.
   * @param val - Value(s) to be inserted.
   */
  insertRecord(toProp: string, val: Record<string, unknown>): void {
    writeEvents.insertOne(this, toProp, val);
  }

  /**
   * Updates the value(s) to the target property / record of this {@link Obj}
   * instance.
   * @param toProp - Name of the target property. Must be one of the keys
   * defined in `objectSchema().props`.
   * @param val - Value(s) to be updated.
   * @param identifier - Identifier of the target record if the property type
   * of the target property is `collection`.
   */
  updateRecord(
    toProp: string, val: Record<string, unknown>, identifier?: string,
  ): void {
    writeEvents.updateOne(this, toProp, identifier, val);
  }

  /**
   * Deletes the target property (or an item in target property if type of
   * target property is `collection`) of this {@link Obj} instance.
   * @param targetProp - Name of the target property. Must be one of the keys
   * defined in `objectSchema().props`.
   * @param identifier - Identifier of the target record if the property type
   * of the target property is `collection`.
   */
  deleteRecord(targetProp: string, identifier?: string): void {
    writeEvents.deleteOne(this, targetProp, identifier);
  }
}

export { Obj };
