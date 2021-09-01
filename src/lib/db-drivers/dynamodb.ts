/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AttributeValue,
  DynamoDBClient,
  TransactWriteItem,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import * as mapper from '../datatype/type-mappers/dynamodb';
import { PropType } from '../datatype/typings';
import { SchemaNotMatchError } from '../errors';
import type { Attr } from '../schema';
import { DBDriver } from './driver';
import { MaxWriteActionExceededException } from './errors';

/**
 * Class extending abstract class {@link DBDriver} for all database actions
 * with DynamoDB.
 * @sealed
 * @internal
 */
class DynamoDBDriver extends DBDriver {
  private readonly client: DynamoDBClient;
  private readonly table: string;
  private transactWriteItems: Array<TransactWriteItem> = [];

  constructor(client: DynamoDBClient, table: string) {
    super();

    this.client = client;
    this.table = table;
  }

  /**
   * Asynchronous function to commit the write transaction to the target
   * database.
   * @throws {@link MaxWriteActionExceededException}
   * Thrown if the number of write actions pending to write \> 25 as
   * transactional write operation of DynamoDB can only target up to 25
   * distinct items.
   */
  async commitWriteTransaction(): Promise<void> {
    if (this.transactWriteItems.length > 25) {
      throw new MaxWriteActionExceededException(
        this.transactWriteItems.length, 25,
      );
    }

    const command = new TransactWriteItemsCommand({
      TransactItems: this.transactWriteItems,
    });

    try {
      await this.client.send(command);
    } finally {
      this.transactWriteItems.length = 0; // resets the array.
    }

    return Promise.resolve();
  }

  /**
   * {@link TransactWriteItem} builder.
   * @param pk - Partition key.
   * @param sk - Sort Key.
   * @param elm - Data to compile to {@link TransactWriteItem}.
   * @param elmLayout - Schema which describes the layout of `elm`.
   * @returns The corresponding {@link TransactWriteItem}.
   * @throws {@link SchemaNotMatchError}
   * Thrown if any of the property in `elm` not found in `elmLayout`.
   * @internal
   */
  buildPutTransactWriteItem(
    pk: string, sk: string, elm: Record<string, unknown>, elmLayout: Attr,
  ): TransactWriteItem {
    const writeItem: TransactWriteItem = {
      Put: {
        Item: { pk: { S: pk }, sk: { S: sk } },
        TableName: this.table,
      },
    };

    Object.keys(elm).forEach((key) => {
      if (elmLayout[key] === undefined) {
        throw new SchemaNotMatchError(
          `Schema of object property \`${key}\` not found`,
        );
      }

      if (typeof elmLayout[key] === 'string') {
        writeItem.Put!.Item![key] = this.buildAttributeValue(
          elm[key], elmLayout[key] as PropType,
        );
      } else if (typeof elmLayout[key] === 'object') {
        const attrVal: { M: { [key: string]: unknown } } = { M: {} };

        Object.keys(elm[key] as Record<string, unknown>).forEach((propKey) => {
          const subObjLayout = elmLayout[key] as Record<string, PropType>;

          if (subObjLayout[propKey] === undefined) {
            throw new SchemaNotMatchError(
              `Schema of sub-object property \`${propKey}\` not found`,
            );
          }

          attrVal.M[propKey] = this.buildAttributeValue(
            (elm[key] as Record<string, unknown>)[propKey],
            subObjLayout[propKey],
          );
        });

        writeItem.Put!.Item![key] = attrVal as unknown as AttributeValue;
      }
    });

    return writeItem;
  }

  private buildAttributeValue(
    elm: unknown, propType: PropType,
  ): AttributeValue {
    const datatype = mapper.toDBDataType(propType);
    const attrVal: { [key: string]: unknown } = {};

    switch (datatype) {
      case ('S'):
        attrVal[datatype] = elm as string;
        break;
      case ('N'):
        attrVal[datatype] = (elm as number).toString();
        break;
      case ('BOOL'):
        attrVal[datatype] = elm as boolean;
        break;
      case ('SS'):
        switch (propType) {
          case ('decimal[]'):
            attrVal[datatype] = (elm as number[]).map(String);
            break;
          case ('decimal<>'):
            attrVal[datatype] = Array.from(
              elm as Set<number>, (val) => val.toString(),
            );
            break;
          case ('string[]'):
            attrVal[datatype] = elm as string[];
            break;
          case ('string<>'):
            attrVal[datatype] = elm as Set<string>;
            break;
          default: break;
        }
        break;
      case ('NS'):
        if (propType === 'int[]' || propType === 'double[]') {
          attrVal[datatype] = (elm as number[]).map(String);
        } else {
          attrVal[datatype] = Array.from(
            elm as Set<number>, (val) => val.toString(),
          );
        }
        break;
      case ('L'): {
        const arr: AttributeValue[] = [];
        if (propType === 'bool[]') {
          (elm as boolean[]).forEach((val) => { arr.push({ BOOL: val }); });
        } else {
          (elm as Set<boolean>).forEach((val) => { arr.push({ BOOL: val }); });
        }
        break;
      }
      default: break;
    }

    return attrVal as unknown as AttributeValue;
  }
}

export { DynamoDBDriver };
