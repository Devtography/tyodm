import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { ulid } from 'ulid';
import { MockObj } from '../test-utils/mock-object';
import { DynamoDBConfig } from './config';
import { attachDynamoDBClient, detachDynamoDBClient } from './connection';
import { DBClientNotAttachedError } from './errors';
import { TyODM } from './odm';

const dynamoDBConfig: DynamoDBConfig = {
  region: 'us-west-1',
  endpoint: 'http://localhost:8000',
  table: 'default',
  schema: new Map([
    [MockObj.name, MockObj.SCHEMA],
  ]),
};

describe('function `attach` & `detach`', () => {
  it('should return true if ODM instance attached successfully', async () => {
    const odm = new TyODM(dynamoDBConfig);
    await odm.attach();

    expect(odm.attached).toBeTruthy();
  });

  it('should return true for ODM instance detached successfully', async () => {
    const odm = new TyODM(dynamoDBConfig);
    await odm.attach();

    expect(await odm.detach()).toBeTruthy();
  });

  it('should return false on attempt to detach an non-attached ODM instance',
    async () => {
      const odm = new TyODM(dynamoDBConfig);

      expect(await odm.detach()).toBeFalsy();
    });
});

describe('test with DynamoDB', () => {
  let odm: TyODM;
  let directAccessODM: TyODM;
  let client: DynamoDBClient;

  const objId = ulid();
  const colId1 = ulid();
  const colId2 = ulid();

  const obj = new MockObj(objId);
  obj.meta = { objName: 'mock', objRank: 1 };
  obj.row1 = { subObj: { prop1: [1, 2] } };
  obj.collection = new Map([
    [colId1, { collectionId: colId1, sampleSet: [1, 2] }],
    [colId2, { collectionId: colId2, sampleSet: [1, 2] }],
  ]);

  beforeAll(async () => {
    // Setup shared ODM instance.
    odm = new TyODM(dynamoDBConfig);
    await odm.attach();

    // Setup DynamoDB client for direct database access.
    directAccessODM = new TyODM(dynamoDBConfig);
    client = attachDynamoDBClient(directAccessODM);

    // Create table.
    await client.send(new CreateTableCommand({
      TableName: dynamoDBConfig.table,
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    }));
  });

  describe('functions for data retrieve from database', () => {
    const objId = ulid();
    const colId1 = ulid();
    const colId2 = ulid();

    beforeAll(async () => {
      // Put records.
      await client.send(new TransactWriteItemsCommand({
        TransactItems: [
          {
            Put: {
              Item: {
                pk: { S: `${MockObj.name}#${objId}` },
                sk: { S: 'meta' },
                objName: { S: 'mock' },
                objRank: { N: '1' },
              },
              TableName: dynamoDBConfig.table,
            },
          },
          {
            Put: {
              Item: {
                pk: { S: `${MockObj.name}#${objId}` },
                sk: { S: 'row1' },
                subObj: { M: { prop1: { SS: ['1', '2'] } } },
              },
              TableName: dynamoDBConfig.table,
            },
          },
          {
            Put: {
              Item: {
                pk: { S: `${MockObj.name}#${objId}` },
                sk: { S: `collection#${colId1}` },
                collectionId: { S: colId1 },
                sampleSet: { NS: ['1', '2'] },
              },
              TableName: dynamoDBConfig.table,
            },
          },
          {
            Put: {
              Item: {
                pk: { S: `${MockObj.name}#${objId}` },
                sk: { S: `collection#${colId2}` },
                collectionId: { S: colId2 },
                sampleSet: { NS: ['1', '2'] },
              },
              TableName: dynamoDBConfig.table,
            },
          },
        ],
      }));
    });

    describe('function `objectByKey`', () => {
      beforeAll(async () => {
        await odm.attach();
      });

      it('should return the expected `Obj` instance', async () => {
        await expect(odm.objectByKey(MockObj, objId)).resolves
          .not.toBeUndefined();
        await expect(odm.objectByKey(MockObj, objId)).resolves.toEqual(obj);
      });

      it('should return `undefined`', async () => {
        await expect(odm.objectByKey(MockObj, '1')).resolves.toBeUndefined();
      });

      it('should throw a `DBClientNotAttachedError`', async () => {
        await odm.detach();

        await expect(odm.objectByKey(MockObj, objId)).rejects
          .toThrow(DBClientNotAttachedError);
      });

      afterAll(async () => {
        await odm.detach();
      });
    });
    });
  });

  afterAll(async () => {
    await client.send(new DeleteTableCommand({
      TableName: dynamoDBConfig.table,
    }));
    detachDynamoDBClient(directAccessODM);
  });
});
