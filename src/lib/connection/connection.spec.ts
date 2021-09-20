import { DynamoDBConfig, MongoDBConfig } from '../config';
import { TyODM } from '../odm';
import * as connection from './connection';
import * as err from './errors';

const dynamoDBConfig: DynamoDBConfig = {
  region: 'us-west-1',
  table: 'default',
  schema: new Map(),
};

const mongoDBConfig: MongoDBConfig = {
  uri: 'localhost',
  database: 'default',
  collection: 'default',
  schema: new Map(),
};

describe('function `attachDynamoDBClient`', () => {
  it('should return the same `DynamoDBClient`', () => {
    const config2: DynamoDBConfig = {
      region: 'us-west-1',
      table: 'default-2',
      schema: new Map(),
    };

    const odm1 = new TyODM(dynamoDBConfig);
    const odm2 = new TyODM(config2);

    const client1 = connection.attachDynamoDBClient(odm1);
    const client2 = connection.attachDynamoDBClient(odm2);

    expect(client1).toEqual(client2);
  });

  it('should return 2 different `DynamoDBClient`', () => {
    const config2: DynamoDBConfig = {
      region: 'us-west-2',
      table: 'default',
      schema: new Map(),
    };

    const odm1 = new TyODM(dynamoDBConfig);
    const odm2 = new TyODM(config2);

    const client1 = connection.attachDynamoDBClient(odm1);
    const client2 = connection.attachDynamoDBClient(odm2);

    expect(client1).not.toEqual(client2);
  });

  it('should throw error if `ODMMode` isn\'t `DynamoDB`', () => {
    const odm = new TyODM(mongoDBConfig);

    expect(() => { connection.attachDynamoDBClient(odm); })
      .toThrow(err.NotDynamoDBModeError);
  });

  it('should throw error if `TyODM` instance is mapped to a client', () => {
    const odm = new TyODM(dynamoDBConfig);
    connection.attachDynamoDBClient(odm);

    expect(() => { connection.attachDynamoDBClient(odm); })
      .toThrow(err.ODMAttachedError);
  });
});

describe('function `detachDynamoDBClient`', () => {
  it('should return true as ODM detached with `DynamoDBClient` removed',
    () => {
      const odm = new TyODM(dynamoDBConfig);
      connection.attachDynamoDBClient(odm);

      expect(connection.detachDynamoDBClient(odm)).toBeTruthy();
    });

  it('should return true as ODM detached but `DynamoDBClient` remains for '
    + 'other ODM instance.',
  () => {
    const odm1 = new TyODM(dynamoDBConfig);
    const odm2 = new TyODM(dynamoDBConfig);

    connection.attachDynamoDBClient(odm1);
    connection.attachDynamoDBClient(odm2);

    expect(connection.detachDynamoDBClient(odm1)).toBeTruthy();
  });

  it('should throw error if `ODMMode` isn\'t `DynamoDB`', () => {
    const odm = new TyODM(mongoDBConfig);

    expect(() => { connection.detachDynamoDBClient(odm); })
      .toThrow(err.NotDynamoDBModeError);
  });

  it('should return false if the targetted ODM is not attached', () => {
    const odm = new TyODM(dynamoDBConfig);

    expect(connection.detachDynamoDBClient(odm)).toBeFalsy();
  });
});
