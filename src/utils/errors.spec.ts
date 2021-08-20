import * as err from './errors';

function mockFunc() {
  throw new err.NotImplementedError(mockFunc.name);
}

it('should include the function name in error message', () => {
  expect(() => { mockFunc(); })
    .toThrow('Function mockFunc is not yet implemented');
});
