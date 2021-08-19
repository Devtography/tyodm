import { DynamoDBConfig } from './config';
import * as Connection from './connection';
import { TyODM } from './odm';

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

  const client1 = Connection.attachDynamoDBClient(odm1, config1);
  const client2 = Connection.attachDynamoDBClient(odm2, config2);

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

  const client1 = Connection.attachDynamoDBClient(odm1, config1);
  const client2 = Connection.attachDynamoDBClient(odm2, config2);

  expect(client1).not.toEqual(client2);
});

it('should throw error if TyODM instance is mapped to a client', () => {
  const config: DynamoDBConfig = {
    region: 'us-west-1',
    table: 'default',
    schema: new Map(),
  };

  const odm = new TyODM(config);
  Connection.attachDynamoDBClient(odm, config);

  expect(() => { Connection.attachDynamoDBClient(odm, config); }).toThrow();
});
