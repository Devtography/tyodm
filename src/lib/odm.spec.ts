import { DynamoDBConfig } from './config';
import { TyODM } from './odm';

const dynamoDBConfig: DynamoDBConfig = {
  region: 'us-west-1',
  table: 'default',
  schema: new Map(),
};

it('should return true if ODM instance attached successfully', async () => {
  const odm = new TyODM(dynamoDBConfig);
  await odm.attach();

  expect(odm.attached).toBeTruthy();
});

it('should return true for ODM instance detached successfully', async () => {
  const odm = new TyODM(dynamoDBConfig);
  await odm.attach();

  expect(await odm.detach()).toBeTruthy();
});

it('should return false on attempt to detach an non-attached ODM instance',
  async () => {
    const odm = new TyODM(dynamoDBConfig);

    expect(await odm.detach()).toBeFalsy();
  });
