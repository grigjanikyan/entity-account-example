import { uuid } from 'uuidv4';

import { S_E_C_R_E_TMailer } from '@S_E_C_R_E_T/email';
import { S_E_C_R_E_TJwt } from '@S_E_C_R_E_T/jwt';
import { S_E_C_R_E_TS3 } from '@S_E_C_R_E_T/s3';

import { pgrw as queryRunner } from '@S_E_C_R_E_T/db-pg';
import { otp } from '@S_E_C_R_E_T/entity-otp';

import { accountFactory } from './Factory';
import config from './config';

export * from './Dal';
export * from './Transform';
export * from './Service';
export * from './Validator';
export { config };
export * from './Factory';

export const account = accountFactory({
  queryRunner,
  otpService: otp.service,
  jwt: new S_E_C_R_E_TJwt(),
  mailer: new S_E_C_R_E_TMailer(),
  avatarStorage: new S_E_C_R_E_TS3({ bucket: config.accountAvatar.bucket }),
  generateUuid: uuid,
});
