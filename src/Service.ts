import { uuid } from 'uuidv4';
import imageType from 'image-type';

import {
  Service as BaseService,
  IServiceOptions as IServiceOptionsBase,
  IDalOptions,
  IUserObject,
} from '@S_E_C_R_E_T/modularity';
import { S_E_C_R_E_TS3 } from '@S_E_C_R_E_T/s3';
import { S_E_C_R_E_TMailer } from '@S_E_C_R_E_T/email';
import { S_E_C_R_E_TJwt } from '@S_E_C_R_E_T/jwt';
import { ValidationError } from '@S_E_C_R_E_T/validation';
import {
  SessionJWTPayload,
  AccountUpdatePasswordRecord,
  AccountEmail,
  AccountIdRecord,
  AccountCreateOtpResult,
  AccountOtpActivationRecord,
  AccountId,
  AccountRecord,
  AccountRestorePasswordByToken,
  AccountSignUpRecord,
  OtpRecord,
  AccountCredentials,
  AccountProfileRecord,
  AccountProfileUpdateRecord,
  AccountEmailConfirmRecord,
  AccountConfirmEmailByToken,
  AccountAvatarFile,
  AccountIdAndAvatar,
} from '@S_E_C_R_E_T/types';

import { OtpService } from '@S_E_C_R_E_T/entity-otp';

import { AccountDal } from './Dal';
import { AccountTransform } from './Transform';
import { AccountValidation } from './Validation';

interface IServiceOptions<TId extends AccountId, TRecord extends AccountRecord>
  extends IServiceOptionsBase<TId, TRecord> {
  dal: AccountDal<TId, TRecord>;
  transform: AccountTransform<TId, TRecord>;
  validation: AccountValidation<TId, TRecord>;
  otpService: OtpService<OtpRecord>;
  mailer: S_E_C_R_E_TMailer;
  jwt: S_E_C_R_E_TJwt;
  avatarStorage: S_E_C_R_E_TS3;
  generateUuid: typeof uuid;
}

export class AccountService<TId extends AccountId, TRecord extends AccountRecord> extends BaseService<TId, TRecord> {
  dal: AccountDal<TId, TRecord>;
  transform: AccountTransform<TId, TRecord>;
  validation: AccountValidation<TId, TRecord>;

  protected otpService: OtpService<OtpRecord>;
  protected mailer: S_E_C_R_E_TMailer;
  protected jwt: S_E_C_R_E_TJwt;
  protected avatarStorage: S_E_C_R_E_TS3;
  protected generateUuid: typeof uuid;

  protected sendEmailToNewUser = true;
  protected otpPasswordTimeOut = 60;
  protected reconfirmEmailAfterChange = true;

  constructor(opts: IServiceOptions<TId, TRecord>) {
    super(opts);
    this.dal = opts.dal;
    this.transform = opts.transform;
    this.validation = opts.validation;
    this.otpService = opts.otpService;
    this.mailer = opts.mailer;
    this.jwt = opts.jwt;
    this.avatarStorage = opts.avatarStorage;
    this.generateUuid = opts.generateUuid;
  }

  async updatePassword(data: AccountUpdatePasswordRecord, userObject: SessionJWTPayload): Promise<AccountIdRecord> {
    await this.validation.updatePassword(<TId>userObject.id, data);
    const newData = await this.transform.updatePassword(data);
    const [result] = await this.dal.update(<TId>userObject.id, newData, userObject);
    return result as AccountIdRecord;
  }

  async sendNewPasswordEmail(rawData: AccountEmail, userObject: SessionJWTPayload): Promise<null> {
    await this.validation.sendNewPasswordEmail(rawData);
    const data = this.transform.sendNewPasswordEmail(rawData);
    const user = await this.dal.findByEmail(data, userObject, {
      throwWhenNoData: true,
    });

    if (!user) {
      // eslint-disable-next-line no-console
      console.log(`Can't restore password for email "${data.email}", user not found in db`);
      return null;
    }
    const token = await this.jwt.createRestorePasswordToken({ email: data.email, password: user.password });
    this.mailer.restorePassword(data, { password: token }); // Do not wait email sending
    return null;
  }

  async resendEmailConfirmation(rawData: AccountEmail, userObject: SessionJWTPayload): Promise<null> {
    await this.validation.sendNewPasswordEmail(rawData);
    const data = this.transform.sendNewPasswordEmail(rawData);
    const user = await this.dal.findByEmailAndConfirmation(data, userObject, {
      throwWhenNoData: false,
    });

    if (!user) {
      // eslint-disable-next-line no-console
      console.log(`Can't restore password for email "${data.email}", user not found in db`);
      return null;
    }
    this.internalConfirmEmail({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
    } as AccountEmailConfirmRecord); // Do not wait email sending
    return null;
  }

  async signUp(
    rawData: AccountSignUpRecord,
    userObject: SessionJWTPayload,
    opts?: IDalOptions<TId, TRecord>,
  ): Promise<AccountIdRecord> {
    await this.validation.signUp(rawData);
    const data = this.transform.signUp(rawData);
    await this.validation.signUpFinal(data);
    const dataStageFinal = await this.transform.hashPasswordForSignUp(data);
    const [result] = await this.dal.create(<TRecord>dataStageFinal, userObject, opts);
    if (this.sendEmailToNewUser) {
      this.internalConfirmEmail({
        id: result.id,
        email: data.email,
        firstName: data.firstName,
      } as AccountEmailConfirmRecord); // Do not wait email sending
    }
    return { id: result.id } as AccountIdRecord;
  }

  private async internalConfirmEmail(data: AccountEmailConfirmRecord) {
    const token = await this.jwt.createEmailToken({ id: data.id });
    return this.mailer.confirmEmail({ email: data.email, firstName: data.firstName }, { token });
  }

