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

/**
 * Emits an event of a single record insertion.
 * @param obj - The object to insert the items in `val` to.
 * @param toProp - Name of the property
 * @param val - Value(s) to be inserted.
 * @returns `true` if the event is being listened. `false` if otherwise.
 * @internal
 */
export function insertOne(
  obj: Obj, toProp: string, val: Record<string, unknown>,
): boolean {
  return emitter.emit(Event.InsertOne, obj, toProp, val);
}

/**
 * Set the event listener for event {@link Event.InsertOne}.
 * @param listener - Handler function for the event.
 * @throws {@link MaxListenerExceededError}
 * Thrown if the event is already assigned to another listener.
 * @internal
 */
export function onInsertOneEvent(
  listener: (obj: Obj, toProp: string, val: Record<string, unknown>) => void,
): void {
  if (emitter.listenerCount(Event.InsertOne) > 0) {
    throw new MaxListenerExceededError(Event.InsertOne);
  }

  emitter.on(Event.InsertOne, listener);
}

/**
 * Emits an event of single record update.
 * @param obj - The object to update the values in `val` to.
 * @param toProp - Name of the targeted property.
 * @param identifier - Identifier of the target record if the target property
 * is a `collection` type property.
 * @param val - Value(s) to be updated.
 * @returns `true` if the event is being listened. `false` if otherwise.
 * @internal
 */
export function updateOne(
  obj: Obj, toProp: string, identifier: string | undefined,
  val: Record<string, unknown>,
): boolean {
  return emitter.emit(Event.UpdateOne, obj, toProp, identifier, val);
}

/**
 * Set the event listener for event {@link Event.UpdateOne}.
 * @param listener -Handler function for the event.
 * @throws {@link MaxListenerExceededError}
 * Thrown if the event is already assigned to another listener.
 * @internal
 */
export function onUpdateOneEvent(listener: (
  obj: Obj, toProp: string, identifier: string | undefined,
  val: Record<string, unknown>
) => void): void {
  if (emitter.listenerCount(Event.UpdateOne) > 0) {
    throw new MaxListenerExceededError(Event.UpdateOne);
  }

  emitter.on(Event.UpdateOne, listener);
}

/**
 * Emits an event of single record deletion.
 * @param obj - The object to delete the record from.
 * @param prop - Name of the target property.
 * @param colId - Identifier of the record if the target property is a
 * `collection` type property.
 * @returns `true` if the event is being listened. `false` if otherwise.
 * @internal
 */
export function deleteOne(
  obj: Obj, prop: string, colId: string | undefined,
): boolean {
  return emitter.emit(Event.DeleteOne, obj, prop, colId);
}

export function onDeleteOneEvent(
  listener: (obj: Obj, prop: string, colId: string | undefined) => void,
): void {
  if (emitter.listenerCount(Event.DeleteOne) > 0) {
    throw new MaxListenerExceededError(Event.DeleteOne);
  }

  emitter.on(Event.DeleteOne, listener);
}

export { emitter };
