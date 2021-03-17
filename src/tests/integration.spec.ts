import Redis from 'ioredis';
import { SessionJWT, SessionJWTPayload, OtpGeneratePassword } from '@S_E_C_R_E_T/types';
import { IUserSessionRequest, IPromiseResponse } from '@S_E_C_R_E_T/middlewares';
import { S_E_C_R_E_TMailer } from '@S_E_C_R_E_T/email';
import { S_E_C_R_E_TSMS } from '@S_E_C_R_E_T/sms';

import { PG as PgStub } from '@S_E_C_R_E_T/db-pg';
import { Redis as RedisStub } from '@S_E_C_R_E_T/db-redis';

import { otpFactory } from '@S_E_C_R_E_T/entity-otp';
import { accountFactory as factory } from '../Factory';

describe('Account', () => {
  it('updatePassword', async () => {
    const password =
      '73f4a33d231345c656d72cdcbeceaa7543ab9f1e06c87a07d1fc83d21f579c00183fb3cffec3604e328331250695901707e6459a6db42562ba86bb20247b0663';
    const results = [[{ password }], [{ id: 3 }]];

    const queryRunner = new PgStub(results);
    const accountFactory = factory({ queryRunner, getCurrentDateTime: () => 'sommee1etime' });
    let promise = Promise.resolve();
    // eslint-disable-next-line no-return-assign
    const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
    accountFactory.controller.updatePassword(
      {
        body: { oldPassword: 'test12345', newPassword: 'test123456' },
        getUser: () => ({ id: 3 }),
      } as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );

    const serviceResult = await promise;
    expect(queryRunner.queries).toMatchSnapshot();
    expect(res.promise).toBeCalled();
    expect(serviceResult).toStrictEqual({ id: 3 });
  });

  it('sendNewPasswordEmail', async () => {
    const results = [[{ password: 'user_pass' }]];
    const queryRunner = new PgStub(results);
    const mailer = {
      restorePassword: jest.fn(),
    };
    const jwt = {
      createRestorePasswordToken: jest.fn(() => "actually it's a hashed password inside JWT"),
    };
    const accountFactory = factory({
      queryRunner,
      mailer: (mailer as unknown) as S_E_C_R_E_TMailer,
      jwt,
    });
    let promise = Promise.resolve();
    // eslint-disable-next-line no-return-assign
    const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
    accountFactory.controller.sendNewPasswordEmail(
      {
        body: { email: ' emAiL@domAhhhin.cOm ' },
        getUser: () => ({ id: 3 }),
      } as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );

    const serviceResult = await promise;
    expect(queryRunner.queries).toMatchSnapshot();
    expect(res.promise).toBeCalled();
    expect(mailer.restorePassword).toBeCalledWith(
      { email: 'email@domahhhin.com' },
      {
        password: "actually it's a hashed password inside JWT",
      },
    );
    expect(serviceResult).toStrictEqual(null);
  });

  it('signUp', async () => {
    const results = [[{}], [{}], [{ id: 1112 }]];
    const queryRunner = new PgStub(results);
    const mailer = {
      confirmEmail: jest.fn(),
    };
    const jwt = {
      createEmailToken: jest.fn(() => "actually it's a hashed email inside JWT"),
    };
    const accountFactory = factory({
      queryRunner,
      mailer: (mailer as unknown) as S_E_C_R_E_TMailer,
      jwt,
      getCurrentDateTime: () => 'somme2eetime',
    });
    let promise = Promise.resolve();
    // eslint-disable-next-line no-return-assign
    const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
    accountFactory.controller.createUser(
      {
        body: {
          firstName: ' firstName ',
          lastName: ' lastName ',
          email: ' emAiL@domAin.cOm ',
          password: ' superPassword1234+ ',
          mobilePhone: ' +380971707070 ',
        },
        getUser: () => ({ id: 3 }),
      } as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );

    const serviceResult = await promise;
    expect(queryRunner.queries).toMatchSnapshot();
    expect(res.promise).toBeCalled();
    expect(mailer.confirmEmail).toBeCalledWith(
      { email: 'email@domain.com', firstName: 'firstName' },
      { token: "actually it's a hashed email inside JWT" },
    );
    expect(serviceResult).toStrictEqual({ id: 1112 });
  });

  it('createActivationOtp', async () => {
    const redis = new RedisStub([null, 'OK']);
    const sendSms = jest.fn();
    const generatePassword = jest.fn(() => '12345');
    const otp = otpFactory({
      db: (redis as unknown) as Redis.Redis,
      sms: ({ otp: sendSms } as unknown) as S_E_C_R_E_TSMS,
      generatePassword,
    });
    const results = [
      [{ count: '1' }],
      [{ id: 768, mobilePhone: 'phone', mobilePhoneConfirmed: false }],
      [{ id: 768, mobilePhone: 'phone' }],
    ];
    const queryRunner = new PgStub(results);
    const accountFactory = factory({ queryRunner, otpService: otp.service });
    let promise = Promise.resolve();
    // eslint-disable-next-line no-return-assign
    const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
    accountFactory.controller.createActivationOtp(
      {
        body: { id: 768 },
        getUser: () => ({ id: 3 }),
      } as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );

    const serviceResult = await promise;
    expect(queryRunner.queries).toMatchSnapshot();
    expect(redis.queries).toMatchSnapshot();
    expect(res.promise).toBeCalled();
    expect(sendSms).toBeCalledWith({ code: '12345', phoneNumber: 'phone' });
    expect(generatePassword).toBeCalledWith({
      length: 5,
      lowercase: false,
      numbers: true,
      symbols: false,
      uppercase: false,
    });
    expect(serviceResult).toStrictEqual({ canRepeatAfterSeconds: 60 });
  });

  it('confirmActivationOtp', async () => {
    const redis = new RedisStub(['89768', 1]);
    const otp = otpFactory({
      db: (redis as unknown) as Redis.Redis,
      sms: ({} as unknown) as S_E_C_R_E_TSMS,
      generatePassword: ({} as unknown) as OtpGeneratePassword,
    });
    const results = [[{ count: '1' }], [{ id: 4356 }]];
    const queryRunner = new PgStub(results);
    const accountFactory = factory({ queryRunner, otpService: otp.service, getCurrentDateTime: () => 'somme3etime' });
    let promise = Promise.resolve();
    // eslint-disable-next-line no-return-assign
    const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
    accountFactory.controller.confirmActivationOtp(
      {
        body: { id: 4356, otp: 89768 },
        getUser: () => ({ id: 3 }),
      } as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );
    const serviceResult = await promise;
    expect(queryRunner.queries).toMatchSnapshot();
    expect(redis.queries).toMatchSnapshot();
    expect(res.promise).toBeCalled();
    expect(serviceResult).toStrictEqual({ id: 4356 });
  });

  it('restorePasswordByToken', async () => {
    const results = [[{ id: 4356, email: 'some email' }], [{ id: 4356 }]];
    const queryRunner = new PgStub(results);
    const jwt = {
      verifyRestorePasswordToken: jest.fn(() => ({ email: 'emaila', password: 'passworda' })),
    };
    const mailer = {
      passwordChanged: jest.fn(),
    };
    const accountFactory = factory({ queryRunner, jwt, mailer, getCurrentDateTime: () => 'sommee4etime' });
    let promise = Promise.resolve();
    // eslint-disable-next-line no-return-assign
    const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
    accountFactory.controller.restorePasswordByToken(
      {
        body: { token: 'ksjdhfgkf', password: 'test12345+' },
        getUser: () => ({ id: 3 }),
      } as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );
    const serviceResult = await promise;
    expect(queryRunner.queries).toMatchSnapshot();
    expect(res.promise).toBeCalled();
    expect(serviceResult).toStrictEqual(null);
  });

  it('confirmEmailByToken', async () => {
    const queryRunner = new PgStub([[{ id: 876, emailConfirmed: false }], [{ id: 876 }]]);
    const jwt = {
      verifyEmailToken: jest.fn(() => ({ id: 876 })),
    };
    const res = ({ redirect: jest.fn() } as unknown) as IPromiseResponse;
    const next = jest.fn();
    const accountFactory = factory({ queryRunner, jwt, getCurrentDateTime: () => 'sommee4etime123' });
    await accountFactory.controller.confirmEmailByToken(
      ({
        query: { token: 'ksj3434534dhfgkf' },
        getUser: () => ({ id: 3 }),
      } as unknown) as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
      next,
    );
    expect(queryRunner.queries).toMatchSnapshot();
    expect(next).toBeCalledTimes(0);
    expect(res.redirect).toBeCalledWith(302, 'http://localhost:8080/email-confirmed-successfully');
  });

  describe('update user', () => {
    it('email changed', async () => {
      const results = [
        [
          {
            id: 66666,
            email: 'email@dom1.com',
            firstName: 'firstNadfgme',
            lastName: 'lastdsfName',
            mobilePhone: '+380971705670',
          },
        ],
        [{ id: 66666 }],
      ];
      const queryRunner = new PgStub(results);
      const mailer = {
        confirmEmail: jest.fn(),
      };
      const jwt = {
        createEmailToken: jest.fn(() => "actually it's a hashed email inside JWT123123123123"),
      };
      const accountFactory = factory({
        queryRunner,
        mailer: (mailer as unknown) as S_E_C_R_E_TMailer,
        jwt,
        getCurrentDateTime: () => 'sommee5etime',
      });
      let promise = Promise.resolve();
      // eslint-disable-next-line no-return-assign
      const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
      accountFactory.controller.update(
        ({
          params: {
            id: '66666',
          },
          body: {
            firstName: ' firstNadfgme ',
            lastName: ' lastdsfName ',
            email: ' emAiL@dom2.cOm ',
            password: ' superPsword1234+ ',
            mobilePhone: ' +380971705670 ',
          },
          getUser: () => ({ id: 356 }),
        } as unknown) as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
        res,
      );

      const serviceResult = await promise;
      expect(queryRunner.queries).toMatchSnapshot();
      expect(res.promise).toBeCalled();
      expect(mailer.confirmEmail).toBeCalledWith(
        { email: 'email@dom2.com', firstName: 'firstNadfgme' },
        { token: "actually it's a hashed email inside JWT123123123123" },
      );
      expect(serviceResult).toStrictEqual({ id: 66666 });
    });

    it('email same', async () => {
      const results = [
        [
          {
            id: 66666,
            email: 'email@dom1.com',
            firstName: 'firstNadfgme',
            lastName: 'lastdsfName',
            mobilePhone: '+380971705670',
          },
        ],
        [{ id: 66666 }],
      ];
      const queryRunner = new PgStub(results);
      const mailer = {
        confirmEmail: jest.fn(),
      };
      const jwt = {
        createEmailToken: jest.fn(() => "actually it's a hashed email inside JWT123123123123"),
      };
      const accountFactory = factory({
        queryRunner,
        mailer: (mailer as unknown) as S_E_C_R_E_TMailer,
        jwt,
        getCurrentDateTime: () => 'sommeee6time',
      });
      let promise = Promise.resolve();
      // eslint-disable-next-line no-return-assign
      const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
      accountFactory.controller.update(
        ({
          params: {
            id: '66666',
          },
          body: {
            firstName: ' firstNadfgme ',
            lastName: ' lastdsfName ',
            email: ' emAiL@dom1.cOm ',
            password: ' superPsword1234+ ',
            mobilePhone: ' +380971705670 ',
          },
          getUser: () => ({ id: 356 }),
        } as unknown) as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
        res,
      );

      const serviceResult = await promise;
      expect(queryRunner.queries).toMatchSnapshot();
      expect(res.promise).toBeCalled();
      expect(mailer.confirmEmail).toBeCalledTimes(0);
      expect(serviceResult).toStrictEqual({ id: 66666 });
    });
  });
});
