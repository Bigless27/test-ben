import { SafeError, SafePromise } from '@benzinga/safe-await';
import { ExtendedSubscribable } from '@benzinga/subscribable';
import { SessionManager } from '../session';

import { Authentication, RegisterUser } from './entities';
import { AuthenticationRestful } from './restful';

interface ErrorEvent {
  error?: SafeError;
  errorType:
    | 'change_password_error'
    | 'forgot_password_error'
    | 'login_error'
    | 'logout_error'
    | 'refresh_error'
    | 'register_error'
    | 'session_error';
  type: 'error';
}

interface LoginEvent {
  session: Authentication;
  type: 'logged_in';
}

interface SessionEvent {
  session: Authentication;
  type: 'session';
}

interface NoDataEvent {
  type: 'logged_out' | 'forgot_password' | 'change_password' | 'refreshed' | 'registered';
}

export type AuthenticationRequestEvent = ErrorEvent | LoginEvent | NoDataEvent | SessionEvent;

interface AuthenticationFunctions {
  changePassword: (currentPassword: string, newPassword: string) => SafePromise<undefined>;
  forgotPassword: (email: string) => SafePromise<undefined>;
  login: (email: string, password: string, fingerprint?: unknown) => SafePromise<Authentication>;
  logout: () => SafePromise<undefined>;
  refresh: (token?: string) => SafePromise<undefined>;
  register: (user: RegisterUser) => SafePromise<Authentication>;
}

export class AuthenticationRequest extends ExtendedSubscribable<AuthenticationRequestEvent, AuthenticationFunctions> {
  private restful: AuthenticationRestful;

  constructor(url: URL, session: SessionManager) {
    super();
    this.restful = new AuthenticationRestful(url, session);
  }

  public login = async (email: string, password: string, fingerprint?: unknown): SafePromise<Authentication> => {
    const newLogin = await this.restful.login(email, password, fingerprint);
    if (newLogin.err) {
      this.call({
        error: newLogin.err,
        errorType: 'login_error',
        type: 'error',
      });
    } else {
      this.call({
        session: newLogin.result,
        type: 'logged_in',
      });
    }
    return newLogin;
  };

  public logout = async (): SafePromise<undefined> => {
    const logout = await this.restful.logout();
    if (logout.err) {
      this.call({
        error: logout.err,
        errorType: 'logout_error',
        type: 'error',
      });
    } else {
      this.call({
        type: 'logged_out',
      });
    }
    return logout;
  };

  public forgotPassword = async (email: string): SafePromise<undefined> => {
    const logout = await this.restful.forgotPassword(email);
    if (logout.err) {
      this.call({
        error: logout.err,
        errorType: 'forgot_password_error',
        type: 'error',
      });
    } else {
      this.call({
        type: 'forgot_password',
      });
    }
    return logout;
  };

  public changePassword = async (currentPassword: string, newPassword: string): SafePromise<undefined> => {
    const logout = await this.restful.changePassword(currentPassword, newPassword);
    if (logout.err) {
      this.call({
        error: logout.err,
        errorType: 'change_password_error',
        type: 'error',
      });
    } else {
      this.call({
        type: 'change_password',
      });
    }
    return logout;
  };

  public register = async (user: RegisterUser): SafePromise<Authentication> => {
    const auth = await this.restful.register(user);
    if (auth.err) {
      this.call({
        error: auth.err,
        errorType: 'register_error',
        type: 'error',
      });
    } else {
      this.call({
        type: 'registered',
      });
    }
    return auth;
  };

  public refresh = async (token?: string): SafePromise<undefined> => {
    const refresh = await this.restful.refresh(token);
    if (refresh.err) {
      this.call({
        error: refresh.err,
        errorType: 'refresh_error',
        type: 'error',
      });
    } else {
      this.call({
        type: 'refreshed',
      });
    }
    return refresh;
  };

  public session = async (token?: string): SafePromise<Authentication> => {
    const session = await this.restful.session(token);
    if (session.err) {
      this.call({
        error: session.err,
        errorType: 'session_error',
        type: 'error',
      });
    } else {
      this.call({
        session: session.result,
        type: 'session',
      });
    }
    return session;
  };

  protected onSubscribe = (): AuthenticationFunctions => ({
    changePassword: this.changePassword,
    forgotPassword: this.forgotPassword,
    login: this.login,
    logout: this.logout,
    refresh: this.refresh,
    register: this.register,
  });
}
