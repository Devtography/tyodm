/**
 * @internal
 */
class MaxListenerExceededException extends Error {
  constructor(event: string) {
    const msg = 'Number of listeners exceeded the maximum listeners allowed '
      + `for event ${event}`;

    super(msg);

    Object.setPrototypeOf(this, MaxListenerExceededException.prototype);
  }
}

export { MaxListenerExceededException };
