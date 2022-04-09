import {
  Subscribable,
  SubscribableReconnectingSocket,
  SubscribableReconnectingSocketEvent,
  Subscription,
} from '@benzinga/subscribable';

import { FeedId, NewsfeedFieldType, QueryId, SocketStory, RequiredSocketStoryFields } from './entities';
import { BZQLQuery, BZQLRequestQuery } from '../../entities/query';
import { SafePromise, safeAwait } from '@benzinga/safe-await';
import { NewsSession } from './session';

export interface NewsSocketSubscriptionEvent {
  feedId: string;
  query?: BZQLQuery;
  type: 'subscribe';
}
export interface NewsSocketStoryEvent {
  feedIds: string[];
  story: SocketStory;
  type: 'subscription_stories';
}

export interface NewsSocketUnsubscribeEvent {
  feedId: string;
  type: 'unsubscribe';
}

export interface NewsSocketQueryEvent {
  query?: BZQLQuery;
  queryId: string;
  stories: SocketStory[];
  type: 'query_stories';
}

export interface NewsSocketReconnectEvent {
  type: 'reconnected' | 'disconnected';
}
export interface NewsSocketErrorEvent {
  Error: '';
  type: 'error';
}

export type NewsSocketEvent =
  | NewsSocketStoryEvent
  | NewsSocketSubscriptionEvent
  | NewsSocketUnsubscribeEvent
  | NewsSocketQueryEvent
  | NewsSocketErrorEvent
  | NewsSocketReconnectEvent;

interface QueryReturn {
  queryId: QueryId;
  stories: SafePromise<SocketStory[]>;
}
export class NewsSocket extends Subscribable<NewsSocketEvent> {
  private socket: SubscribableReconnectingSocket<string>;
  private socketSubscription?: Subscription<SubscribableReconnectingSocket<string>>;

  private feedIdQueryMapping: Map<FeedId, BZQLQuery> = new Map();
  private queryIdQueryMapping: Map<QueryId, BZQLQuery> = new Map();
  private nextQueryId = 0;
  private nextFeedId = 0;

  constructor(socketUrl: URL) {
    super();
    this.socket = new SubscribableReconnectingSocket(socketUrl);
  }

  public query = (data: Partial<BZQLQuery>): QueryReturn => {
    const requiredFields: NewsfeedFieldType[] = [
      'CreatedAt',
      'ID',
      'NodeID',
      'UpdatedAt',
      'VersionID',
    ] as RequiredSocketStoryFields;
    const query = {
      fields: data.fields ? Array.from(new Set([...data.fields, ...requiredFields])) : requiredFields,
      limit: data.limit ?? 100,
      offset: data.offset ?? 0,
      sort: data.sort ?? ({ CreatedAt: -1 } as Record<NewsfeedFieldType, -1 | 1>),
      where: data.where ?? null,
    };

    const queryId = `${this.nextQueryId++}`;
    this.queryIdQueryMapping.set(queryId, query);
    return {
      queryId,
      stories: safeAwait(
        new Promise(resolve => {
          const subscription = this.subscribe(event => {
            switch (event.type) {
              case 'query_stories':
                if (event.queryId === queryId) {
                  subscription.unsubscribe();
                  resolve(event.stories);
                }
                break;
            }
          });
          this.socket.sendObject<Request>({
            data: { ...query, id: queryId, where: data.where?.toBZQL() ?? null },
            type: 'news_query',
          });
        }),
      ),
    };
  };

  public createFeed = (query: Partial<BZQLQuery>): NewsSession => {
    const definedQuery = {
      fields: query.fields ?? [],
      limit: query.limit ?? 100,
      offset: query.offset ?? 0,
      sort: query.sort ?? ({} as Record<NewsfeedFieldType, -1 | 1>),
      where: query.where ?? null,
    };

    const feedId = `${this.nextFeedId++}`;
    const newFeed = new NewsSession(this, definedQuery, feedId);
    this.feedIdQueryMapping.set(feedId, definedQuery);
    return newFeed;
  };

