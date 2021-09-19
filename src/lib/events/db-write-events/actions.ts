import type { Obj } from '../../object';

/**
 * @internal
 */
export interface Base {
  obj: Obj;
}

/**
 * Data to be passed into queue for action of inserting entire {@link Obj}
 * object.
 * @internal
 */
export interface InsertOne extends Base {
  toProp: string;
  val: Record<string, unknown>;
}
