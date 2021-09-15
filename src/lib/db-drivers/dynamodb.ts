/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AttributeValue,
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  TransactWriteItem,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { InvalidPropertyError } from '../../utils/errors';
import * as mapper from '../datatype/type-mappers/dynamodb';
import { PropType } from '../datatype/typings';
import { InvalidSchemaError, SchemaNotMatchError } from '../errors';
import type { Obj } from '../object';
import type { Attr, Prop } from '../schema';
import { DBDriver } from './driver';
import {
  MaxWriteActionExceededError, NonCompatibleDBRecordError,
} from './errors';

/**
 * Class extending abstract class {@link DBDriver} for all database actions
 * with DynamoDB.
 * @sealed
 * @internal
 */
class DynamoDBDriver extends DBDriver {
  private readonly client: DynamoDBClient;
  private readonly table: string;
  readonly transactWriteItems: Array<TransactWriteItem> = [];

  constructor(client: DynamoDBClient, table: string) {
    super();

    this.client = client;
    this.table = table;
  }

  /**
   * Retrieve all records of a TyODM object by its' identifier
   * (a.k.a. partition key)
   * @param objId - Partition key of the target records.
   * @param Type - Type of the target TyODM object.
   * @returns TyODM object filled with associated records, or `undefined` if
   * no relevant record found.
   * @throws {@link NonCompatibleDBRecordError}
   * Thrown if either attribute `pk` or `sk` not found in item(s) retrieved
   * from database.
   */
  async getObjById<T extends Obj>(
    objId: string, Type: { new(objId: string): T },
  ): Promise<T | undefined> {
    const queryCmd: QueryCommandInput = {
      TableName: this.table,
      KeyConditionExpression: 'pk = :value',
      ExpressionAttributeValues: { ':value': { S: `${Type.name}#${objId}` } },
    };

    // Read from database
    let getResults = await this.client.send(new QueryCommand(queryCmd));

    // No record found in database
    if (getResults.Count === 0) { return undefined; }

    const items = getResults.Items!; // array of records.

    // Keep requesting records until there's no more.
    // (Due to 25 unique items limit from DynamoDB)
    while (getResults.LastEvaluatedKey !== undefined
      && Object.keys(getResults.LastEvaluatedKey).length !== 0) {
      queryCmd.ExclusiveStartKey = getResults.LastEvaluatedKey;

      // eslint-disable-next-line no-await-in-loop
      getResults = await this.client.send(new QueryCommand(queryCmd));

      if (getResults.Count !== 0) { items.push(...getResults.Items!); }
    }

    // Should have a partition key `pk` in the record.
    if (items[0].pk.S === undefined) {
      throw new NonCompatibleDBRecordError('Attribute `pk` not found in '
        + 'retrieved item. Cannot extract object identifier.');
    }

    // New obj with PK from database
    const obj = new Type(items[0].pk.S.split('#')[1]);

    // Loops the records retrieved from database.
    items.forEach((item) => {
      // Should have a sort key `sk` in the record.
      if (item.sk.S === undefined) {
        throw new NonCompatibleDBRecordError('Attribute `sk` not found in '
          + 'retrieved item');
      }

      const isCollection = item.sk.S.includes('#');
      const sk = isCollection ? item.sk.S.split('#')[0] : item.sk.S;

      // Skip this item if its' `sk` doesn't exist in the schema.
      if (!Object.keys(obj.objectSchema().props).includes(sk)) { return; }

      const propSchema = obj.objectSchema().props[sk];
      const prop: Record<string, unknown> = {};

      // Loops the item object properties.
      Object.keys(item).filter((key) => this.filterPkSk(key)).forEach((key) => {
        // Skip this property if it doesn't exist in the schema.
        if (!Object.keys(propSchema.attr).includes(key)) { return; }

        if (typeof propSchema.attr[key] === 'string') {
          mapper.assignValToObjProp(item[key],
            propSchema.attr[key] as PropType, prop, key);
        } else if (typeof propSchema.attr[key] === 'object') {
          prop[key] = {};
          const attr = prop[key] as Record<string, unknown>;

          const subObj = item[key].M;
          // Skip this object property if its' sub-object is empty.
          if (subObj === undefined) { return; }

          // Loops the properties of sub-object.
          Object.keys(subObj).forEach((subKey) => {
            // Skip this property if it doesn't exist in the schema.
            if (!Object.keys(propSchema.attr[key]).includes(subKey)) {
              return;
            }

            mapper.assignValToObjProp(subObj[subKey],
              (propSchema.attr[key] as Record<string, PropType>)[subKey],
              attr, subKey);
          }); // end sub-object foreach
        }
      }); // end item object foreach

      // Value assignment to the object initialised.
      if (isCollection) {
        if (obj[sk as keyof T] === undefined) {
          obj[sk as keyof T] = new Map() as T[keyof T];
        }

        const map = obj[sk as keyof T] as Map<string, Record<string, unknown>>;
        const identifier = item.sk.S.split('#')[1];
        map.set(identifier, prop);
      } else {
        obj[sk as keyof T] = prop as T[keyof T];
      }
    }); // end records foreach

    return obj;
  }

