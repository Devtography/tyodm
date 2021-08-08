import { Collection } from './collection';
import { Obj } from './object';

/**
 * Instances of this class are typically collections returned by
 * {@link TyODM.objects}.
 *
 * @typeParam T - Type of objects extends from {@link Obj} the array the
 * {@link Collection} contains.
 */
class Results<T extends Obj> extends Collection<T> { }

export { Results };
