/* eslint-disable jest/no-done-callback */
import { Obj } from '../object';
import { Schema } from '../schema';
import * as errors from './errors';
import * as writeEvents from './write-events';
import { WriteEvent } from './write-events';

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
  writeEvents.emitter.removeAllListeners();
});

describe('`NewObj` event', () => {
  describe('function newObj', () => {
    it('should return `false` when event is not being listened', () => {
      expect(writeEvents.newObj(new MockObj())).toBeFalsy();
    });

    it('should return `true` when event is handled by a listener', () => {
      writeEvents.emitter.on(WriteEvent.NewObj, () => { });

      expect(writeEvents.newObj(new MockObj())).toBeTruthy();
    });
  });

  describe('function onNewObjEvent(listener)', () => {
    it('should trigger the listener function on event emitted', (done) => {
      writeEvents.onNewObjEvent((_obj) => {
        done();
      });

      expect(writeEvents.newObj(new MockObj())).toBeTruthy();
    }, 2);

    it('should thrown `MaxListenersExceededException` when the event has '
      + 'already been assigned to a listener', () => {
      writeEvents.onNewObjEvent((_obj) => { });

      expect(() => { writeEvents.onNewObjEvent((_obj) => { }); })
        .toThrow(errors.MaxListenerExceededException);
    });
  });
});
