import { AccountId, AccountRecord, SessionJWT, SessionJWTPayload } from '@S_E_C_R_E_T/types';
import { IUserSessionRequest, IPromiseResponse } from '@S_E_C_R_E_T/middlewares';

import { AccountController } from '../Controller';
import { AccountService } from '../Service';
import { AccountTransform } from '../Transform';

describe('Account controller', () => {
  it('createActivationOtp', async () => {
    const res = ({ promise: jest.fn(async () => null) } as unknown) as IPromiseResponse;
    const s = { createActivationOtp: jest.fn(async () => null) };
    const c = new AccountController<AccountId, AccountRecord>({
      service: (s as unknown) as AccountService<AccountId, AccountRecord>,
      transform: {} as AccountTransform<AccountId, AccountRecord>,
    });

    await c.createActivationOtp({ body: { id: 654321 } } as IUserSessionRequest<SessionJWTPayload, SessionJWT>, res);

    expect(s.createActivationOtp).toBeCalledTimes(1);
    expect(s.createActivationOtp).toBeCalledWith({ id: 654321 });
    expect(res.promise).toBeCalledTimes(1);
    expect(res.promise).toBeCalledWith(Promise.resolve({ canRepeatAfterSeconds: 1234566 }));
  });

  it('confirmActivationOtp', async () => {
    const res = ({ promise: jest.fn(async () => null) } as unknown) as IPromiseResponse;
    const s = { confirmActivationOtp: jest.fn(async () => null) };
    const c = new AccountController<AccountId, AccountRecord>({
      service: (s as unknown) as AccountService<AccountId, AccountRecord>,
      transform: {} as AccountTransform<AccountId, AccountRecord>,
    });

    await c.confirmActivationOtp(
      { body: { id: 123, otp: 456 } } as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );

    expect(s.confirmActivationOtp).toBeCalledTimes(1);
    expect(s.confirmActivationOtp).toBeCalledWith({ id: 123, otp: 456 });
    expect(res.promise).toBeCalledTimes(1);
    expect(res.promise).toBeCalledWith(Promise.resolve({ id: 123 }));
  });

  it('sendNewPasswordEmail', async () => {
    const res = ({ promise: jest.fn(async () => null) } as unknown) as IPromiseResponse;
    const getUser = jest.fn(() => ({ id: 2 }));
    const s = { sendNewPasswordEmail: jest.fn(async () => null) };
    const c = new AccountController<AccountId, AccountRecord>({
      service: (s as unknown) as AccountService<AccountId, AccountRecord>,
      transform: {} as AccountTransform<AccountId, AccountRecord>,
    });

    await c.sendNewPasswordEmail(
      ({ body: { email: 'some email' }, getUser } as unknown) as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );

    expect(s.sendNewPasswordEmail).toBeCalledWith({ email: 'some email' }, { id: 2 });
    expect(res.promise).toBeCalledWith(Promise.resolve({ id: 123 }));
  });

  it('restorePasswordByToken', async () => {
    const res = ({ promise: jest.fn(async () => null) } as unknown) as IPromiseResponse;
    const getUser = jest.fn(() => ({ id: 2 }));
    const s = { restorePasswordByToken: jest.fn(async () => null) };
    const c = new AccountController<AccountId, AccountRecord>({
      service: (s as unknown) as AccountService<AccountId, AccountRecord>,
      transform: {} as AccountTransform<AccountId, AccountRecord>,
    });

    await c.restorePasswordByToken(
      ({ body: { token: 'token', password: 'password' }, getUser } as unknown) as IUserSessionRequest<
        SessionJWTPayload,
        SessionJWT
      >,
      res,
    );

    expect(s.restorePasswordByToken).toBeCalledWith({ token: 'token', password: 'password' }, { id: 2 });
    expect(res.promise).toBeCalledWith(Promise.resolve({ id: 123 }));
  });
});
