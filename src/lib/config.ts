import type { Schema } from './schema';

/**
 * @param schema - Map of {@link Schema} suppose to be in the
 * DynamoDB table / MongoDB collection specified. Keys should be the class names
 * of the corresponding model classes.
 * @internal
 */
interface BaseConfig {
  schema: Map<string, Schema>;
}

/**
 * {@inheritDoc BaseConfig}
 * @param region - AWS region.
 * @param endpoint - DynamoDB endpoint address.
 * @param table - DynamoDB table to interact with.
 */
interface DynamoDBConfig extends BaseConfig {
  region: string;
  endpoint?: string;
  table: string;
}

/**
 * {@inheritDoc BaseConfig}
 * @param uri - MongoDB instance address.
 * @param database - Database to access.
 * @param collection - Collection to interact with.
 */
interface MongoDBConfig extends BaseConfig {
  uri: string;
  database: string;
  collection: string;
}

export { DynamoDBConfig, MongoDBConfig };
