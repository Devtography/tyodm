import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DBDriver } from './driver';

/**
 * Class extending abstract class {@link DBDriver} for all database actions
 * with DynamoDB.
 * @sealed
 * @internal
 */
class DynamoDBDriver extends DBDriver {
  private client: DynamoDBClient;

  constructor(client: DynamoDBClient) {
    super();

    this.client = client;
  }
}

export { DynamoDBDriver };
