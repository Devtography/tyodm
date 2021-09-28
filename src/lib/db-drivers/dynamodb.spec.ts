/* eslint-disable object-property-newline */
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
import { MockObj } from '../../test-utils/mock-object';
import * as connection from '../connection';
import { TyODM } from '../odm';
import { Schema } from '../schema';
import { DynamoDBDriver } from './dynamodb';
import { MaxWriteActionExceededError } from './errors';

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
    obj.meta = { objName: 'mocker' };
    obj.row1 = { subObj: { prop1: [1, 2, 3] } };
    obj.collection = new Map([
      [ulid1, { collectionId: ulid1, sampleIntArr: [1, 3, 5, 7] }],
      [ulid2, { collectionId: ulid2, sampleIntArr: [2, 4, 6, 8] }],
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
    obj.meta = { objName: 'mocker' };
    obj.row1 = { subObj: { prop1: [1, 2, 3] } };
    obj.collection = new Map([
      [ulid1, { collectionId: ulid1, sampleIntArr: [1, 3, 5, 7] }],
      [ulid2, { collectionId: ulid2, sampleIntArr: [2, 4, 6, 8] }],
    ]);

    expect(() => { driver.insertObj(obj); }).not.toThrow();
    expect(driver.transactWriteItems).toEqual([
      {
        Put: {
          Item: {
            pk: { S: `MockObj#${obj.objectId}` },
            sk: { S: 'meta' },
            objName: { S: 'mocker' },
          },
          TableName: 'default',
        },
      },
      {
        Put: {
          Item: {
            pk: { S: `MockObj#${obj.objectId}` },
            sk: { S: 'row1' },
            subObj: {
              M: { prop1: { L: [{ S: '1' }, { S: '2' }, { S: '3' }] } },
            },
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
            sampleIntArr: {
              L: [{ N: '1' }, { N: '3' }, { N: '5' }, { N: '7' }],
            },
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
            sampleIntArr: {
              L: [{ N: '2' }, { N: '4' }, { N: '6' }, { N: '8' }],
            },
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
    const meta = { objName: 'obj meta' };

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
            objName: { S: 'obj meta' },
          },
          TableName: 'default',
        },
      },
    ]);
  });
});

