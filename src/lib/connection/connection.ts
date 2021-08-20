import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBConfig, MongoDBConfig } from '../config';
import type { TyODM } from '../odm';
import { ODMMode } from '../odm-mode';
import * as err from './error';

const attachedODMs: Map<TyODM, DynamoDBConfig | MongoDBConfig> = new Map();

const dynamoClients: Map<string, DynamoDBClient> = new Map();

/**
 * Attach the {@link TyODM} object to the {@link DynamoDBClient} for database
 * actions. An existing {@link DynamoDBClient} will be returned if there's one
 * being used by other {@link TyODM} instance, an new instance will be
 * initialised if otherwise.
 * @param odm - The {@link TyODM} object to attach.
 * @returns The correspond {@link DynamoDBClient} for database actions.
 * @throws {@link err#NotDynamoDBModeError}
 * Thrown if {@link TyODM#mode} of the odm instance passed in isn't
 * {@link ODMMode#DynamoDB}.
 * @throws {@link err#ODMAttachedError}
 * Throw if {@link TyODM} instance passed in has already mapped to a database
 * client.
 * @internal
 */
function attachDynamoDBClient(odm: TyODM): DynamoDBClient {
  if (odm.mode !== ODMMode.DynamoDB) {
    throw new err.NotDynamoDBModeError();
  }

  if (attachedODMs.has(odm)) {
    throw new err.ODMAttachedError();
  }

  const config = odm.config as DynamoDBConfig;

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
