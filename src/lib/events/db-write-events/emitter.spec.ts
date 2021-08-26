/* eslint-disable jest/no-done-callback */
import { Obj } from '../../object';
import { Schema } from '../../schema';
import * as errors from '../errors';
import * as emitter from './emitter';
import { Event } from './events';

class MockObj extends Obj {
  static SCHEMA: Schema = {
    name: 'MockObj',
    props: {
      meta: {
        type: 'single',
        attr: {
          name: 'string',
        },
      },
    },
  };

  objectSchema(): Schema {
    return MockObj.SCHEMA;
  }
}

beforeEach(() => {
  emitter.emitter.removeAllListeners();
});

describe('`NewObj` event', () => {
  describe('function newObj', () => {
    it('should return `false` when event is not being listened', () => {
      expect(emitter.newObj(new MockObj(), MockObj)).toBeFalsy();
    });

    it('should return `true` when event is handled by a listener', () => {
      emitter.emitter.on(Event.NewObj, () => { });

      expect(emitter.newObj(new MockObj(), MockObj)).toBeTruthy();
    });
  });

  describe('function onNewObjEvent(listener)', () => {
    it('should trigger the listener function on event emitted', (done) => {
      emitter.onNewObjEvent((_obj, _Type) => {
        done();
      });

      expect(emitter.newObj(new MockObj(), MockObj)).toBeTruthy();
    }, 2);

    it('should thrown `MaxListenersExceededException` when the event has '
      + 'already been assigned to a listener', () => {
      emitter.onNewObjEvent((_obj, _Type) => { });

      expect(() => { emitter.onNewObjEvent((_obj) => { }); })
        .toThrow(errors.MaxListenerExceededException);
    });
  });
});
