import { Subscribable, Subscription } from '@benzinga/subscribable';
import { SafeError, SafePromise } from '@benzinga/safe-await';
import { Authentication, RegisterUser } from './entities';
import { AuthenticationRequest, AuthenticationRequestEvent } from './request';
import { SessionManager } from '../session';

export type AuthenticationManagerEvent = AuthenticationRequestEvent;

export class AuthenticationManager extends Subscribable<AuthenticationManagerEvent> {
  private authentication?: Authentication;
  private request: AuthenticationRequest;
  private fingerprint?: unknown;
  private requestSubscription?: Subscription<AuthenticationRequest>;

  constructor(loginUrl: URL, session: SessionManager) {
    super();
    this.request = new AuthenticationRequest(loginUrl, session);
  }

  public setFingerprint = (fingerprint: unknown): void => {
    this.fingerprint = fingerprint;
  };

  public login = async (username: string, password: string): SafePromise<Authentication> => {
    if (this.authentication === undefined) {
      const auth = await this.request.login(username, password, this.fingerprint);
      if (auth.result) {
        this.authentication = auth.result;
      }
      return auth;
    }
    return { err: new SafeError('already logged in', 'authentication_manager') };
  };

  public logout = async (): SafePromise<undefined> => {
    if (this.authentication !== undefined) {
      const auth = await this.request.logout();
      this.authentication = undefined;
      if (auth.err) {
        return auth;
      }
    }
    return { err: new SafeError('not logged in', 'authentication_manager') };
  };

  public register = async (user: RegisterUser): SafePromise<Authentication> => {
    const auth = await this.request.register(user);
    if (auth.result) {
      this.authentication = auth.result;
    }
    return auth;
  };

  public forgotPassword = async (email: string): SafePromise<undefined> => {
    return await this.request.forgotPassword(email);
  };

  public changePassword = async (currentPassword: string, newPassword: string): SafePromise<undefined> => {
    if (this.authentication !== undefined) {
      return await this.request.changePassword(currentPassword, newPassword);
    }
    return { err: new SafeError('must be logged in to change password', 'authentication_manager') };
  };

  public isLoggedIn = (): boolean => {
    return !!this.authentication?.key;
  };

  public getBenzingaToken = (): string | undefined => {
    return this.authentication?.key;
  };

  // this is only called if you don't login using the authentication manger
  // and don't have access to cookies
  public setBenzingaToken = async (token: string): SafePromise<Authentication> => {
    const auth = await this.request.session(token);
    if (auth.result) {
      this.authentication = auth.result;
    }
    return auth;
  };

  public getSession = async (): SafePromise<Authentication> => {
    if (this.authentication === undefined) {
      const auth = await this.request.session();
      if (auth.result) {
        this.authentication = auth.result;
      }
      return auth;
    }
    return { result: this.authentication };
  };

  protected onFirstSubscription = (): void => {
    this.requestSubscription = this.request.subscribe(event => this.call(event));
  };

  protected onZeroSubscriptions = (): void => {
    this.requestSubscription?.unsubscribe();
  };
}
