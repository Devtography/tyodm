import { ulid } from 'ulid';
import { Schema } from './schema';

/**
 * TyODM objects will automatically inherit from this class.
 * @public
 */
abstract class Obj {
  private readonly objId: string;

  constructor() {
    this.objId = this.objectSchema().identifier ? '_customId' : ulid();
  }

  /**
   * Returns the schema for the type this object belongs to.
   * @returns {ObjectSchema} the schema that describes this object.
   */
  abstract objectSchema(): Schema;

  /**
   * The unique identifier of the object in database.
   * @public
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
