import Apn from 'awesome-phonenumber';
import imageType from 'image-type';

import { Validator as BaseValidator, IValidatorOptions as IValidatorOptionsBase } from '@S_E_C_R_E_T/modularity';
import { IValidator, arrayLengthBetweenOrEqual } from '@S_E_C_R_E_T/validation';
import { S_E_C_R_E_TJwt } from '@S_E_C_R_E_T/jwt';

import { AccountId, AccountRecord } from '@S_E_C_R_E_T/types';
import { AccountDal } from './Dal';

interface IValidatorOptions<TId extends AccountId, TRecord extends AccountRecord>
  extends IValidatorOptionsBase<TId, TRecord> {
  dal: AccountDal<TId, TRecord>;
  jwt: S_E_C_R_E_TJwt;
}

export class AccountValidator<TId extends AccountId, TRecord extends AccountRecord> extends BaseValidator<
  TId,
  TRecord
> {
  dal: AccountDal<TId, TRecord>;
  protected jwt: S_E_C_R_E_TJwt;

  constructor(opts: IValidatorOptions<TId, TRecord>) {
    super(opts);
    this.dal = opts.dal;
    this.jwt = opts.jwt;

    this.emailAndPassCredentials = this.emailAndPassCredentials.bind(this);
    this.emailActive = this.emailActive.bind(this);
    this.idAndPassCredentials = this.idAndPassCredentials.bind(this);
    this.phoneNotActive = this.phoneNotActive.bind(this);
    this.validEmailJWT = this.validEmailJWT.bind(this);
    this.validConfirmEmailJWT = this.validConfirmEmailJWT.bind(this);
    this.accountShouldNotExist = this.accountShouldNotExist.bind(this);
  }

  emailAndPassCredentials(): IValidator {
    return async (fieldValue, options) => {
      if (!options.source?.email) {
        return null;
      }
      const query = {
        email: options.source?.email,
        password: fieldValue,
      };
      return this.dal
        .findByEmailAndPassword(query, undefined, { throwWhenNoData: false })
        .then((res) => (res ? null : 'Неверные учетные данные'));
    };
  }

  accountShouldNotExist(): IValidator {
    return async (fieldValue) => {
      return this.dal.findByEmail({ email: fieldValue }, undefined, { throwWhenNoData: false }).then((res) => {
        if (!res) {
          return null;
        }
        return 'Учетный запись уже существует';
      });
    };
  }

  emailActive(): IValidator {
    return async (fieldValue) => {
      return this.dal.findByEmail({ email: fieldValue }, undefined, { throwWhenNoData: false }).then((res) => {
        if (!res) {
          return null;
        }
        if (!res.emailConfirmed && !res.mobilePhoneConfirmed && !res.active) {
          return 'Учетный запись не активна';
        }
        return null;
      });
    };
  }

  phoneNotActive(): IValidator {
    return async (fieldValue) => {
      return this.dal.readOne(fieldValue, undefined, { throwWhenNoData: false }).then((res) => {
        if (res?.mobilePhone && !res?.mobilePhoneConfirmed) {
          return null;
        }
        return 'Мобильный телефон не подтверждён';
      });
    };
  }

  idAndPassCredentials(): IValidator {
    return async (fieldValue, options) => {
      if (!options.source?.id || !options.source?.oldPassword) {
        return 'Неправильный пароль';
      }

      const query = {
        id: options.source?.id,
        password: options.source?.oldPassword,
      };

      return this.dal
        .findByIdAndPassword(query, undefined, { throwWhenNoData: false })
        .then((res) => (res ? null : 'Неправильный пароль'));
    };
  }

  newPasswordCantBeTheSame(): IValidator {
    return (fieldValue, options) => {
      if (options.source?.oldPassword === options.source?.newPassword) {
        return 'Новый пароль не может совпадать со старым!';
      }
      return null;
    };
  }

  userName(from = 2, to = 30, path?: string): IValidator {
    return arrayLengthBetweenOrEqual(from, to, path);
  }

  phone(msg = 'Неправильный номер телефона'): IValidator {
    return async (value) => {
      return new Apn(value).isValid() ? null : msg;
    };
  }

  validEmailJWT(msg = 'Токен недействителен'): IValidator {
    return async (value) => {
      try {
        await this.jwt.verifyRestorePasswordToken(value);
        return null;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        return msg;
      }
    };
  }

  passwordMustBeDifferentFromNewPasswordHash(msg = 'Пароли должны быть разными'): IValidator {
    return (value, options) => {
      if (value === options.source.newPasswordHash) {
        return msg;
      }
      return null;
    };
  }

  validConfirmEmailJWT(msg = 'Невозможно подтвердить ваш токен'): IValidator {
    return async (value) => {
      try {
        await this.jwt.verifyEmailToken(value);
        return null;
      } catch (error) {
        return msg;
      }
    };
  }

  image(msg = 'Неправильный файл изображения!'): IValidator {
    return async (value) => {
      try {
        const result = imageType(value);
        return ['image/jpeg', 'image/png'].includes(result?.mime || '') ? null : msg;
      } catch (error) {
        return msg;
      }
    };
  }
}
