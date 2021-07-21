import { Schema } from './schema';

/**
 * TyODM objects will automatically inherit from this class.
 */
abstract class Obj {
  /**
   * Returns the schema for the type this object belongs to.
   * @returns {ObjectSchema} the schema that describes this object.
   */
  abstract objectSchema(): Schema;
}

export { Obj };
