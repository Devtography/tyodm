import { instanceFromJSON } from './instance-from-json';

class Tester {
  id!: string;
  name!: string;
  c!: number;
  list!: string[];
  obj!: { id: string; name: string; };

  testCalc(): number {
    return this.c + this.c;
  }
}

const json = {
  id: 'abc',
  name: 'json',
  c: 1,
  list: ['abc', 'bbc'],
  obj: { id: 'bbc', name: 'jason' },
};

it('should return an instance of `Tester`', () => {
  const obj = instanceFromJSON(Tester, json);

  expect(obj instanceof Tester).toBe(true);
  expect(obj.testCalc()).toBe(json.c + json.c);
});
