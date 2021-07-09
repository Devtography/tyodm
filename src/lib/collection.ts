/**
 * Abstract base class containing methods used by {@link Results}.
 *
 * A TyODM Collection is a homogenous sequence of values of any of the types
 * that can be stored as properties of TyODM objects. A collection can be
 * accessed in any of the ways that a normal Javascript Array can, including
 * subscripting, enumerating with `for-of` and so on.
 */
abstract class Collection<T> extends Array<T> implements ReadonlyArray<T> {
  /**
   * Checks if the collection is empty.
   * @returns {boolean} indicating if the collection is empty of not.
   */
  isEmpty(): boolean {
    return this.length === 0;
  }
}

export { Collection };
