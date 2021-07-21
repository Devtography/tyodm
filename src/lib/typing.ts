type ScalarType = 'bool' | 'int' | 'double' | 'decimal' | 'string';

/**
 * Available field data types
 *
 * When specifying types in an {@link Schema}, you may append `?` to any of the
 * property types to indicate that it is optional. Given a type, *T*, the
 * following postfix operators may be used:
 * - *T*`[]` indicates that the property type is `Array<T>`
 * - *T*`<>` indicates that the property type is `Set<T>`
 *
 * For `Array<T>` & `Set<T>`, appending `?` (i.e. `int[]?`) is considered
 * invalid.
 *
 * @param {boolean} bool - Property value may either be `true` or `false`.
 * @param {number} int - Property value may be assigned any number, but will be
 * stored as a rounded integer, meaning anything after the decimal will be
 * truncated.
 * @param {number} double - Property may be assigned any number, but will be
 * stored as a 64bit floating point, which may result in a loss of precision.
 * @param {number} decimal - Property may be assigned any number, and will have
 * no loss of precision.
 * @param {string} string - Property value may be any arbitrary string.
 */
type PropType = `${ScalarType}${'?' | '[]' | '<>' | ''}`;

export { PropType };