  // #region Implement functions from DBDriver
  /**
   * Processes the entire TyODM object to a collection of
   * {@link TransactWriteItem} to prepare the data for being write into the
   * targeted DynamoDB.
   * @param obj - TyODM data object to insert to DynamoDB.
   * @throws {@link SchemaNotMatchError}
   * Thrown if the schema defined for the object doesn't appear to completely
   * matches the properties found in the object.
   * @throws {@link InvalidSchemaError}
   * Thrown if `type` of any property is neither `'single'` nor `'collection'`,
   * or value of `identifier` is missing for type `'collection'`.
   * @throws {@link InvalidPropertyError}
   * Thrown if any of the top level class property found other than the
   * identifier defined isn't an object.
   */
  insertObj<T extends Obj>(obj: T): void {
    Object.keys(obj).forEach((key) => {
      // Skips property for top level identifier (a.k.a PK)
      if (key === 'objId' || key === obj.objectSchema().identifier) {
        return;
      }

      const propLayout = obj.objectSchema().props[key];

      if (propLayout === undefined) {
        throw new SchemaNotMatchError(
          `Schema of property \`${key}\` not found`,
        );
      }

      const pk = `${obj.objectSchema().name}#${obj.objectId}`;
      const prop = obj[key as keyof T] as unknown;

      if (typeof prop !== 'object') {
        throw new InvalidPropertyError(
          `Property \`${key}: ${typeof prop}\` is not valid for a TyODM object`,
        );
      }

      switch (propLayout.type) {
        case ('single'):
          if (prop instanceof Map) {
            throw new SchemaNotMatchError(
              `Property \`${key}\` is an instance of \`Map\` but defined as `
              + `\`collection\` in schema section \`${key}.type\``,
            );
          }

          this.transactWriteItems.push(
            this.buildPutTransactWriteItem(
              pk, key, prop as Record<string, unknown>, propLayout.attr,
            ),
          );
          break;
        case ('collection'):
          if (!(prop instanceof Map)) {
            throw new SchemaNotMatchError(
              `Property \`${key}\` isn't an instance of \`Map\` but defined `
              + `as \`collection\` in schema section \`${key}.type\``,
            );
          }

          if (propLayout.identifier === undefined) {
            throw new InvalidSchemaError(
              `Value of \`identifier\` is missing on property \`${key}\``,
            );
          }

          // Iterates the `Map`
          (prop as Map<string, Record<string, unknown>>)
            .forEach((elm, identifier) => {
              const sk = `${key}#${identifier}`;

              this.transactWriteItems.push(
                this.buildPutTransactWriteItem(pk, sk, elm, propLayout.attr),
              );
            });

          break;
        default:
          throw new InvalidSchemaError(
            'Invalid property type. `type` of property must be either '
            + '\'single\' or \'collection\'',
          );
      }
    });
  }

  /**
   * Prepare the {@link TransactWriteItem} form the data element entry to ready
   * for the write transaction to be committed to the database.
   * @param pk - Partition key of the data to write into database.
   * @param elm - Data element to write.
   * @param propName - Name of the property the data element belongs to / under.
   * @param propLayout - Schema of the property / `elm` object.
   * @throws {@link InvalidSchemaError}
   * Thrown if` type` of any property is neither `'single'` nor `'collection'`,
   * or value of `identifier` is missing for type `'collection'`.
   */
  insertOne(
    pk: string, elm: Record<string, unknown>,
    propName: string, propLayout: Prop,
  ): void {
    let sk = '';

    if (propLayout.type === 'single') {
      sk = propName;
    } else if (propLayout.type === 'collection') {
      if (propLayout.identifier === undefined) {
        throw new InvalidSchemaError(
          'Value of `identifier` is missing in the schema provided but '
          + '`type` is set as `\'collection\'`',
        );
      }

      sk = `${propName}#${elm[propLayout.identifier] as string}`;
    } else {
      throw new InvalidSchemaError(
        'Invalid property type. `type` of property must be either '
        + '\'single\' or \'collection\'',
      );
    }

    this.transactWriteItems.push(
      this.buildPutTransactWriteItem(pk, sk, elm, propLayout.attr),
    );
  }

  /**
   * Prepare the {@link TransactWriteItem} of delete an item action by using the
   * `pk` & `sk` to ready for the write transaction to be committed to the
   * database.
   * @param pk - Partition key of the target item.
   * @param sk - Sort key of the target item.
   */
  deleteOne(pk: string, sk: string): void {
    const writeItem: TransactWriteItem = {
      Delete: {
        Key: { pk: { S: pk }, sk: { S: sk } },
        TableName: this.table,
      },
    };

    this.transactWriteItems.push(writeItem);
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
      throw new MaxWriteActionExceededError(
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

  cancelWriteTransaction(): void {
    this.transactWriteItems.length = 0; // resets the array.
  }
  // #endregion

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

  /**
   * Support function to filter keys `pk` & `sk` from database items retrieved.
   */
  private filterPkSk(val: string): boolean {
    if (val.toLowerCase() === 'pk' || val.toLowerCase() === 'sk') {
      return false;
    }

    return true;
  }
}

export { DynamoDBDriver };
