import { SessionJWT, SessionJWTPayload } from '@S_E_C_R_E_T/types';
import { IUserSessionRequest, IPromiseResponse } from '@S_E_C_R_E_T/middlewares';

import { PG as PgStub } from '@S_E_C_R_E_T/db-pg';

import { accountFactory as factory } from '../Factory';

describe('Account avatar', () => {
  it('upload avatar', async () => {
    const queryRunner = new PgStub([[{ id: 222, avatar: 'avatar-uuid-old' }], [{ id: 222 }]]);
    const generateUuid = jest.fn().mockReturnValue('avatar-uuid');
    const avatarStorage = {
      uploadBuffer: jest.fn().mockResolvedValue({ Location: 'url-to-avatar' }),
      remove: jest.fn().mockResolvedValue({}),
    };
    let promise = Promise.resolve();
    // eslint-disable-next-line no-return-assign
    const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
    const accountFactory = factory({
      queryRunner,
      generateUuid,
      avatarStorage,
      getCurrentDateTime: () => 'today or yesterday who knows',
    });
    const buffer = Buffer.alloc(1000, 0);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
    accountFactory.controller.uploadAvatar(
      ({
        params: { id: '111' },
        file: { buffer },
        getUser: () => ({ id: 222, roles: [] }),
      } as unknown) as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );
    const serviceResult = await promise;
    expect(queryRunner.queries).toMatchSnapshot();
    expect(avatarStorage.remove).toBeCalledWith('avatar-uuid-old');
    expect(avatarStorage.uploadBuffer).toBeCalledWith({
      fileName: 'avatar-uuid',
      buffer,
      mimeType: 'image/png',
      publicAccess: true,
      tags: [{ Key: 'accountId', Value: '222' }],
    });
    expect(serviceResult).toStrictEqual({ id: 222, avatar: 'url-to-avatar' });
  });

  it('validation check', async () => {
    const queryRunner = new PgStub([[{ id: 222, avatar: 'avatar-uuid-old' }], [{ id: 222 }]]);
    const generateUuid = jest.fn().mockReturnValue('avatar-uuid');
    const avatarStorage = {
      uploadBuffer: jest.fn().mockResolvedValue({ Location: 'url-to-avatar' }),
      remove: jest.fn().mockResolvedValue({}),
    };
    let promise = Promise.resolve();
    // eslint-disable-next-line no-return-assign
    const res = ({ promise: jest.fn((prom) => (promise = prom)) } as unknown) as IPromiseResponse;
    const accountFactory = factory({
      queryRunner,
      generateUuid,
      avatarStorage,
      getCurrentDateTime: () => 'today or yesterday who knows',
    });
    const buffer = Buffer.alloc(1000, 0);
    Buffer.from([0x89, 0x5, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
    accountFactory.controller.uploadAvatar(
      ({
        params: { id: '111' },
        file: { buffer },
        getUser: () => ({ id: 222, roles: [] }),
      } as unknown) as IUserSessionRequest<SessionJWTPayload, SessionJWT>,
      res,
    );
    try {
      await promise;
    } catch (error) {
      return expect(error.fields).toStrictEqual({ image: 'Неправильный файл изображения!' });
    }
    throw new Error('Should not be reached');
  });
});
