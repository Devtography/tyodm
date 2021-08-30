import {
  DynamoDBClient,
  TransactWriteItem,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { DBDriver } from './driver';
import { MaxWriteActionExceededException } from './errors';

/**
 * Class extending abstract class {@link DBDriver} for all database actions
 * with DynamoDB.
 * @sealed
 * @internal
 */
class DynamoDBDriver extends DBDriver {
  private readonly client: DynamoDBClient;
  private readonly table: string;
  private transactWriteItems: Array<TransactWriteItem> = [];

  constructor(client: DynamoDBClient, table: string) {
    super();

    this.client = client;
    this.table = table;
  }

  /**
   * Asynchronous function to commit the write transaction to the target
   * database.
   * @throws {@link MaxWriteActionExceededException}
   * Thrown if the number of write actions pending to write \> 25 as
   * transactional write operation of DynamoDB can only target up to 25
   * distinct items.
   */
  async commitWriteTransaction(): Promise<void> {
    if (this.transactWriteItems.length > 25) {
      throw new MaxWriteActionExceededException(
        this.transactWriteItems.length, 25,
      );
    }

    const command = new TransactWriteItemsCommand({
      TransactItems: this.transactWriteItems,
    });

    try {
      await this.client.send(command);
    } finally {
      this.transactWriteItems.length = 0; // resets the array.
    }

    return Promise.resolve();
  }
}

export { DynamoDBDriver };
