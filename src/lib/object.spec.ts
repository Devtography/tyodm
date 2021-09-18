import { MockObj } from '../test-utils/mock-object';

it('should returns the value of identifier specified in schema', () => {
  const obj = new MockObj();

  expect(obj.objectId).toEqual(obj.ulid);
});
