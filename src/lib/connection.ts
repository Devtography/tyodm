import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBConfig, MongoDBConfig } from './config';
import { TyODM } from './odm';

const attachedODMs: Map<TyODM, DynamoDBConfig | MongoDBConfig> = new Map();

const dynamoClients: Map<string, DynamoDBClient> = new Map();

/**
 * Attach the {@link TyODM} object to the {@link DynamoDBClient} for database
 * actions. An existing {@link DynamoDBClient} will be returned if there's one
 * being used by other {@link TyODM} instance, an new instance will be
 * initialised if otherwise.
 * @param odm - The {@link TyODM} object to attach.
 * @param config - {@link DynamoDBConfig} for the target client.
 * @returns The correspond {@link DynamoDBClient} for database actions.
 */
function attachDynamoDBClient(
  odm: TyODM, config: DynamoDBConfig,
): DynamoDBClient {
  if (attachedODMs.has(odm)) {
    throw Error('ODM has already attached to a database client');
  }

  attachedODMs.set(odm, config);

  const target = JSON.stringify({
    region: config.region,
    endpoint: config.endpoint,
  });

  let client = dynamoClients.get(target);

  if (client === undefined) {
    const clientConfig = {
      region: config.region,
      endpoint: config.endpoint,
    };

    client = new DynamoDBClient(clientConfig);

    dynamoClients.set(target, client);
  }

  return client;
}

export { attachDynamoDBClient };
