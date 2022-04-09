import { Subscribable } from '@benzinga/subscribable';
import { SignalFeed, SignalFeedEvent } from './signalFeed';
import { SessionManager } from '../session';

export type SignalsManagerEvent = SignalFeedEvent;

export class SignalsManager extends Subscribable<SignalsManagerEvent> {
  private restfulURL: URL;
  private session: SessionManager;
  private socketURL: URL;

  constructor(restfulURL: URL, socketUrl: URL, session: SessionManager) {
    super();
    this.restfulURL = restfulURL;
    this.session = session;
    this.socketURL = socketUrl;
  }

  public createFeed = (): SignalFeed => {
    return new SignalFeed(this.socketURL, this.restfulURL, this.session);
  };
}
