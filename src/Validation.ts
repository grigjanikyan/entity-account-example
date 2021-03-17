import { Validation as ValidationLib, validators } from '@S_E_C_R_E_T/validation';
import { Validation as ValidationBase, TAnyValue, IValidationOptions } from '@S_E_C_R_E_T/modularity';
import {
  AccountJWTPasswordRecoveryPayloadForValidation,
  AccountId,
  AccountRecord,
  AccountUpdatePasswordRecord,
  AccountCredentials,
  AccountEmail,
  AccountIdRecord,
  AccountOtpActivationRecord,
  AccountRestorePasswordByToken,
  AccountProfileUpdateRecord,
  AccountConfirmEmailByToken,
  AccountAvatarFile,
} from '@S_E_C_R_E_T/types';

export class AccountValidation<TId extends AccountId, TRecord extends AccountRecord> extends ValidationBase<
  TId,
  TRecord
> {
  constructor({ validator, fields }: IValidationOptions) {
    super({ validator, fields });
    this.validator = validator;
    this.fields = fields;
  }

  async updatePassword(id: TId, data: AccountUpdatePasswordRecord): Promise<TAnyValue> {
    const { required, text, password } = validators;
    const { idAndPassCredentials, newPasswordCantBeTheSame } = this.validator;

    return ValidationLib.create({
      oldPassword: [required(), text(), password(), idAndPassCredentials()],
      newPassword: [required(), text(), password(), newPasswordCantBeTheSame()],
    })({ id, ...data });
  }

  async sendNewPasswordEmail(data: AccountEmail): Promise<TAnyValue> {
    const { required, text, email } = validators;

    return ValidationLib.create({
      email: [required(), text(), email()],
    })({ ...data });
  }

  async signUp(data: AccountEmail): Promise<TAnyValue> {
    const { required, text, email } = validators;

    return ValidationLib.create({
      email: [required(), text(), email()],
      password: [required(), text()],
      firstName: [required(), text()],
      lastName: [required(), text()],
      mobilePhone: [required(), text()],
    })({ ...data });
  }

  async signUpFinal(data: AccountEmail): Promise<TAnyValue> {
    const { password } = validators;
    const { userName, uniqRecord } = this.validator;

    return ValidationLib.create({
      email: [uniqRecord()],
      password: [password()],
      firstName: [userName()],
      lastName: [userName()],
      mobilePhone: [uniqRecord()],
    })({ ...data });
  }

  async createActivationOtp(data: AccountIdRecord): Promise<TAnyValue> {
    const { required, number } = validators;
    const { exist, phoneNotActive } = this.validator;

    return ValidationLib.create({
      id: [required(), number(), exist('Wrong account'), phoneNotActive()],
    })({ ...data });
  }

  async confirmActivationOtp(data: AccountOtpActivationRecord): Promise<TAnyValue> {
    const { required, number } = validators;
    const { exist } = this.validator;

    return ValidationLib.create({
      id: [required(), number(), exist()],
      otp: [required(), number()],
    })({ ...data });
  }

  async restorePasswordByToken1(data: AccountRestorePasswordByToken): Promise<TAnyValue> {
    const { required, text, password } = validators;
    const { validEmailJWT } = this.validator;

    return ValidationLib.create({
      token: [required(), text(), validEmailJWT()],
      password: [required(), text(), password()], // user entered new password
    })({ ...data });
  }

  async restorePasswordByToken2(data: AccountJWTPasswordRecoveryPayloadForValidation): Promise<TAnyValue> {
    const { required, text } = validators;
    const { passwordMustBeDifferentFromNewPasswordHash } = this.validator;

    return ValidationLib.create({
      email: [required(), text()],
      password: [required(), text(), passwordMustBeDifferentFromNewPasswordHash()], // password hash from JWT token
    })({ ...data });
  }

  async signIn(data: AccountCredentials): Promise<TAnyValue> {
    const { emailActive, emailAndPassCredentials } = this.validator;
    return ValidationLib.create({
      email: [emailActive()],
      password: [emailAndPassCredentials()],
    })(data);
  }

  async updateProfile(data: AccountProfileUpdateRecord): Promise<unknown> {
    const { required, text } = validators;

    return ValidationLib.create({
      email: [required(), text()],
      firstName: [required(), text()],
      lastName: [required(), text()],
      mobilePhone: [required(), text()],
    })({ ...data });
  }

  async updateProfileFinal(data: AccountProfileUpdateRecord): Promise<unknown> {
    const { email, arrayLengthBetween } = validators;
    const { phone } = this.validator;

    return ValidationLib.create({
      email: [email()],
      firstName: [arrayLengthBetween(1, 30)],
      lastName: [arrayLengthBetween(1, 30)],
      mobilePhone: [phone()],
    })({ ...data });
  }

  async confirmEmailByToken(data: AccountConfirmEmailByToken): Promise<unknown> {
    const { required, text } = validators;
    const { validConfirmEmailJWT } = this.validator;

    return ValidationLib.create({
      token: [required(), text(), validConfirmEmailJWT()],
    })({ ...data });
  }

  async uploadAvatar(data: AccountAvatarFile): Promise<unknown> {
    const { required, buffer, fileSize } = validators;
    const { image } = this.validator;

    return ValidationLib.create({
      image: [required(), buffer(), image(), fileSize(1024 * 1024 * 3, 1000)],
    })({ ...data });
  }
}
