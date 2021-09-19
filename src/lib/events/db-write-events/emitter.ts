import { EventEmitter } from 'events';
import type { Obj } from '../../object';
import { MaxListenerExceededError } from '../errors';
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
export function insertObj(obj: Obj): boolean {
  return emitter.emit(Event.InsertObj, obj);
}

/**
 * Set the event listener for event {@link Events.InsertObj}.
 * @param listener - Handler function for the event.
 * @throws {@link MaxListenerExceededException}
 * Thrown if the event is already assigned to another listener.
 * @internal
 */
export function onInsertObjEvent(listener: (obj: Obj) => void): void {
  if (emitter.listenerCount(Event.InsertObj) > 0) {
    throw new MaxListenerExceededError(Event.InsertObj);
  }

  emitter.on(Event.InsertObj, listener);
}

export { emitter };
