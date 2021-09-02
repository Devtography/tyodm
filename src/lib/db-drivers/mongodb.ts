import { NotImplementedError } from '../../utils/errors';
import type { Obj } from '../object';
import type { Prop } from '../schema';
import { DBDriver } from './driver';

/**
 * @sealed
 * @internal
 */
class MongoDBDriver extends DBDriver {
  insertObj<T extends Obj>(_obj: T): void {
    throw new NotImplementedError(this.insertObj.name);
  }

  insertOne(
    _pk: string, _elm: Record<string, unknown>,
    _propName: string, _propLayout: Prop,
  ): void {
    throw new NotImplementedError(this.insertOne.name);
  }

  async commitWriteTransaction(): Promise<void> {
    throw new NotImplementedError(this.commitWriteTransaction.name);
  }

  cancelWriteTransaction(): void {
    throw new NotImplementedError(this.cancelWriteTransaction.name);
  }
}

export { MongoDBDriver };
