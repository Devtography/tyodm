import { NotImplementedError } from '../../utils/errors';
import type { Obj } from '../object';
import type { Prop } from '../schema';
import { DBDriver } from './driver';

/**
 * @sealed
 * @internal
 */
class MongoDBDriver extends DBDriver {
  async getObjById<T extends Obj>(
    _objId: string, _Type: { new(objId: string): T },
  ): Promise<T | undefined> {
    throw new NotImplementedError(this.getObjById.name);
  }

  insertObj<T extends Obj>(_obj: T): void {
    throw new NotImplementedError(this.insertObj.name);
  }

  insertOne(
    _pk: string, _elm: Record<string, unknown>,
    _propName: string, _propLayout: Prop,
  ): void {
    throw new NotImplementedError(this.insertOne.name);
  }

  deleteOne(_pk: string, _sk: string): void {
    throw new NotImplementedError(this.deleteOne.name);
  }

  async commitWriteTransaction(): Promise<void> {
    throw new NotImplementedError(this.commitWriteTransaction.name);
  }

  cancelWriteTransaction(): void {
    throw new NotImplementedError(this.cancelWriteTransaction.name);
  }
}

export { MongoDBDriver };
