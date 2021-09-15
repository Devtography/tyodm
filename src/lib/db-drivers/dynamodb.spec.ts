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
import * as connection from '../connection';
import { Obj } from '../object';
import { TyODM } from '../odm';
import { Schema } from '../schema';
import { DynamoDBDriver } from './dynamodb';
import { MaxWriteActionExceededError } from './errors';

class MockObj extends Obj {
  static SCHEMA: Schema = {
    name: 'MockObj',
    identifier: 'ulid',
    props: {
      meta: { type: 'single', attr: { name: 'string', rank: 'int?' } },
      row1: { type: 'single', attr: { subObj: { prop1: 'decimal[]' } } },
      collection: {
        type: 'collection',
        identifier: 'collectionId',
        attr: { collectionId: 'string', sampleSet: 'int[]' },
      },
    },
  };

  ulid: string;
  meta?: { name: string, rank?: number };
  row1?: { subObj: { prop1: number[] } };
  collection?: Map<string, { collectionId: string, sampleSet: number[] }>;

  constructor(objId?: string) {
    super(objId);

    this.ulid = objId || ulid();
  }

  objectSchema(): Schema { return MockObj.SCHEMA; }
}

let odm: TyODM;
let client: DynamoDBClient;
let driver: DynamoDBDriver;

beforeAll(() => {
  const schemaMap = new Map<string, Schema>();
  schemaMap.set(MockObj.name, MockObj.SCHEMA);

  odm = new TyODM({
    region: 'us-west-1',
    endpoint: 'http://localhost:8000',
    table: 'default',
    schema: schemaMap,
  });

  client = connection.attachDynamoDBClient(odm);
  driver = new DynamoDBDriver(client, 'default');
});