describe('function `update`', () => {
  it('should push an object of `TransactWriteItem` with `Delete` property '
  + 'to array `transactWriteItems` for values passed in', () => {
    driver.update('MockObj#1', 'meta', { objName: 'mock_name', objRank: 1 },
      MockObj.SCHEMA.props.meta);
    expect(driver.transactWriteItems).toHaveLength(1);
    expect(driver.transactWriteItems[0]).toEqual(
      {
        Update: {
          Key: { pk: { S: 'MockObj#1' }, sk: { S: 'meta' } },
          UpdateExpression: 'set objName=:objName, objRank=:objRank',
          ExpressionAttributeValues: {
            ':objName': { S: 'mock_name' },
            ':objRank': { N: '1' },
          },
          TableName: 'default',
        },
      },
    );
    driver.update('MockObj#1', 'row1', { subObj: { prop1: [1, 2, 3] } },
      MockObj.SCHEMA.props.row1);
    expect(driver.transactWriteItems).toHaveLength(2);
    expect(driver.transactWriteItems[1]).toEqual(
      {
        Update: {
          Key: { pk: { S: 'MockObj#1' }, sk: { S: 'row1' } },
          UpdateExpression: 'set subObj.prop1=:subObj_prop1',
          ExpressionAttributeValues: {
            ':subObj_prop1': { L: [{ S: '1' }, { S: '2' }, { S: '3' }] },
          },
          TableName: 'default',
        },
      },
    );
  });

  it('should update the records in database as specified', async () => {
    const obj = new MockObj();
    obj.meta = { objName: 'mock' };
    obj.row1 = { subObj: { prop1: [1, 2] } };

    driver.insertObj(obj);
    await driver.commitWriteTransaction();

    driver.update(`${MockObj.name}#${obj.objectId}`, 'meta',
      { objName: 'mock_name', objRank: 1 }, MockObj.SCHEMA.props.meta);
    driver.update(`${MockObj.name}#${obj.objectId}`, 'row1',
      { subObj: { prop1: [1, 2, 3] } }, MockObj.SCHEMA.props.row1);

    await driver.commitWriteTransaction();

    const results = await client.send(new QueryCommand({
      TableName: 'default',
      KeyConditionExpression: 'pk = :value',
      ExpressionAttributeValues: {
        ':value': { S: `MockObj#${obj.objectId}` },
      },
    }));

    expect(results.Count).toEqual(2);
    expect(results.Items).toEqual([
      {
        pk: { S: `${MockObj.name}#${obj.objectId}` },
        sk: { S: 'meta' },
        objName: { S: 'mock_name' },
        objRank: { N: '1' },
      },
      {
        pk: { S: `${MockObj.name}#${obj.objectId}` },
        sk: { S: 'row1' },
        subObj: { M: { prop1: { L: [{ S: '1' }, { S: '2' }, { S: '3' }] } } },
      },
    ]);
    expect(1).toEqual(1);
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
    obj1.meta = { objName: 'obj1', objRank: 1 };
    obj1.row1 = { subObj: { prop1: [-1.0387, 0.00001, 1.357] } };

    const obj2 = new MockObj();
    obj2.meta = { objName: 'obj2' };
    obj2.collection = new Map([
      ['1', { collectionId: '1', sampleIntArr: [-1, 0, 1] }],
      ['2', { collectionId: '2', sampleIntArr: [0, -2, 1000] }],
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
        objName: { S: 'obj1' },
        objRank: { N: '1' },
      },
      {
        pk: { S: `MockObj#${obj1.objectId}` },
        sk: { S: 'row1' },
        subObj: {
          M: {
            prop1: { L: [{ S: '-1.0387' }, { S: '0.00001' }, { S: '1.357' }] },
          },
        },
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
        sampleIntArr: { L: [{ N: '-1' }, { N: '0' }, { N: '1' }] },
      },
      {
        pk: { S: `MockObj#${obj2.objectId}` },
        sk: { S: 'collection#2' },
        collectionId: { S: '2' },
        sampleIntArr: { L: [{ N: '0' }, { N: '-2' }, { N: '1000' }] },
      },
      {
        pk: { S: `MockObj#${obj2.objectId}` },
        sk: { S: 'meta' },
        objName: { S: 'obj2' },
      },
    ]);
  });

  it('should throw `MaxWriteActionExceededError`', async () => {
    const obj = new MockObj();
    obj.meta = { objName: 'obj', objRank: 1 };
    obj.row1 = { subObj: { prop1: [-1, 0, 1] } };
    obj.collection = new Map((() => {
      const result: Array<[
        string, { collectionId: string, sampleIntArr: number[] },
      ]> = [];

      for (let i = 0; i < 25; i += 1) {
        result.push(
          [i.toString(), { collectionId: i.toString(), sampleIntArr: [0] }],
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
    obj.meta = { objName: 'mocker' };

    driver.insertObj(obj);
    driver.cancelWriteTransaction();

    expect(driver.transactWriteItems).toHaveLength(0);
  });
});

describe('function `buildPutTransactionWriteItem`', () => {
  it('should return `TransactWriteItem` for object passed in', () => {
    const obj = new MockObj();
    obj.sample = {
      sampleBool: true, sampleBoolArr: [true, true],
      sampleBoolSet: new Set([true, false]),
      sampleInt: 0, sampleIntArr: [-1, 0, 0], sampleIntSet: new Set([0, 1]),
      sampleDouble: 3.1417, sampleDoubleArr: [-3.33, 0.2, 0.2],
      sampleDoubleSet: new Set([-3.33, 1.11, 2.22]),
      sampleDecimal: 0.0987654321,
      sampleDecimalArr: [0.0987654321, 0.0987654321],
      sampleDecimalSet: new Set([0.0987654321, 0.123456789]),
      sampleStr: 'sample', sampleStrArr: ['a', 'a', 'b', 'b'],
      sampleStrSet: new Set(['a', 'b']),
      sampleOptional: 'optional',
    };

    const item = driver.buildPutTransactWriteItem(
      `${MockObj.name}#${obj.objectId}`, 'sample',
      obj.sample, obj.objectSchema().props.sample.attr,
    );

    expect(item).toEqual({
      Put: {
        Item: {
          pk: { S: `MockObj#${obj.ulid}` },
          sk: { S: 'sample' },
          sampleBool: { BOOL: true },
          sampleBoolArr: { L: [{ BOOL: true }, { BOOL: true }] },
          sampleBoolSet: { L: [{ BOOL: true }, { BOOL: false }] },
          sampleInt: { N: '0' },
          sampleIntArr: { L: [{ N: '-1' }, { N: '0' }, { N: '0' }] },
          sampleIntSet: { NS: ['0', '1'] },
          sampleDouble: { N: '3.1417' },
          sampleDoubleArr: { L: [{ N: '-3.33' }, { N: '0.2' }, { N: '0.2' }] },
          sampleDoubleSet: { NS: ['-3.33', '1.11', '2.22'] },
          sampleDecimal: { S: '0.0987654321' },
          sampleDecimalArr: {
            L: [{ S: '0.0987654321' }, { S: '0.0987654321' }],
          },
          sampleDecimalSet: {
            SS: ['0.0987654321', '0.123456789'],
          },
          sampleStr: { S: 'sample' },
          sampleStrArr: { L: [{ S: 'a' }, { S: 'a' }, { S: 'b' }, { S: 'b' }] },
          sampleStrSet: { SS: ['a', 'b'] },
          sampleOptional: { S: 'optional' },
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
          subObj: {
            M: {
              prop1: { L: [{ S: '1' }, { S: '2' }, { S: '3' }, { S: '4' }] },
            },
          },
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