  private async internalSignUpSuccessEmail(data: AccountEmailConfirmRecord) {
    return this.mailer.signUpSuccessEmail({ email: data.email, firstName: data.firstName });
  }

  async createActivationOtp(data: AccountIdRecord): Promise<AccountCreateOtpResult> {
    await this.validation.createActivationOtp(data);
    const user = (await this.dal.readProfile(<TId>data.id)) as AccountProfileRecord;
    await this.otpService.send({
      key: this.transform.composeKeyForActivationOtp(data.id as TId),
      ttl: this.otpPasswordTimeOut * 1000,
      phoneNumber: user.mobilePhone,
    });
    return { canRepeatAfterSeconds: this.otpPasswordTimeOut };
  }

  async confirmActivationOtp(data: AccountOtpActivationRecord): Promise<AccountIdRecord> {
    await this.validation.confirmActivationOtp(data);
    await this.otpService.confirm({
      key: this.transform.composeKeyForActivationOtp(data.id as TId),
      otp: data.otp,
    });
    await this.dal.update(<TId>data.id, <TRecord>{ mobilePhoneConfirmed: true }, { id: data.id });
    return { id: data.id };
  }

  async restorePasswordByToken(data: AccountRestorePasswordByToken, userObject: SessionJWTPayload): Promise<null> {
    await this.validation.restorePasswordByToken1(data);
    const { email, password } = await this.jwt.verifyRestorePasswordToken(data.token); // email and password hash
    const newPasswordHash = await this.transform.hashPassword(data.password);
    await this.validation.restorePasswordByToken2({ email, password, newPasswordHash });

    const user = await this.dal.findByPassword({ email, password }, userObject, {
      throwWhenNoData: false,
    });

    if (!user) {
      throw new ValidationError({ token: 'Token expired!' });
    }

    await this.dal.update(<TId>user.id, <TRecord>{ password: newPasswordHash }, userObject);
    this.mailer.passwordChanged({ email: user.email }); // Do not wait email sending
    return null;
  }

  async signIn(rawData: AccountCredentials): Promise<SessionJWTPayload> {
    const data = await this.transform.signIn(rawData);
    await this.validation.signIn(data);
    const user = await this.dal.findByEmailAndPassword(data);
    return this.transform.sanitazeUserForSignIn(user!);
  }

  async signInRefresh(data: AccountIdRecord): Promise<SessionJWTPayload> {
    const user = await this.dal.readOne(<TId>data.id);
    return this.transform.sanitazeUserForSignIn(user!);
  }

  async updateProfile(
    id: TId,
    rawData: AccountProfileUpdateRecord,
    userObject: SessionJWTPayload,
  ): Promise<AccountIdRecord> {
    const userId = <TId>userObject.id;
    const oldAccount = (await this.dal.readOne(userId)) as TRecord;
    await this.validation.updateProfile(rawData);
    const data = this.transform.updateProfile(rawData);
    await this.validation.updateProfileFinal(rawData);
    const newData = {
      ...oldAccount,
      ...data,
      mobilePhoneConfirmed: oldAccount.mobilePhone === data.mobilePhone,
      emailConfirmed: oldAccount.email === data.email,
    } as TRecord;
    const [result] = await this.dal.update(userId, newData, userObject);

    if (!newData.emailConfirmed && this.reconfirmEmailAfterChange) {
      this.internalConfirmEmail({
        id: userId,
        email: data.email,
        firstName: data.firstName,
      } as AccountEmailConfirmRecord); // Do not wait email sending
    }

    return result as AccountIdRecord;
  }

  async confirmEmailByToken(data: AccountConfirmEmailByToken, userObject: SessionJWTPayload): Promise<AccountIdRecord> {
    await this.validation.confirmEmailByToken(data);

    const { id } = await this.jwt.verifyEmailToken(data.token);
    const user = await this.dal.readOneByQuery({ id, emailConfirmed: false } as TRecord, userObject, {
      throwWhenNoData: false,
    });

    if (!user) {
      throw new ValidationError({ token: 'Unable to activate account!' });
    }

    this.internalSignUpSuccessEmail({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
    } as AccountEmailConfirmRecord); // Do not wait email sending

    const [result] = await this.dal.update(<TId>user.id, <TRecord>{ emailConfirmed: true }, userObject);
    return result as AccountIdRecord;
  }

  async uploadAvatar(id: TId, file: AccountAvatarFile, userObject: SessionJWTPayload): Promise<AccountIdAndAvatar> {
    const userId = <TId>userObject.id;
    const oldAccount = (await this.dal.readOne(userId)) as TRecord;

    await this.validation.uploadAvatar(file);
    // eslint-disable-next-line no-shadow
    const uuid = this.generateUuid();
    const avatar = await this.avatarStorage.uploadBuffer({
      fileName: uuid,
      buffer: file.image,
      mimeType: imageType(file.image)!.mime,
      publicAccess: true,
      tags: [{ Key: 'accountId', Value: String(userObject.id) }],
    });

    const newData = { ...oldAccount, avatar: uuid } as TRecord;
    const [result] = await this.dal.update(userId, newData, userObject);

    if (oldAccount.avatar) {
      await this.avatarStorage.remove(oldAccount.avatar);
    }
    return { id: result.id!, avatar: avatar.Location };
  }

  async readOne(id: TId, userObject: IUserObject, opts?: IDalOptions<TId, TRecord>): Promise<null | TRecord> {
    const result = await this.dal.readProfile(id, userObject, opts);
    return result ? this.transform.readOne(result as TRecord) : result;
  }
}
