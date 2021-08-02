import { DynamoDBConfig, MongoDBConfig } from './config';
import { Obj } from './object';
import { Results } from './results';

enum ODMMode {
  DynamoDB,
  MongoDB,
}

class TyODM {
  readonly mode: ODMMode;
  readonly config: DynamoDBConfig | MongoDBConfig;

  constructor(config: DynamoDBConfig | MongoDBConfig) {
    this.config = config;

    if (Object.prototype.hasOwnProperty.call(this.config, 'uri')) {
      this.mode = ODMMode.MongoDB;
    } else {
      this.mode = ODMMode.DynamoDB;
    }
  }

  async objects<T extends Obj>(Type: { new(): T }): Promise<Results<T>> {
    const obj = new Type();

    return new Results<T>(...[obj]);
  }

  async objectByKey<T extends Obj>(
    Type: { new(): T }, key: string,
  ): Promise<T | undefined> {
    const obj = new Type();

    return obj;
  }

  async partialObject<T extends Obj>(
    Type: { new(): T }, key: string,
    prop: string | { name: string, key: string },
  ): Promise<T> {
    const obj = new Type();

    return obj;
  }

  async write(callback: () => void): Promise<void> {
    this.beginTransaction();

    try {
      callback();
      await this.commitTransaction();
    } catch (err) {
      this.cancelTransaction();

      throw err;
    }

    return Promise.resolve();
  }

  private beginTransaction(): void {
    // Start a queue/map ready to save the action.
    // Register an event handler to understand the underlying operations.
  }

  private async commitTransaction(): Promise<void> {
    // Read the queue/map and form the transactional write action
    // based on items stored in the queue/map.
    return Promise.resolve();
  }

  private cancelTransaction(): void {
    // Clean the queue/map & unregister the event handler.
  }
}

export default TyODM;
export { TyODM };
