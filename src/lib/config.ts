import type { Schema } from './schema';

/**
 * @param {Set<Schema>} schema - Set of {@link Schema} suppose to be in the
 * DynamoDB table / MongoDB collection specified.
 */
interface BaseConfig {
  schema: Set<Schema>;
}

/**
 * @type {Object}
 * @param {string} region - AWS region.
 * @param {string?} endpoint - DynamoDB endpoint address.
 * @param {string} table - DynamoDB table to interact with.
 * @param {Set<Schema>} schema - Set of {@link Schema} supported in the table
 * specified.
 */
interface DynamoDBConfig extends BaseConfig {
  region: string;
  endpoint?: string;
  table: string;
}

/**
 * @type {Object}
 * @param {string} uri - MongoDB instance address.
 * @param {string} database - Database to access.
 * @param {string} collection - Collection to interact with.
 * @param {Set<Schema>} schema - Set of {@link Schema} supported in the
 * collection specified.
 */
interface MongoDBConfig extends BaseConfig {
  uri: string;
  database: string;
  collection: string;
}

export { DynamoDBConfig, MongoDBConfig };
