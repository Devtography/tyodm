/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  TransactWriteItem,
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

const objId = ulid();
const colId1 = ulid();
const colId2 = ulid();

const commonObj = new MockObj(objId);
commonObj.meta = { objName: 'mock', objRank: 1 };
commonObj.row1 = { subObj: { prop1: [1, 2] } };
commonObj.collection = new Map([
  [colId1, { collectionId: colId1, sampleSet: [1, 2] }],
  [colId2, { collectionId: colId2, sampleSet: [1, 2] }],
]);

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

  async function putCommonObj(): Promise<void> {
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
              subObj: { M: { prop1: { L: [{ S: '1' }, { S: '2' }] } } },
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
              sampleSet: { L: [{ N: '1' }, { N: '2' }] },
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
              sampleSet: { L: [{ N: '1' }, { N: '2' }] },
            },
            TableName: dynamoDBConfig.table,
          },
        },
      ],
    }));
  }

  async function deleteCommonObj(): Promise<void> {
    const writeItems: TransactWriteItem[] = [
      {
        Delete: {
          Key: {
            pk: { S: `${commonObj.objectSchema().name}#${objId}` },
            sk: { S: 'meta' },
          },
          TableName: dynamoDBConfig.table,
        },
      },
      {
        Delete: {
          Key: {
            pk: { S: `${commonObj.objectSchema().name}#${objId}` },
            sk: { S: 'row1' },
          },
          TableName: dynamoDBConfig.table,
        },
      },
    ];

    Array.from(commonObj.collection!.keys()).forEach((key) => {
      writeItems.push({
        Delete: {
          Key: {
            pk: { S: `${commonObj.objectSchema().name}#${objId}` },
            sk: { S: `collection#${key}` },
          },
          TableName: dynamoDBConfig.table,
        },
      });
    });

    await client.send(new TransactWriteItemsCommand({
      TransactItems: writeItems,
    }));
  }

  beforeAll(async () => {
    // Setup shared ODM instance.
    odm = new TyODM(dynamoDBConfig);

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
    beforeAll(async () => {
      await odm.attach();
      await putCommonObj();
    });

    describe('function `objectByKey`', () => {
      beforeAll(async () => {
        await odm.attach();
      });

      it('should return the expected `Obj` instance', async () => {
        await expect(odm.objectByKey(MockObj, objId))
          .resolves.not.toBeUndefined();
        await expect(odm.objectByKey(MockObj, objId))
          .resolves.toEqual(commonObj);
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
        await deleteCommonObj();
        await odm.detach();
      });
    });
  });

  describe('function `write`', () => {
    const obj = new MockObj();
    obj.row1 = { subObj: { prop1: [1, 2] } };
    obj.collection = new Map([
      [colId1, { collectionId: colId1, sampleSet: [1, 2] }],
      [colId2, { collectionId: colId2, sampleSet: [1, 2] }],
    ]);

    beforeAll(async () => {
      await odm.attach();
    });

    describe('event `InsertObj`', () => {
      it('should insert a `MockObj` to database', async () => {
        await expect(odm.write(() => { obj.insertObj(); }))
          .resolves.not.toThrow();
        await expect(odm.objectByKey(MockObj, obj.objectId))
          .resolves.toEqual(obj);
      });
    });

    describe('event `InsertOne`', () => {
      it('should insert record to a `single` type prop in `obj` & database',
        async () => {
          await expect(odm.write(() => {
            obj.insertOne('meta', { objName: 'mock' });
          })).resolves.not.toThrow();

          expect(obj.meta).toEqual({ objName: 'mock' });

          const result = await client.send(new GetItemCommand({
            Key: {
              pk: { S: `${MockObj.SCHEMA.name}#${obj.objectId}` },
              sk: { S: 'meta' },
            },
            TableName: dynamoDBConfig.table,
          }));

          expect(result.Item).toEqual({
            pk: { S: `${MockObj.SCHEMA.name}#${obj.objectId}` },
            sk: { S: 'meta' },
            objName: { S: 'mock' },
          });
        });

      it('should insert record to a `collection` type prop in `obj` & database',
        async () => {
          const colId = ulid();

          await expect(odm.write(() => {
            obj.insertOne('collection',
              { collectionId: colId, sampleSet: [0, 1] });
          })).resolves.not.toThrow();

          expect(obj.collection!.get(colId)!.sampleSet).toEqual([0, 1]);

          const result = await client.send(new GetItemCommand({
            Key: {
              pk: { S: `${MockObj.SCHEMA.name}#${obj.objectId}` },
              sk: { S: `collection#${colId}` },
            },
            TableName: dynamoDBConfig.table,
          }));

          expect(result.Item).toEqual({
            pk: { S: `${MockObj.SCHEMA.name}#${obj.objectId}` },
            sk: { S: `collection#${colId}` },
            collectionId: { S: colId },
            sampleSet: { L: [{ N: '0' }, { N: '1' }] },
          });
        });

      afterAll(async () => {
        const transactionItems: TransactWriteItem[] = [
          {
            Delete: {
              Key: {
                pk: { S: `${obj.objectSchema().name}#${obj.objectId}` },
                sk: { S: 'meta' },
              },
              TableName: dynamoDBConfig.table,
            },
          },
          {
            Delete: {
              Key: {
                pk: { S: `${obj.objectSchema().name}#${obj.objectId}` },
                sk: { S: 'row1' },
              },
              TableName: dynamoDBConfig.table,
            },
          },
        ];

        Array.from(obj.collection!.keys()).forEach((key) => {
          transactionItems.push({
            Delete: {
              Key: {
                pk: { S: `${obj.objectSchema().name}#${obj.objectId}` },
                sk: { S: `collection#${key}` },
              },
              TableName: dynamoDBConfig.table,
            },
          });
        });

        await client.send(new TransactWriteItemsCommand({
          TransactItems: transactionItems,
        }));

        await odm.detach();
      });
    });

    describe('event `UpdateOne`', () => {
      beforeAll(async () => {
        await odm.attach();
        await putCommonObj();
      });

      it('should update record of a `single` type prop in `commonObj` '
        + '& database', async () => {
        await expect(odm.write(() => {
          commonObj.updateOne('meta', { objName: 'updated mock' });
        })).resolves.not.toThrow();

        expect(commonObj.meta!.objName).toBe('updated mock');
        expect(commonObj.meta!.objRank).toBe(1);

        const result = await client.send(new GetItemCommand({
          Key: {
            pk: { S: `${commonObj.objectSchema().name}#${objId}` },
            sk: { S: 'meta' },
          },
          TableName: dynamoDBConfig.table,
        }));

        expect(result.Item).not.toBeUndefined();
        expect(result.Item!.objName).toEqual({ S: 'updated mock' });
        expect(result.Item!.objRank).toEqual({ N: '1' });
      });

      it('should update record of a `collection` type prop in `commonObj` '
        + '& database', async () => {
        await expect(odm.write(() => {
          commonObj.updateOne('collection',
            { sampleSet: [0, 1] }, colId1);
        })).resolves.not.toThrow();

        expect(commonObj.collection!.get(colId1)!.sampleSet).toEqual([0, 1]);

        const result = await client.send(new GetItemCommand({
          Key: {
            pk: { S: `${commonObj.objectSchema().name}#${objId}` },
            sk: { S: `collection#${colId1}` },
          },
          TableName: dynamoDBConfig.table,
        }));

        expect(result.Item).not.toBeUndefined();
        expect(result.Item!.sampleSet).toEqual({ L: [{ N: '0' }, { N: '1' }] });
      });

      afterAll(async () => {
        await deleteCommonObj();
        await odm.detach();
      });
    });

    describe('event `DeleteOne`', () => {
      beforeAll(async () => {
        await odm.attach();
        await putCommonObj();
      });

      it('should delete record of a `single` type prop in `commonObj` '
        + '& database', async () => {
        await expect(odm.write(() => { commonObj.deleteOne('row1'); }))
          .resolves.not.toThrow();

        expect(commonObj.row1).toBeUndefined();

        const result = await client.send(new GetItemCommand({
          Key: {
            pk: { S: `${commonObj.objectSchema().name}#${objId}` },
            sk: { S: 'row1' },
          },
          TableName: dynamoDBConfig.table,
        }));

        expect(result.Item).toBeUndefined();
      });

      it('should delete record of a `collection` type prop in `commonObj` '
        + '& database', async () => {
        await expect(odm.write(() => {
          commonObj.deleteOne('collection', colId1);
        })).resolves.not.toThrow();

        expect(commonObj.collection!.has(colId1)).toBeFalsy();

        await expect(odm.write(() => {
          commonObj.deleteOne('collection', colId2);
        })).resolves.not.toThrow();

        expect(commonObj.collection).toBeUndefined();

        const result = await client.send(new QueryCommand({
          TableName: dynamoDBConfig.table,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
          ExpressionAttributeValues: {
            ':pk': { S: `${commonObj.objectSchema().name}#${objId}` },
            ':sk': { S: 'collection#' },
          },
        }));

        expect(result.Count).toBe(0);
        expect(result.Items).toHaveLength(0);
      });

      afterAll(async () => {
        // Remove the remaining record(s) from database.
        await odm.write(() => { commonObj.deleteOne('meta'); });

        await odm.detach();
      });
    });

    it('should throw a `DBClientNotAttachedError`', async () => {
      await expect(odm.write(() => { })).rejects
        .toThrow(DBClientNotAttachedError);
    });

    afterAll(async () => {
      await directAccessODM.detach();
    });
  });

  afterAll(async () => {
    await client.send(new DeleteTableCommand({
      TableName: dynamoDBConfig.table,
    }));
    detachDynamoDBClient(directAccessODM);
  });
});
