import { NotImplementedError } from '../../utils/errors';
import { DBDriver } from './driver';

/**
 * @sealed
 * @internal
 */
class MongoDBDriver extends DBDriver {
  async commitWriteTransaction(): Promise<void> {
    throw new NotImplementedError(this.commitWriteTransaction.name);
  }
}

export { MongoDBDriver };
