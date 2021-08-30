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
