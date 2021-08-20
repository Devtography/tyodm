import { DynamoDBConfig, MongoDBConfig } from '../config';
import { TyODM } from '../odm';
import * as connection from './connection';
import * as err from './error';

it('should return the same DynamoDBClient', () => {
  const config1: DynamoDBConfig = {
    region: 'us-west-1',
    table: 'default-1',
    schema: new Map(),
  };

  const config2: DynamoDBConfig = {
    region: 'us-west-1',
    table: 'default-2',
    schema: new Map(),
  };

  const odm1 = new TyODM(config1);
  const odm2 = new TyODM(config2);

  const client1 = connection.attachDynamoDBClient(odm1);
  const client2 = connection.attachDynamoDBClient(odm2);

  expect(client1).toEqual(client2);
});

it('should return 2 different DynamoDBClient', () => {
  const config1: DynamoDBConfig = {
    region: 'us-west-1',
    table: 'default',
    schema: new Map(),
  };

  const config2: DynamoDBConfig = {
    region: 'us-west-2',
    table: 'default',
    schema: new Map(),
  };

  const odm1 = new TyODM(config1);
  const odm2 = new TyODM(config2);

  const client1 = connection.attachDynamoDBClient(odm1);
  const client2 = connection.attachDynamoDBClient(odm2);

  expect(client1).not.toEqual(client2);
});

it('should throw error if `ODMMode` isn\'t `DynamoDB`', () => {
  const config: MongoDBConfig = {
    uri: 'localhost',
    database: 'default',
    collection: 'default',
    schema: new Map(),
  };

  const odm = new TyODM(config);

  expect(() => { connection.attachDynamoDBClient(odm); })
    .toThrow(err.NotDynamoDBModeError);
});

it('should throw error if TyODM instance is mapped to a client', () => {
  const config: DynamoDBConfig = {
    region: 'us-west-1',
    table: 'default',
    schema: new Map(),
  };

  const odm = new TyODM(config);
  connection.attachDynamoDBClient(odm);

  expect(() => { connection.attachDynamoDBClient(odm); })
    .toThrow(err.ODMAttachedError);
});
