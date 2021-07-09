type BaseType = 'bool' | 'int' | 'double' | 'string';

/**
 * Available field data types
 *
 * When specifying property types in an {@link ObjectSchema}, you may append `?`
 * to any of the property types to indicate that it is optional. Given a type,
 * *T*, the following postfix operators may be used:
 * - *T*`[]` indicates that the property type is `Array<T>`
 * - *T*`<>` indicates that the property type is `Set<T>`
 *
 * For `Array<T>` & `Set<T>`, appending `?` (i.e. `int?[]`) is considered
 * invalid.
 *
 * @param {boolean} bool - Property value may either be `true` or `false`.
 * @param {number} int - Property may be assigned any number, but will be
 * stored as a round integer, meaning anything after the decimal will be
 * truncated.
 * @param {number} double - Property may be assigned any number, and will have
 * no loss of precision.
 * @param {string} string - Property value may be any arbitrary string.
 * @param {Date} date - Property may be assigned any `Date` instance.
 */
type PropertyType = `${BaseType}${'?' | '[]' | '<>' | ''}` | 'date';

type DataType = boolean | number | string;
type CollectionType = Array<DataType> | Set<DataType>;

/**
 * @type {Object}
 * @param {PropertyType} type - The type of this property.
 * @param {DataType | CollectionType} [default] - The default value for this
 * property on creation when not otherwise specified.
 */
interface ObjectSchemaProperty {
  type: PropertyType;
  default?: DataType | CollectionType;
}

interface PropertiesTypes {
  [key: string]: PropertyType | ObjectSchemaProperty | ObjectSchema;
}

/**
 * @type {Object}
 * @param {string} name - Represents the object type.
 * @param {string} [primaryKey] - The name of a `'string'` or `'int'` property
 * that must be unique across all objects of this type within the same table.
 * @param {{[key: string]: PropertyType | ObjectSchemaProperty | ObjectSchema}} property -
 * An object where the keys are the property names and the values represent the
 * property type.
 */
interface ObjectSchema {
  name: string;
  primaryKey?: string;
  property: PropertiesTypes;
}

export { PropertyType, ObjectSchemaProperty, ObjectSchema };
