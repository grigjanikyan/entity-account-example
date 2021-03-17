import { AccountId, AccountRecord } from '@S_E_C_R_E_T/types';
import { AccountTransform } from '../Transform';

describe('Account transform', () => {
  const t = new AccountTransform<AccountId, AccountRecord>({
    fields: [],
    keyColumn: 'id',
    keyColumnWritable: false,
  });

  // it('updatePassword', async () => {
  //   const f = jest.fn(() => Promise.resolve('000'));

  //   expect(t.updatePassword({ newPassword: '123' }, f)).toBe('000');
  //   expect(f).toBeCalledTimes(1);
  //   expect(f).toBeCalledWith({ newPassword: '123' });
  // });

  it('composeKeyForActivationOtp', async () => {
    expect(t.composeKeyForActivationOtp(123)).toStrictEqual('account-activation-otp-123');
  });
});
