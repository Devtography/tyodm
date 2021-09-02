import type { Event as DbWriteEvent } from '../events/db-write-events';
import * as dbWriteActions from '../events/db-write-events/actions';
import type { Obj } from '../object';

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
 * @param bool - Property value may either be `true` or `false`.
 * @param int - Property value may be assigned any number, but will be stored
 * as a rounded integer, meaning anything after the decimal will be truncated.
 * @param double - Property may be assigned any number, but will be stored as a
 * 64bit floating point, which may result in a loss of precision.
 * @param decimal - Property may be assigned any number, and will have no loss
 * of precision.
 * @param string - Property value may be any arbitrary string.
 */
type PropType = `${ScalarType}${'?' | '[]' | '<>' | ''}`;

/**
 * Type for pending DB write actions to be stored in queue of the `TyOdm`
 * instance.
 * @internal
 */
type PendingWriteAction = {
  event: DbWriteEvent,
  value: dbWriteActions.InsertNewObj<Obj>,
};

export { PropType, PendingWriteAction };
