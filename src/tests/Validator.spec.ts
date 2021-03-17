import { S_E_C_R_E_TJwt } from '@S_E_C_R_E_T/jwt';
import { AccountId, AccountRecord } from '@S_E_C_R_E_T/types';

import { AccountDal } from '../Dal';
import { AccountValidator } from '../Validator';
import { AccountTransform } from '../Transform';

describe('Account validator', () => {
  const v = new AccountValidator<AccountId, AccountRecord>({
    jwt: new S_E_C_R_E_TJwt(),
    dal: ({} as unknown) as AccountDal<AccountId, AccountRecord>,
    fields: [],
    transform: ({} as unknown) as AccountTransform<AccountId, AccountRecord>,
  });

  describe('validConfirmEmailJWT', () => {
    it('valid', async () => {
      const verifyEmailToken = jest.fn().mockResolvedValue('');
      // eslint-disable-next-line no-shadow
      const v = new AccountValidator<AccountId, AccountRecord>({
        jwt: ({ verifyEmailToken } as unknown) as S_E_C_R_E_TJwt,
        dal: ({} as unknown) as AccountDal<AccountId, AccountRecord>,
        fields: [],
        transform: ({} as unknown) as AccountTransform<AccountId, AccountRecord>,
      });
      const v2 = v.validConfirmEmailJWT();
      expect(await v2('some-jwt-value', { propName: '', source: {} })).toBe(null);
      expect(verifyEmailToken).toBeCalledWith('some-jwt-value');
    });

    it('invalid', async () => {
      const verifyEmailToken = jest.fn().mockRejectedValue('');
      // eslint-disable-next-line no-shadow
      const v = new AccountValidator<AccountId, AccountRecord>({
        jwt: ({ verifyEmailToken } as unknown) as S_E_C_R_E_TJwt,
        dal: ({} as unknown) as AccountDal<AccountId, AccountRecord>,
        fields: [],
        transform: ({} as unknown) as AccountTransform<AccountId, AccountRecord>,
      });
      const v2 = v.validConfirmEmailJWT();
      expect(await v2('some-jwt-value', { propName: '', source: {} })).toBe('Невозможно подтвердить ваш токен');
      expect(verifyEmailToken).toBeCalledWith('some-jwt-value');
    });
  });

  describe('image', () => {
    it('png', async () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const v2 = v.image();
      expect(await v2(buffer, { propName: 'image', source: {} })).toBe(null);
    });

    it('jpeg', async () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xee, 0x0d, 0x0a, 0x1a, 0x0a]);
      const v2 = v.image();
      expect(await v2(buffer, { propName: 'image', source: {} })).toBe(null);
    });

    it('error', async () => {
      const buffer = Buffer.from([0x88, 0x5, 0x4e, 0x13, 0x0d, 0x0a, 0x1a, 0x0a]);
      const v2 = v.image();
      expect(await v2(buffer, { propName: 'image', source: {} })).toBe('Неправильный файл изображения!');
    });

    it('throwed', async () => {
      const v2 = v.image();
      expect(await v2(new Error(), { propName: 'image', source: {} })).toBe('Неправильный файл изображения!');
    });
  });
});
