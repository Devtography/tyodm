import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { PropType } from '../typings';

/**
 * Casts the value based on its' `PropType` and assigns it to the object
 * property.
 * @param val - Value to cast and assign.
 * @param type - {@link PropType} of `val`.
 * @param obj - Object to contain the value.
 * @param key - Key of the target object property for value assignment.
 * @internal
 */
function assignValToObjProp(
  val: unknown, type: PropType,
  obj: Record<string, unknown>, key: string,
): void {
  let propType: string = type.toLowerCase();

  if (propType.slice(-1) === '?') {
    propType = propType.slice(0, -1);
  }

  switch (propType) {
    case ('bool'):
      obj[key] = val as boolean;
      break;
    case ('bool[]'):
    case ('bool<>'): {
      const list = val as AttributeValue[];
      const arr: boolean[] = [];
      list.forEach((elm) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        arr.push(elm.BOOL!);
      });
      if (propType === 'bool[]') {
        obj[key] = arr;
      } else {
        obj[key] = new Set(arr);
      }
      break;
    }
    case ('int'):
      obj[key] = parseInt(val as string, 10);
      break;
    case ('double'):
    case ('decimal'):
      obj[key] = parseFloat(val as string);
      break;
    case ('int[]'):
    case ('double[]'):
    case ('decimal[]'):
      obj[key] = (val as string[]).map(Number);
      break;
    case ('int<>'):
    case ('double<>'):
    case ('decimal<>'):
      obj[key] = new Set((val as string[]).map(Number));
      break;
    case ('string'):
      obj[key] = val as string;
      break;
    case ('string[]'):
      obj[key] = val as string[];
      break;
    case ('string<>'):
      obj[key] = new Set(val as string[]);
      break;
    default:
      break;
  }
}

export { assignValToObjProp };