  public startFeed = (newsfeedSession: NewsSession): void => {
    const { fields, sort, ...query } = newsfeedSession.getQuery();
    const requiredFields: NewsfeedFieldType[] = [
      'CreatedAt',
      'ID',
      'NodeID',
      'UpdatedAt',
      'VersionID',
    ] as RequiredSocketStoryFields;
    this.socket.sendObject<Request>({
      data: {
        ...query,
        fields: fields ? Array.from(new Set([...fields, ...requiredFields])) : requiredFields,
        id: newsfeedSession.getFeedId(),
        sort: Object.keys(sort).length === 0 ? undefined : sort,
        where: query.where?.toBZQL() ?? null,
      },
      type: 'news_sub',
    });
  };

  public endFeed = (feed: NewsSession): void => {
    const feedId = feed.getFeedId();
    this.socket.sendObject<Request>({
      data: { query_ids: [feedId] },
      type: 'news_unsub',
    });
  };

  protected onFirstSubscription = (): void => this.open();
  protected onZeroSubscriptions = (): void => this.stop();

  private stop = (): void => {
    this.socket.close();
    this.socketSubscription?.unsubscribe();
    this.socketSubscription = undefined;
  };

  private open = (): void => {
    if (this.socketSubscription === undefined) {
      this.socketSubscription = this.socket.subscribe(this.onMessage);
    }
    this.socket.open();
  };

  private onMessage = (event: SubscribableReconnectingSocketEvent<string>): void => {
    switch (event.type) {
      case 'response': {
        const msg: Response = JSON.parse(event.msg);
        switch (msg.type) {
          case 'news_sub_confirm':
            this.call({
              feedId: msg.data.id,
              query: this.feedIdQueryMapping.get(msg.data.id),
              type: 'subscribe',
            });
            this.feedIdQueryMapping.delete(msg.data.id);
            break;
          case 'news_unsub_confirm':
            this.call({
              feedId: msg.data.id,
              type: 'unsubscribe',
            });
            break;
          case 'news_sub_results':
            (msg.data.content ?? []).forEach(story => {
              this.call({ feedIds: msg.data.matched_queries, story, type: 'subscription_stories' });
            });
            break;
          case 'news_query_resp':
            const content = msg.data.content ?? [];
            msg.data.matched_queries.forEach(queryId => {
              this.call({
                query: this.queryIdQueryMapping.get(queryId),
                queryId: queryId,
                stories: content,
                type: 'query_stories',
              });
              this.queryIdQueryMapping.delete(queryId);
            });
            break;
        }
        break;
      }
      case 'reconnected':
        this.call({ type: 'reconnected' });
        this.queryIdQueryMapping.forEach((query, queryId) => {
          this.socket.sendObject<Request>({
            data: { ...query, id: queryId, where: query.where?.toBZQL() ?? null },
            type: 'news_query',
          });
        });
        break;
      case 'disconnected':
        this.call({ type: 'disconnected' });
    }
  };
}

interface SubscribeRequest {
  data: BZQLRequestQuery & { id: string };
  type: 'news_sub';
}

interface UnsubscribeRequest {
  data: { query_ids: string[] };
  type: 'news_unsub';
}

interface QueryRequest {
  data: BZQLRequestQuery & { id: string };
  type: 'news_query';
}

type Request = QueryRequest | SubscribeRequest | UnsubscribeRequest;

interface QueryResponse {
  data: {
    content: SocketStory[] | null;
    matched_queries: string[];
  };
  result: {
    code: string;
    msg: string;
  };
  type: 'news_query_resp' | 'news_sub_results';
}

interface SubscriptionResponse {
  data: BZQLRequestQuery & { id: string };
  result: {
    code: string;
    msg: string;
  };
  type: 'news_sub_confirm';
}

interface UnsubscriptionResponse {
  data: BZQLRequestQuery & { id: string };
  result: {
    code: string;
    msg: string;
  };
  type: 'news_unsub_confirm';
}

type Response = QueryResponse | SubscriptionResponse | UnsubscriptionResponse;
