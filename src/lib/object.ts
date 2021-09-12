import { ulid } from 'ulid';
import { Schema } from './schema';

/**
 * TyODM objects must inherit from this class.
 * @remarks
 * A static property of {@link Schema} should be provided by the subclass.
 * @public
 */
abstract class Obj {
  private readonly objId: string;

  constructor(objId?: string) {
    if (objId) {
      this.objId = objId;
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
}

export { Obj };
