import { SafePromise } from '@benzinga/safe-await';
import { RestfulClient } from '../../utils';
import { SessionManager } from '../session';
import { Authentication, RegisterUser } from './entities';

export class AuthenticationRestful extends RestfulClient {
  constructor(hostname: URL, session: SessionManager) {
    super(hostname, session, { 'x-device-key': true });
  }

  public login = (email: string, password: string, fingerprint?: unknown): SafePromise<Authentication> => {
    const url = this.URL('api/v1/account/login/');
    return this.post(url, { email, fingerprint, password }, { allowsAnonymousAuth: true });
  };

  public logout = (): SafePromise<undefined> => {
    const url = this.URL('api/v1/account/logout/');
    return this.get(url);
  };

  public forgotPassword = (email: string): SafePromise<undefined> => {
    const url = this.URL('api/v1/account/reset/password/request/');
    return this.post(url, { email }, { allowsAnonymousAuth: true });
  };

  public changePassword = (currentPassword: string, newPassword: string): SafePromise<undefined> => {
    const url = this.URL('api/v1/account/change/password/');
    return this.post(url, { current_password: currentPassword, new_password: newPassword });
  };

  public register = (user: RegisterUser): SafePromise<Authentication> => {
    const url = this.URL('api/v1/account/register/');
    return this.post(url, user, { allowsAnonymousAuth: true });
  };

  public refresh = (token?: string): SafePromise<undefined> => {
    const url = this.URL('api/v1/account/refresh/');
    if (token) {
      return this.post(url, { refresh: token });
    } else {
      return this.post(url);
    }
  };

  public session = (token?: string): SafePromise<Authentication> => {
    const url = this.URL('api/v1/account/session/', { include_cards: true, include_perms: true, include_subs: true });
    // TODO remove this once pro and bznext uses authManager to login
    const benzingaToken = (cookies: string) =>
      cookies
        .split('; ')
        .find(cookie => cookie.startsWith('benzinga_token'))
        ?.split('=')[1];

    if (typeof document !== 'undefined') {
      token = token ?? benzingaToken(document.cookie);
    }
    let headers = undefined;
    if (token !== undefined) {
      headers = { authorization: `session ${token}` };
    }
    return this.get(url, { allowsAnonymousAuth: true, headers, session: { getBenzingaToken: () => token } });
  };
}
