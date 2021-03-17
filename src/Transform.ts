import { Transform as BaseTransform } from '@S_E_C_R_E_T/modularity';
import { hash } from '@S_E_C_R_E_T/crypto';
import {
  SessionJWTPayload,
  AccountRecord,
  AccountUpdatePasswordRecord,
  AccountSignUpRecord,
  AccountEmail,
  AccountCredentials,
  AccountProfileUpdateRecord,
  AccountRole,
} from '@S_E_C_R_E_T/types';

import config from './config';

export class AccountTransform<TId, TRecord extends AccountRecord> extends BaseTransform<TId, TRecord> {
  protected otpKeyPrefix = `account-activation-otp`;
  protected hasher = hash;

  async updatePassword(data: AccountUpdatePasswordRecord, hasher = hash): Promise<TRecord> {
    return <TRecord>{ password: await hasher(data.newPassword) };
  }

  avatarUrlFromUuid(uuid: string | null): string | null {
    return uuid ? `${config.accountAvatar.hosting}/${uuid}` : uuid;
  }

  sanitazeUserForSignIn(data: TRecord): SessionJWTPayload {
    // TODO find how to serialize pg arrays
    // tmp solution
    const roles = String(data.roles).slice(1, -1).split(',').filter(Boolean) as AccountRole[];
    return {
      id: data.id,
      roles,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: this.avatarUrlFromUuid(data.avatar),
    };
  }

  readOne(data: TRecord): TRecord {
    return {
      ...data,
      avatar: this.avatarUrlFromUuid(data.avatar),
    };
  }

  composeKeyForActivationOtp(id: TId): string {
    return `${this.otpKeyPrefix}-${id}`;
  }

  signUp(data: AccountSignUpRecord): AccountSignUpRecord {
    return {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLocaleLowerCase(),
      password: data.password.trim(),
      mobilePhone: data.mobilePhone.trim(),
    };
  }

  async hashPassword(password: string): Promise<string> {
    return this.hasher(password);
  }

  async hashPasswordForSignUp(data: AccountSignUpRecord): Promise<AccountSignUpRecord> {
    return {
      ...data,
      password: await this.hashPassword(data.password),
    };
  }

  sendNewPasswordEmail(data: AccountEmail): AccountEmail {
    return {
      email: data.email.trim().toLocaleLowerCase(),
    };
  }

  async signIn(data: AccountCredentials): Promise<AccountCredentials> {
    return {
      email: data.email,
      password: await this.hashPassword(data.password),
    };
  }

  updateProfile(data: AccountProfileUpdateRecord): AccountProfileUpdateRecord {
    return {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLocaleLowerCase(),
      mobilePhone: data.mobilePhone.trim(),
    };
  }
}
