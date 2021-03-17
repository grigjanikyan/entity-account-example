import { Controller as BaseController, IControllerOptions as IControllerOptionsBase } from '@S_E_C_R_E_T/modularity';
import { SessionJWT, SessionJWTPayload, AccountId, AccountRecord } from '@S_E_C_R_E_T/types';
import { IUserSessionRequest, IPromiseResponse, NextFunction, IAnyObject } from '@S_E_C_R_E_T/middlewares';
import { ValidationError } from '@S_E_C_R_E_T/validation';
import { systemAccount } from '@S_E_C_R_E_T/dict';

import config from './config';

import { AccountService } from './Service';

interface IControllerOptions<TId extends AccountId, TRecord extends AccountRecord>
  extends IControllerOptionsBase<TId, TRecord> {
  service: AccountService<TId, TRecord>;
}

export class AccountController<TId extends AccountId, TRecord extends AccountRecord> extends BaseController<
  TId,
  TRecord
> {
  service: AccountService<TId, TRecord>;
  systemUser = systemAccount;

  constructor(opts: IControllerOptions<TId, TRecord>) {
    super(opts);
    this.service = opts.service;
    this.updatePassword = this.updatePassword.bind(this);
    this.sendNewPasswordEmail = this.sendNewPasswordEmail.bind(this);
    this.createUser = this.createUser.bind(this);
    this.createActivationOtp = this.createActivationOtp.bind(this);
    this.confirmActivationOtp = this.confirmActivationOtp.bind(this);
    this.resendEmailConfirmation = this.resendEmailConfirmation.bind(this);
    this.restorePasswordByToken = this.restorePasswordByToken.bind(this);
    this.confirmEmailByToken = this.confirmEmailByToken.bind(this);
    this.uploadAvatar = this.uploadAvatar.bind(this);
  }

  updatePassword(req: IUserSessionRequest<SessionJWTPayload, SessionJWT>, res: IPromiseResponse): void {
    const user = AccountController.getUserRequired(req);
    const data = {
      oldPassword: req.body.oldPassword,
      newPassword: req.body.newPassword,
    };
    res.promise(this.service.updatePassword(data, user));
  }

  sendNewPasswordEmail(req: IUserSessionRequest<SessionJWTPayload, SessionJWT>, res: IPromiseResponse): void {
    const user = AccountController.getUser(req);
    res.promise(this.service.sendNewPasswordEmail({ email: req.body.email }, <TRecord>user || this.systemUser));
  }

  resendEmailConfirmation(req: IUserSessionRequest<SessionJWTPayload, SessionJWT>, res: IPromiseResponse): void {
    const user = AccountController.getUser(req);
    res.promise(this.service.resendEmailConfirmation({ email: req.body.email }, <TRecord>user || this.systemUser));
  }

  createUser(req: IUserSessionRequest<SessionJWTPayload, SessionJWT>, res: IPromiseResponse): void {
    const user = AccountController.getUser(req);
    res.promise(
      this.service.signUp(
        {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          password: req.body.password,
          mobilePhone: req.body.mobilePhone,
        },
        <TRecord>user || this.systemUser,
      ),
    );
  }

  createActivationOtp(req: IUserSessionRequest<SessionJWTPayload, SessionJWT>, res: IPromiseResponse): void {
    res.promise(this.service.createActivationOtp({ id: req.body.id }));
  }

  confirmActivationOtp(req: IUserSessionRequest<SessionJWTPayload, SessionJWT>, res: IPromiseResponse): void {
    res.promise(this.service.confirmActivationOtp({ id: req.body.id, otp: req.body.otp }));
  }

  restorePasswordByToken(req: IUserSessionRequest<SessionJWTPayload, SessionJWT>, res: IPromiseResponse): void {
    const user = AccountController.getUser(req);
    res.promise(
      this.service.restorePasswordByToken(
        { token: req.body.token, password: req.body.password },
        <TRecord>user || this.systemUser,
      ),
    );
  }

  update(req: IUserSessionRequest<SessionJWTPayload, SessionJWT>, res: IPromiseResponse): void {
    const id = this.transform.tryGetNumber(req.params.id);
    const user = AccountController.getUserRequired(req);
    const fields = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      mobilePhone: req.body.mobilePhone,
    };
    res.promise(this.service.updateProfile(id as TId, fields, user));
  }

  async confirmEmailByToken(
    req: IUserSessionRequest<SessionJWTPayload, SessionJWT>,
    res: IPromiseResponse,
    next: NextFunction,
  ): Promise<void> {
    const user = AccountController.getUser(req);
    try {
      await this.service.confirmEmailByToken(
        { token: String(req.query.token).trim() },
        <TRecord>user || this.systemUser,
      );
      res.redirect(302, `${config.app.url}/email-confirmed-successfully`);
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send('Something went wrong: unable to verify email by token.');
        return;
      }
      next(e);
    }
  }

  uploadAvatar(req: IUserSessionRequest<SessionJWTPayload, SessionJWT>, res: IPromiseResponse): void {
    const id = this.transform.tryGetNumber(req.params.id);
    const user = AccountController.getUserRequired(req);
    const { file } = req as IAnyObject;
    const fields = { image: file.buffer };

    res.promise(this.service.uploadAvatar(id as TId, fields, user));
  }
}
