import { ObjectSchema } from './schema';

/**
 * TyODM objects will automatically inherit from this class.
 */
abstract class Obj {
  /**
   * @returns An array of the names of the object's properties.
   */
  keys(): string[] {
    return Object.keys(this.objectSchema().props);
  }

  /**
   * Returns the schema for the type this object belongs to.
   * @returns {ObjectSchema} the schema that describes this object.
   */
  abstract objectSchema(): ObjectSchema;
}

export { Obj };
