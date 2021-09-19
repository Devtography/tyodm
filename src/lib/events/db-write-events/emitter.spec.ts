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
