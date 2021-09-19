import { MockObj } from '../../../test-utils/mock-object';
import * as errors from '../errors';
import * as emitter from './emitter';
import { Event } from './events';

beforeEach(() => {
  emitter.emitter.removeAllListeners();
});

describe('`InsertObj` event', () => {
  describe('function `insertObj`', () => {
    it('should return `false` when event is not being listened', () => {
      expect(emitter.insertObj(new MockObj())).toBeFalsy();
    });

    it('should return `true` when event is handled by a listener', () => {
      emitter.emitter.on(Event.InsertObj, () => { });
      expect(emitter.insertObj(new MockObj())).toBeTruthy();
    });
  });

  describe('function `onInsertObjEvent`', () => {
    it('should trigger the listener function on event emitted',
      () => new Promise((done) => {
        emitter.onInsertObjEvent((obj) => { done(obj); });
        expect(emitter.insertObj(new MockObj())).toBeTruthy();
      }));

    it('should throw `MaxListenerExceededError` when the event has '
      + 'already been assigned to a listener', () => {
      emitter.onInsertObjEvent((_obj) => { });
      expect(() => { emitter.onInsertObjEvent((_obj) => { }); })
        .toThrow(errors.MaxListenerExceededError);
    });
  });
});

describe('`InsertOne` event', () => {
  describe('function `insertOne`', () => {
    it('should return `false` when event is not being listened', () => {
      expect(emitter.insertOne(new MockObj(), 'meta', {})).toBeFalsy();
    });

    it('should return `true` when event is handled by a listener', () => {
      emitter.emitter.on(Event.InsertOne, () => { });
      expect(emitter.insertOne(new MockObj(), 'meta', {})).toBeTruthy();
    });
  });

  describe('function `onInsertOneEvent', () => {
    it('should trigger the listener function on event emitted',
      () => new Promise((done) => {
        emitter.onInsertOneEvent((obj, _toProp, _val) => { done(obj); });
        expect(emitter.insertOne(new MockObj(), 'meta', {})).toBeTruthy();
      }));

    it('should throw `MaxListenerExceededError` when the event has '
      + 'already been assigned to a listener', () => {
      emitter.onInsertOneEvent((_obj, _toProp, _val) => { });
      expect(() => { emitter.onInsertOneEvent((_obj, _toProp, _val) => { }); })
        .toThrow(errors.MaxListenerExceededError);
    });
  });
});

describe('`DeleteOne` event', () => {
  describe('function `deleteOne`', () => {
    it('should return `false` when event is not being listened', () => {
      expect(emitter.deleteOne(new MockObj(), 'meta', undefined)).toBeFalsy();
    });

    it('should return `true` when event is handled by a listener', () => {
      emitter.emitter.on(Event.DeleteOne, () => { });
      expect(emitter.deleteOne(new MockObj(), 'meta', undefined)).toBeTruthy();
    });
  });

  describe('function `onDeleteOneEvent`', () => {
    it('should trigger the listener function on event emitted',
      () => new Promise((done) => {
        emitter.onDeleteOneEvent((obj, _prop, _colId) => { done(obj); });
        expect(emitter.deleteOne(new MockObj(), 'meta', undefined))
          .toBeTruthy();
      }));

    it('should throw `MaxListenerExceededError` when the event has '
      + 'already been assigned to a listener', () => {
      emitter.onDeleteOneEvent((_obj, _prop, _colId) => { });
      expect(() => { emitter.onDeleteOneEvent((_obj, _prop, _colId?) => { }); })
        .toThrow(errors.MaxListenerExceededError);
    });
  });
});
