import { ulid } from 'ulid';
import * as connection from '../connection';
import { Obj } from '../object';
import { TyODM } from '../odm';
import { Schema } from '../schema';
import { DynamoDBDriver } from './dynamodb';

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

  ulid = ulid();
  meta?: { name: string, rank?: number };
  row1?: { subObj: { prop1: number[] } };
  collection?: Map<string, { collectionId: string, sampleSet: number[] }>;

  objectSchema(): Schema { return MockObj.SCHEMA; }
}

let odm: TyODM;
let driver: DynamoDBDriver;

beforeAll(() => {
  const schemaMap = new Map<string, Schema>();
  schemaMap.set(MockObj.name, MockObj.SCHEMA);

  odm = new TyODM({
    region: 'us-west-1',
    endpoint: 'localhost:8000',
    table: 'default',
    schema: schemaMap,
  });

  const client = connection.attachDynamoDBClient(odm);
  driver = new DynamoDBDriver(client, 'default');
});

beforeEach(() => {
  driver.transactWriteItems.length = 0; // reset the array
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

afterAll(() => {
  connection.detachDynamoDBClient(odm);
});
