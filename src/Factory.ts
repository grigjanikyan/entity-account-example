import { AccountId, AccountRecord } from '@S_E_C_R_E_T/types';
import Modularity, { TAnyValue } from '@S_E_C_R_E_T/modularity';

import { AccountDal } from './Dal';
import { AccountService } from './Service';
import { AccountTransform } from './Transform';
import { AccountController } from './Controller';
import { AccountValidator } from './Validator';
import { AccountValidation } from './Validation';

export * from './Dal';
export { AccountController } from './Controller';

export function accountFactory(
  params: TAnyValue,
): Modularity<
  AccountDal<AccountId, AccountRecord>,
  AccountService<AccountId, AccountRecord>,
  AccountTransform<AccountId, AccountRecord>,
  AccountController<AccountId, AccountRecord>,
  AccountValidator<AccountId, AccountRecord>,
  AccountValidation<AccountId, AccountRecord>
> {
  return new Modularity<
    AccountDal<AccountId, AccountRecord>,
    AccountService<AccountId, AccountRecord>,
    AccountTransform<AccountId, AccountRecord>,
    AccountController<AccountId, AccountRecord>,
    AccountValidator<AccountId, AccountRecord>,
    AccountValidation<AccountId, AccountRecord>
  >({
    params: {
      tableName: 'account',
      fields: [
        'id',
        'version',
        'createdAt',
        'createdBy',
        'updatedAt',
        'updatedBy',
        'removedAt',
        'removedBy',
        'email',
        'password',
        'active',
        'firstName',
        'lastName',
        'mobilePhone',
        'roles',
      ],
      ...params,
    },
    userLayers: {
      Dal: AccountDal,
      Service: AccountService,
      Transform: AccountTransform,
      Controller: AccountController,
      Validator: AccountValidator,
      Validation: AccountValidation,
    },
  });
}
