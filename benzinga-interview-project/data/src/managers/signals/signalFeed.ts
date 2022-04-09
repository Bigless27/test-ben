import {
  Subscribable,
  Subscription,
  SubscribableReconnectingSocket,
  SubscribableReconnectingSocketEvent,
} from '@benzinga/subscribable';

import { screenerFiltersToScreenerQuery } from './generateParams';
import { Signal, SignalsScreenerFilter } from './entities';
import { SignalsRequest } from './requests';
import { SessionManager } from '../session';
import { AuthenticationManager } from '../authentication';

interface SignalEvent {
  signal: Signal;
  type: 'signal';
}

interface FeedEvent {
  signalQuery: SignalsScreenerFilter[];
  signalType: SignalType[];
  type: 'feed';
}

interface StatusEvent {
  status:
    | 'reconnected'
    | 'disconnected'
    | 'request_failed'
    | 'request_timeout'
    | 'request_success'
    | SignalFeed['mode'];
  type: 'status';
}

export type SignalFeedEvent = SignalEvent | FeedEvent | StatusEvent;

export class SignalFeed extends Subscribable<SignalFeedEvent> {
  private requestID = 1;
  private signalRequest: SignalsRequest;
  private signalQuery: SignalsScreenerFilter[] = [];
  private signalTypes: SignalType[] = [];

  private socket: SubscribableReconnectingSocket<string>;
  private socketSubscription?: Subscription<SubscribableReconnectingSocket<string>>;
  private authenticationManager: AuthenticationManager;

  private openHistoricLimit = 100;
  private openSubscribe = true;

  private mode: 'init' | 'running' | 'stopped' = 'stopped';
  private afterInitTask: 'none' | 'open' | 'stop' | 'init' = 'none';
  private restSignalsIdSet: Set<number> = new Set<number>();

  constructor(socketUrl: URL, restfulUrl: URL, session: SessionManager) {
    super();
    this.socket = new SubscribableReconnectingSocket(socketUrl);
    this.signalRequest = new SignalsRequest(restfulUrl, session, { authorization: true });
    this.authenticationManager = session.getManager('authentication');
  }

  public setFilters = (signalQuery: SignalsScreenerFilter[], signalTypes: SignalType[]): void => {
    this.signalQuery = signalQuery;
    this.signalTypes = signalTypes;
    if (this.mode === 'init') {
      this.afterInitTask = 'init';
    } else {
      if (this.mode === 'running') {
        this.init();
      }
    }
  };

  public open = async (historicLimit?: number, subscribe?: boolean): Promise<void> => {
    this.openHistoricLimit = historicLimit ?? this.openHistoricLimit;
    this.openSubscribe = subscribe ?? this.openSubscribe;

    if (this.mode === 'init') {
      this.afterInitTask = 'open';
    } else {
      if (this.mode === 'stopped') {
        if (this.openSubscribe) {
          await this.openSocket();
        }
      }
      await this.init();
    }
  };

  public stop = (): void => {
    if (this.mode === 'init') {
      this.afterInitTask = 'stop';
    } else {
      this.socketSubscription?.unsubscribe();
      this.setMode('stopped');
    }
  };

  public addSignal = (signal: Signal): void => {
    // here we are doing the magic of making sure that the signals we receive
    // from the REST call don't duplicate the signals from the socket.
    if (this.restSignalsIdSet.has(signal.id)) {
      return;
    }
    if (this.mode === 'init') {
      this.restSignalsIdSet.add(signal.id);
    }
    this.call({ signal, type: 'signal' });
  };

  protected onZeroSubscriptions = (): void => this.stop();

  private init = async (): Promise<void> => {
    this.setMode('init');
    this.restSignalsIdSet.clear();

    this.call({
      signalQuery: this.signalQuery,
      signalType: this.signalTypes,
      type: 'feed',
    });

    if (this.openSubscribe) {
      this.subscribeToSocket();
    }

    if (this.openHistoricLimit > 0) {
      await this.getHistoricSignals();
    }

    if (this.openSubscribe) {
      this.setMode('running');
    } else {
      this.setMode('stopped');
    }
    switch (this.afterInitTask) {
      case 'open':
        this.afterInitTask = 'none';
        this.open();
        break;
      case 'stop':
        this.afterInitTask = 'none';
        this.stop();
        break;
      case 'init':
        this.afterInitTask = 'none';
        this.init();
        break;
    }
  };

  private setMode = (mode: SignalFeed['mode']): void => {
    this.mode = mode;
    this.call({ status: mode, type: 'status' });
  };

  private openSocket = async (): Promise<undefined> => {
    this.socketSubscription = this.socket.subscribe(this.onMessage);
    this.socket.open();
    return await this.sendAuth();
  };

  private sendAuth = async (): Promise<undefined> => {
    let token = this.authenticationManager.getBenzingaToken();
    if (token === undefined) {
      await this.authenticationManager.getSession();
      token = this.authenticationManager.getBenzingaToken();
    }
    this.socket.send(
      JSON.stringify({
        id: this.requestID,
        sessionId: token,
        type: SignalsMessageType.authReq,
      }),
    );
    return undefined;
  };

  private subscribeToSocket = (): void => {
    this.socket.send(
      JSON.stringify({
        screenerQuery: screenerFiltersToScreenerQuery(this.signalQuery) ?? '',
        signalFilters: this.signalTypes,
        type: SignalsMessageType.feedRequest,
      }),
    );
  };

  private getHistoricSignals = async (): Promise<void> => {
    // TODO: it'd be nice if someone could write a bit as to why this `if` statement exists
    const signals = await (async () => {
      if (this.signalTypes.length !== 0) {
        const result = await this.signalRequest.getSignals(this.signalTypes, this.signalQuery);
        if (result.err) {
          this.call({ status: 'request_failed', type: 'status' });
          return [];
        } else {
          this.call({ status: 'request_success', type: 'status' });
          return result.result.signals ?? [];
        }
      }
      return [];
    })();

    signals.forEach(signal => {
      this.addSignal(signal);
    });
  };

  private onMessage = (event: SubscribableReconnectingSocketEvent<string>): void => {
    switch (event.type) {
      case 'response':
        const msg: SocketSignalMessage = JSON.parse(event.msg);
        switch (msg.type) {
          case 'Signal':
            this.addSignal(msg.payload);
            break;
        }
      case 'disconnected':
        this.call({ status: 'disconnected', type: 'status' });
        break;
      case 'reconnected':
        this.call({ status: 'reconnected', type: 'status' });
        this.sendAuth();
        this.init();
        break;
    }
  };
}

interface SocketSignalMessage {
  payload: Signal;
  type: 'Signal';
}

enum SignalsMessageType {
  authReq = 'AuthRequest',
  authRes = 'AuthResponse',
  feedRequest = 'FeedRequest',
  heartbeat = 'Heartbeat',
  signal = 'Signal',
}

enum SignalType {
  blockTrade = 'BLOCK_TRADE',
  dayHighSeries = 'DAY_HIGH_SERIES',
  dayLowSeries = 'DAY_LOW_SERIES',
  fiftyTwoWeekHigh = 'FTW_HIGH',
  fiftyTwoWeekLow = 'FTW_LOW',
  gap = 'GAP',
  haultResume = 'HALT_RESUME',
  high = 'NEW_HIGH',
  low = 'NEW_LOW',
  option = 'OPTION_ACTIVITY',
  spike = 'PRICE_SPIKE',
}
