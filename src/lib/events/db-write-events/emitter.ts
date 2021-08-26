import { EventEmitter } from 'events';
import type { Obj } from '../../object';
import * as errors from '../errors';
import { Event } from './events';

/**
 * Singleton write events emitter.
 * @internal
 */
const emitter = new EventEmitter();

/**
 * Emit an event of new TyODM object creation/insertion.
 * @param obj - The object to be written into database.
 * @returns `true` if the event is being listened. `false` if otherwise.
 * @internal
 */
function newObj<T>(obj: Obj, Type: { new(): T }): boolean {
  return emitter.emit(Event.NewObj, obj, Type);
}

/**
 * Set the event listener for event {@link WriteEvent#NewObj}.
 * @param listener - Handler function for the event.
 * @throws {@link errors#MaxListenerExceededException}
 * Thrown if the event is already being assigned to another listener.
 */
function onNewObjEvent<T>(
  listener: (obj: Obj, Type: { new(): T }) => void,
): void {
  if (emitter.listenerCount(Event.NewObj) > 0) {
    throw new errors.MaxListenerExceededException(Event.NewObj);
  }

  emitter.on(Event.NewObj, listener);
}

export { emitter };
export { newObj, onNewObjEvent };