beforeEach(async () => {
  driver.transactWriteItems.length = 0; // reset the array

  const cmd = new CreateTableCommand({
    TableName: 'default',
    KeySchema: [
      { AttributeName: 'pk', KeyType: 'HASH' },
      { AttributeName: 'sk', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'pk', AttributeType: 'S' },
      { AttributeName: 'sk', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5, WriteCapacityUnits: 5,
    },
  });

  await client.send(cmd);
});

describe('function `getObjByKey`', () => {
  const ulid1 = ulid();
  const ulid2 = ulid();
  const obj = new MockObj();

  beforeEach(async () => {
    obj.meta = { name: 'mocker' };
    obj.row1 = { subObj: { prop1: [1, 2, 3] } };
    obj.collection = new Map([
      [ulid1, { collectionId: ulid1, sampleSet: [1, 3, 5, 7] }],
      [ulid2, { collectionId: ulid2, sampleSet: [2, 4, 6, 8] }],
    ]);

    driver.insertObj(obj);
    await driver.commitWriteTransaction();
  });

  it('should return the TyODM object based on data retrieve from database',
    async () => {
      await expect(driver.getObjById(obj.objectId, MockObj))
        .resolves.toEqual(obj);
    });
});

describe('function `insertObj`', () => {
  it('should push instances of `TransactWriteItem` to array '
  + '`transactWriteItems` for object passed in', () => {
    const ulid1 = ulid();
    const ulid2 = ulid();

    const obj = new MockObj();
    obj.meta = { name: 'mocker' };
    obj.row1 = { subObj: { prop1: [1, 2, 3] } };
    obj.collection = new Map([
      [ulid1, { collectionId: ulid1, sampleSet: [1, 3, 5, 7] }],
      [ulid2, { collectionId: ulid2, sampleSet: [2, 4, 6, 8] }],
    ]);

    expect(() => { driver.insertObj(obj); }).not.toThrow();
    expect(driver.transactWriteItems).toEqual([
      {
        Put: {
          Item: {
            pk: { S: `MockObj#${obj.objectId}` },
            sk: { S: 'meta' },
            name: { S: 'mocker' },
          },
          TableName: 'default',
        },
      },
      {
        Put: {
          Item: {
            pk: { S: `MockObj#${obj.objectId}` },
            sk: { S: 'row1' },
            subObj: { M: { prop1: { SS: ['1', '2', '3'] } } },
          },
          TableName: 'default',
        },
      },
      {
        Put: {
          Item: {
            pk: { S: `MockObj#${obj.objectId}` },
            sk: { S: `collection#${ulid1}` },
            collectionId: { S: ulid1 },
            sampleSet: { NS: ['1', '3', '5', '7'] },
          },
          TableName: 'default',
        },
      },
      {
        Put: {
          Item: {
            pk: { S: `MockObj#${obj.objectId}` },
            sk: { S: `collection#${ulid2}` },
            collectionId: { S: ulid2 },
            sampleSet: { NS: ['2', '4', '6', '8'] },
          },
          TableName: 'default',
        },
      },
    ]);
  });
});

describe('function `insertOne`', () => {
  it('should push instance of `TransactWriteItem` to array '
  + '`transactWriteItems` for data element object passed in', () => {
    const meta = { name: 'obj meta' };

    expect(() => {
      driver.insertOne('MockObj#1', meta, 'meta', MockObj.SCHEMA.props.meta);
    }).not.toThrow();
    expect(driver.transactWriteItems).toHaveLength(1);
    expect(driver.transactWriteItems).toEqual([
      {
        Put: {
          Item: {
            pk: { S: 'MockObj#1' },
            sk: { S: 'meta' },
            name: { S: 'obj meta' },
          },
          TableName: 'default',
        },
      },
    ]);
  });
});

describe('function `delete`', () => {
  it('should delete the targeted item from database', async () => {
    const item: TransactWriteItem = {
      Put: {
        Item: { pk: { S: 'item#1' }, sk: { S: 'meta#1' }, name: { S: 'item' } },
        TableName: 'default',
      },
    };

    await client.send(new TransactWriteItemsCommand({ TransactItems: [item] }));

    driver.deleteOne('item#1', 'meta#1');
    expect(driver.transactWriteItems).toHaveLength(1);

    await driver.commitWriteTransaction();
    expect((await client.send(new GetItemCommand({
      TableName: 'default',
      Key: { pk: { S: 'item#1' }, sk: { S: 'meta#1' } },
    }))).Item).toBeUndefined();
  });
});

describe('function `commitWriteTransaction`', () => {
  it('should write the data into DynamoDB', async () => {
    const obj1 = new MockObj();
    obj1.meta = { name: 'obj1', rank: 1 };
    obj1.row1 = { subObj: { prop1: [-1.0387, 0.00001, 1.357] } };

    const obj2 = new MockObj();
    obj2.meta = { name: 'obj2' };
    obj2.collection = new Map([
      ['1', { collectionId: '1', sampleSet: [-1, 0, 1] }],
      ['2', { collectionId: '2', sampleSet: [0, -2, 1000] }],
    ]);

    expect(() => { driver.insertObj(obj1); }).not.toThrow();
    expect(() => { driver.insertObj(obj2); }).not.toThrow();
    await expect(driver.commitWriteTransaction()).resolves.not.toThrow();

    const obj1Results = await client.send(new QueryCommand({
      TableName: 'default',
      KeyConditionExpression: 'pk = :value',
      ExpressionAttributeValues: {
        ':value': { S: `MockObj#${obj1.objectId}` },
      },
    }));

    expect(obj1Results.Count).toBe(2);
    expect(obj1Results.ScannedCount).toBe(2);
    expect(obj1Results.Items).toEqual([
      {
        pk: { S: `MockObj#${obj1.objectId}` },
        sk: { S: 'meta' },
        name: { S: 'obj1' },
        rank: { N: '1' },
      },
      {
        pk: { S: `MockObj#${obj1.objectId}` },
        sk: { S: 'row1' },
        subObj: { M: { prop1: { SS: ['-1.0387', '0.00001', '1.357'] } } },
      },
    ]);

    const obj2Results = await client.send(new QueryCommand({
      TableName: 'default',
      KeyConditionExpression: 'pk = :value',
      ExpressionAttributeValues: {
        ':value': { S: `MockObj#${obj2.objectId}` },
      },
    }));

    expect(obj2Results.Count).toBe(3);
    expect(obj2Results.ScannedCount).toBe(3);
    expect(obj2Results.Items).toEqual([
      {
        pk: { S: `MockObj#${obj2.objectId}` },
        sk: { S: 'collection#1' },
        collectionId: { S: '1' },
        sampleSet: { NS: ['-1', '0', '1'] },
      },
      {
        pk: { S: `MockObj#${obj2.objectId}` },
        sk: { S: 'collection#2' },
        collectionId: { S: '2' },
        sampleSet: { NS: ['-2', '0', '1000'] },
      },
      {
        pk: { S: `MockObj#${obj2.objectId}` },
        sk: { S: 'meta' },
        name: { S: 'obj2' },
      },
    ]);
  });

  it('should throw `MaxWriteActionExceededError`', async () => {
    const obj = new MockObj();
    obj.meta = { name: 'obj', rank: 1 };
    obj.row1 = { subObj: { prop1: [-1, 0, 1] } };
    obj.collection = new Map((() => {
      const result: Array<[
        string, { collectionId: string, sampleSet: number[] },
      ]> = [];

      for (let i = 0; i < 25; i += 1) {
        result.push(
          [i.toString(), { collectionId: i.toString(), sampleSet: [0] }],
        );
      }

      return result;
    })());

    expect(() => { driver.insertObj(obj); }).not.toThrow();
    await expect(driver.commitWriteTransaction())
      .rejects.toThrow(MaxWriteActionExceededError);
  });
});

describe('function `cancelTransaction`', () => {
  it('should reset the array `transactWriteItems`', () => {
    const obj = new MockObj();
    obj.meta = { name: 'mocker' };

    driver.insertObj(obj);
    driver.cancelWriteTransaction();

    expect(driver.transactWriteItems).toHaveLength(0);
  });
});

describe('function `buildPutTransactionWriteItem`', () => {
  it('should return `TransactWriteItem` for object passed in', () => {
    const obj = new MockObj();
    obj.meta = { name: 'sampleObj', rank: 1 };

    const item = driver.buildPutTransactWriteItem(
      `${MockObj.name}#${obj.objectId}`, 'meta',
      obj.meta, obj.objectSchema().props.meta.attr,
    );

    expect(item).toEqual({
      Put: {
        Item: {
          pk: { S: `MockObj#${obj.ulid}` },
          sk: { S: 'meta' },
          name: { S: 'sampleObj' },
          rank: { N: '1' },
        },
        TableName: 'default',
      },
    });
  });

  it('should return `TransactWriteItem` for object with sub-object', () => {
    const obj = new MockObj();
    obj.row1 = { subObj: { prop1: [1, 2, 3, 4] } };

    const item = driver.buildPutTransactWriteItem(
      `${MockObj.name}#${obj.objectId}`, 'row1',
      obj.row1, obj.objectSchema().props.row1.attr,
    );

    expect(item).toEqual({
      Put: {
        Item: {
          pk: { S: `MockObj#${obj.ulid}` },
          sk: { S: 'row1' },
          subObj: { M: { prop1: { SS: ['1', '2', '3', '4'] } } },
        },
        TableName: 'default',
      },
    });
  });
});

afterEach(async () => {
  const cmd = new DeleteTableCommand({ TableName: 'default' });

  await client.send(cmd);
});

afterAll(() => {
  connection.detachDynamoDBClient(odm);
});
