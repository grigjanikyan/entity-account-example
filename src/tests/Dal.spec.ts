import { Pool } from 'pg';
import { Dal as BaseDal } from '@S_E_C_R_E_T/modularity';
import { AccountId, AccountRecord } from '@S_E_C_R_E_T/types';
import { AccountDal as Dal } from '../Dal';
import { AccountTransform } from '../Transform';

describe('LandImage dal', () => {
  it('findByEmailAndPassword', async () => {
    class Dal2<AccountId, AccountRecord2 extends AccountRecord> extends Dal<AccountId, AccountRecord2> {
      public sendNewPassword = jest.fn(async () => null);
      public createRestorePasswordToken = jest.fn(async () => 'some_token');
      public readOneByQuery = jest.fn(async (): Promise<AccountRecord2> => ({ id: 123 } as AccountRecord2));

      async hashPassword(password: string): Promise<string> {
        return `password-${password}`;
      }
    }

    const s = new Dal2<AccountId, AccountRecord>({
      queryRunner: ({} as unknown) as Pool,
      tableName: 'test',
      fields: ['id'],
      keyColumn: 'id',
      hardDelete: false,
      transform: ({} as unknown) as AccountTransform<AccountId, AccountRecord>,
    });

    const result = await s.findByEmailAndPassword(
      { email: 'email', password: 'password_hash' },
      { id: 1 },
      { throwWhenNoData: false },
    );

    expect(s.readOneByQuery).toBeCalledWith(
      { email: 'email', password: 'password_hash' },
      { id: 1 },
      { throwWhenNoData: false },
    );
    expect(result).toStrictEqual({ id: 123 });
  });

  it('findByIdAndPassword', async () => {
    class Dal2<AccountId, AccountRecord2 extends AccountRecord> extends Dal<AccountId, AccountRecord2> {
      public sendNewPassword = jest.fn(async () => null);
      public createRestorePasswordToken = jest.fn(async () => 'some_token');
      public readOneByQuery = jest.fn(async (): Promise<AccountRecord2> => ({ id: 123 } as AccountRecord2));

      async hashPassword(password: string): Promise<string> {
        return `password-${password}`;
      }
    }

    const s = new Dal2<AccountId, AccountRecord>({
      queryRunner: ({} as unknown) as Pool,
      tableName: 'test',
      fields: ['id'],
      keyColumn: 'id',
      hardDelete: false,
      transform: ({} as unknown) as AccountTransform<AccountId, AccountRecord>,
    });

    const result = await s.findByIdAndPassword(
      { id: 123, password: 'password_hash' },
      { id: 1 },
      { throwWhenNoData: false },
    );

    expect(s.readOneByQuery).toBeCalledWith(
      { id: 123, password: 'password-password_hash' },
      { id: 1 },
      { throwWhenNoData: false },
    );
    expect(result).toStrictEqual({ id: 123 });
  });

  it('findByEmail', async () => {
    class Dal2<AccountId, AccountRecord2 extends AccountRecord> extends Dal<AccountId, AccountRecord2> {
      public sendNewPassword = jest.fn(async () => null);
      public createRestorePasswordToken = jest.fn(async () => 'some_token');
      public readOneByQuery = jest.fn(
        async () =>
          ({
            id: 123,
          } as AccountRecord2),
      );
    }

    const s = new Dal2<AccountId, AccountRecord>({
      queryRunner: ({} as unknown) as Pool,
      tableName: 'test',
      fields: ['id'],
      keyColumn: 'id',
      hardDelete: false,
      transform: ({} as unknown) as AccountTransform<AccountId, AccountRecord>,
    });

    const result = await s.findByEmail({ email: 'email' }, { id: 1 }, { throwWhenNoData: false });

    expect(s.readOneByQuery).toBeCalledWith({ email: 'email' }, { id: 1 }, { throwWhenNoData: false });
    expect(result).toStrictEqual({ id: 123 });
  });

  it('findByPassword', async () => {
    class Dal2<AccountId, AccountRecord2 extends AccountRecord> extends Dal<AccountId, AccountRecord2> {
      public sendNewPassword = jest.fn(async () => null);
      public createRestorePasswordToken = jest.fn(async () => 'some_token');
      public readOneByQuery = jest.fn(
        async () =>
          ({
            id: 123,
          } as AccountRecord2),
      );
    }

    const s = new Dal2<AccountId, AccountRecord>({
      queryRunner: ({} as unknown) as Pool,
      tableName: 'test',
      fields: ['id'],
      keyColumn: 'id',
      hardDelete: false,
      transform: ({} as unknown) as AccountTransform<AccountId, AccountRecord>,
    });

    const result = await s.findByPassword(
      { email: 'test', password: 'password_hash' },
      { id: 1 },
      { throwWhenNoData: false },
    );

    expect(s.readOneByQuery).toBeCalledWith(
      { email: 'test', password: 'password_hash' },
      { id: 1 },
      { throwWhenNoData: false },
    );
    expect(result).toStrictEqual({ id: 123 });
  });

  it('readOne', async () => {
    const spy = jest.spyOn(BaseDal.prototype, 'readOne').mockImplementation(async () => {
      return null;
    });
    const d = new Dal<AccountId, AccountRecord>({
      queryRunner: ({} as unknown) as Pool,
      tableName: 'test',
      fields: ['id'],
      keyColumn: 'id',
      hardDelete: false,
      transform: ({} as unknown) as AccountTransform<AccountId, AccountRecord>,
    });

    await d.readOne(123, { id: 1 }, { throwWhenNoData: false });
    expect(spy).toHaveBeenCalledWith(123, { id: 1 }, { throwWhenNoData: false });
    spy.mockClear();
  });
});
