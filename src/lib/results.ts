import { Collection } from './collection';
import { Obj } from './object';

/**
 * Instances of this class are typically collections returned by
 * {@link Obj~objects()}.
 * @extends Collection
 */
class Results<T extends Obj> extends Collection<T> { }

export { Results };
