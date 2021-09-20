import type { Obj } from '../../object';

/**
 * @internal
 */
export interface Base {
  obj: Obj;
}

/**
 * @internal
 */
export interface InsertOne extends Base {
  toProp: string;
  val: Record<string, unknown>;
}

/**
 * @internal
 */
export interface UpdateOne extends Base {
  toProp: string;
  identifier?: string;
  val: Record<string, unknown>;
}

/**
 * @internal
 */
export interface DeleteOne extends Base {
  targetProp: string;
  identifier?: string;
}
