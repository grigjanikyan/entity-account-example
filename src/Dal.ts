import {
  AccountRecord,
  AccountCredentials,
  AccountIdAndPassword,
  AccountEmail,
  AccountPassword,
  AccountProfileRecord,
} from '@S_E_C_R_E_T/types';
import { Dal as BaseDal, IUserObject, IDalMethodOptions } from '@S_E_C_R_E_T/modularity';
import { hash } from '@S_E_C_R_E_T/crypto';

export class AccountDal<TId, TRecord extends AccountRecord> extends BaseDal<TId, TRecord> {
  async hashPassword(password: string): Promise<string> {
    return hash(password);
  }

  async findByEmailAndPassword(
    credentials: AccountCredentials,
    userObject?: IUserObject,
    opts?: IDalMethodOptions,
  ): Promise<null | TRecord> {
    const query = {
      email: credentials.email,
      password: credentials.password,
    };
    return this.readOneByQuery(<TRecord>query, userObject, opts);
  }

  async findByIdAndPassword(
    credentials: AccountIdAndPassword,
    userObject?: IUserObject,
    opts?: IDalMethodOptions,
  ): Promise<null | TRecord> {
    const query = {
      id: credentials.id,
      password: await this.hashPassword(credentials.password),
    };
    return this.readOneByQuery(<TRecord>query, userObject, opts);
  }

  async findByEmail(data: AccountEmail, userObject?: IUserObject, opts?: IDalMethodOptions): Promise<null | TRecord> {
    return this.readOneByQuery(<TRecord>{ email: data.email }, userObject, opts);
  }

  async findByEmailAndConfirmation(
    data: AccountEmail,
    userObject?: IUserObject,
    opts?: IDalMethodOptions,
  ): Promise<null | TRecord> {
    return this.readOneByQuery(<TRecord>{ email: data.email, emailConfirmed: false }, userObject, opts);
  }

  async findByPassword(
    data: AccountPassword,
    userObject?: IUserObject,
    opts?: IDalMethodOptions,
  ): Promise<null | TRecord> {
    return this.readOneByQuery(<TRecord>{ email: data.email, password: data.password }, userObject, opts);
  }

  async readProfile(
    value: TId,
    userObject?: IUserObject,
    opts?: IDalMethodOptions,
  ): Promise<null | AccountProfileRecord> {
    return super.readOne(value, userObject, {
      fields: ['id', 'email', 'firstName', 'lastName', 'mobilePhone'],
      ...opts,
    });
  }
}
