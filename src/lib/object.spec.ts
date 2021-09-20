import { ulid } from 'ulid';
import { MockObj } from '../test-utils/mock-object';
import * as emitter from './events/db-write-events';

const colId1 = ulid();
const colId2 = ulid();

const obj = new MockObj();
obj.meta = { objName: 'mock', objRank: 1 };
obj.row1 = { subObj: { prop1: [1, 2] } };
obj.collection = new Map([
  [colId1, { collectionId: colId1, sampleSet: [1, 2] }],
  [colId2, { collectionId: colId2, sampleSet: [1, 2] }],
]);

it('should returns the value of identifier specified in schema', () => {
  expect(obj.objectId).toEqual(obj.ulid);
});

it('should emit an insert object event', () => new Promise((done) => {
  emitter.onInsertObjEvent((receivedObj) => {
    expect(receivedObj).toEqual(obj);
    done(obj);
  });

  obj.insertObj();
}));

it('should emit an `InsertOne` event', () => new Promise((done) => {
  const values = { objName: 'mocker', objRank: 2 };

  emitter.onInsertOneEvent((receivedObj, toProp, val) => {
    expect(receivedObj).toEqual(obj);
    expect(toProp).toEqual('meta');
    expect(val).toEqual(values);
    done(obj);
  });

  obj.insertRecord('meta', values);
}));

it('should emit an `UpdateOne` event', () => new Promise<void>((done) => {
  const values = { objName: 'updated mock', objRank: 2 };

  emitter.onUpdateOneEvent((receivedObj, toProp, identifier, val) => {
    expect(receivedObj).toEqual(obj);
    expect(toProp).toEqual('meta');
    expect(identifier).toBeUndefined();
    expect(val).toEqual(values);
    done();
  });

  obj.updateRecord('meta', values);
}));

it('should emit an `DeleteRecord` event', () => new Promise((done) => {
  emitter.onDeleteOneEvent((receivedObj, prop, colId) => {
    expect(receivedObj).toEqual(obj);
    expect(prop).toEqual('meta');
    expect(colId).toBeUndefined();
    done(undefined);
  });

  obj.deleteRecord('meta');
}));
