import type { Obj } from '../../object';

/**
 * Data to be passed into queue for action of inserting entire {@link Obj}
 * object.
 * @internal
 */
interface InsertNewObj<T extends Obj> {
  obj: Obj,
  ObjType: { new(): T },
}

export { InsertNewObj };
