import { Subscribable, Subscription } from '@benzinga/subscribable';
import { NewsSocket, NewsSocketEvent } from './socket';
import { FeedId, NewsfeedFieldType, QueryId, SocketStory } from './entities';
import { BZQLQuery } from '../../entities/query';
import { SafePromise } from '@benzinga/safe-await';
import { BZQLExpression } from '../../expressions';

interface NewsSessionOpen {
  type: 'open';
}

interface NewsSessionClose {
  type: 'close';
}
interface NewsReconnect {
  type: 'reconnected' | 'disconnected';
}

interface NewsSessionStories {
  stories: SocketStory[];
  type: 'new_stories' | 'historic_stories' | 'reconnect_stories';
}

export type NewsSessionEvents = NewsSessionOpen | NewsSessionClose | NewsReconnect | NewsSessionStories;

export class NewsSession extends Subscribable<NewsSessionEvents> {
  private socket: NewsSocket;
  private feedId: FeedId;
  private query: BZQLQuery;
  private queryIds: QueryId[];
  private reconnectQueryIds: QueryId[];
  private socketSubscription?: Subscription<NewsSocket>;

  private liveStoryInProgress?: SocketStory;
  private oldLiveStoryInProgress?: SocketStory;
  private reconnectHistoricStoryInProgress?: SocketStory;
  private liveQueryInProgress?: SafePromise<SocketStory[]>;
  private historicStoryInProgress?: SocketStory;
  private historicQueryInProgress?: SafePromise<SocketStory[]>;
  private isFeedOpen = false;

  constructor(newsfeedSocket: NewsSocket, query: BZQLQuery, feedId: FeedId) {
    super();
    this.socket = newsfeedSocket;
    this.feedId = feedId;
    this.query = query;
    this.queryIds = [];
    this.reconnectQueryIds = [];
  }

  public getFeedId = (): FeedId => this.feedId;
  public getQuery = (): BZQLQuery => this.query;

  public getHistoric = async (numStoriesRequested = 100): SafePromise<SocketStory[]> => {
    if (this.historicQueryInProgress === undefined) {
      let query = this.query;
      if (this.historicStoryInProgress) {
        const createAtExpression = BZQLExpression.fromToken<NewsfeedFieldType>([
          'CreatedAt',
          'lte',
          this.historicStoryInProgress.CreatedAt,
        ]);
        query = {
          ...this.query,
          limit: numStoriesRequested,
          where: this.query.where ? createAtExpression.and(this.query.where) : null,
        };
      }
      const { queryId, stories } = this.socket.query(query);
      this.queryIds.push(queryId);
      this.historicQueryInProgress = stories;
      const awaitedStories = await this.historicQueryInProgress;
      this.historicQueryInProgress = undefined;
      return awaitedStories;
    }
    return this.historicQueryInProgress;
  };

  protected onReconnect = async (): SafePromise<SocketStory[]> => {
    if (this.liveQueryInProgress === undefined) {
      if (this.oldLiveStoryInProgress === undefined) {
        return { result: [] };
      }
      const createdAtExpression = BZQLExpression.fromToken<NewsfeedFieldType>([
        'CreatedAt',
        'gte',
        this.oldLiveStoryInProgress.CreatedAt,
      ]);
      const query = {
        ...this.query,
        limit: 10000,
        where: this.query.where ? createdAtExpression.and(this.query.where) : createdAtExpression,
      };
      if (this.reconnectHistoricStoryInProgress) {
        query.where.and(
          BZQLExpression.fromToken<NewsfeedFieldType>([
            'CreatedAt',
            'lte',
            this.reconnectHistoricStoryInProgress.CreatedAt,
          ]),
        );
      }
      const { queryId, stories } = this.socket.query(query);
      this.reconnectQueryIds.push(queryId);
      this.liveQueryInProgress = stories;
      const awaitedStories = await this.liveQueryInProgress;
      this.liveQueryInProgress = undefined;
      return awaitedStories;
    }
    return this.liveQueryInProgress;
  };

  protected onFirstSubscription = (): void => {
    this.socketSubscription = this.socket.subscribe(this.socketCallback);
    this.socket.startFeed(this);
    this.isFeedOpen = true;
  };

  protected onZeroSubscriptions = (): void => {
    this.socket.endFeed(this);
    this.socketSubscription?.unsubscribe();
    this.socketSubscription = undefined;
    this.isFeedOpen = false;
  };

  private socketCallback = (event: NewsSocketEvent): void => {
    switch (event.type) {
      case 'subscribe':
        if (event.feedId === this.feedId) {
          this.call({ type: 'open' });
        }
        break;
      case 'unsubscribe':
        if (event.feedId === this.feedId) {
          this.call({ type: 'close' });
        }
        break;
      case 'subscription_stories':
        if (event.feedIds?.some(x => this.feedId === x)) {
          this.liveStoryInProgress = event.story;
          this.call({ stories: [event.story], type: 'new_stories' });
        }
        break;
      case 'query_stories':
        if (this.queryIds.some(id => id === event.queryId)) {
          let stories = event.stories;
          if (this.historicStoryInProgress) {
            let foundStory = false;
            stories = event.stories.filter(story => {
              if (this.historicStoryInProgress?.NodeID === story.NodeID) {
                foundStory = true;
                return false;
              }
              return foundStory;
            });
          }
          this.historicStoryInProgress = event.stories[event.stories.length - 1];
          if (this.liveStoryInProgress === undefined) {
            this.liveStoryInProgress = event.stories[0];
          }
          this.queryIds = this.queryIds.filter(q => q !== event.queryId);
          this.call({ stories, type: 'historic_stories' });
        } else if (this.reconnectQueryIds.some(id => id === event.queryId)) {
          let stories = event.stories;
          if (this.oldLiveStoryInProgress) {
            let done = false;
            let foundStory = this.reconnectHistoricStoryInProgress === undefined;
            stories = event.stories.filter(story => {
              if (this.reconnectHistoricStoryInProgress?.NodeID === story.NodeID) {
                foundStory = true;
                return false;
              } else if (this.oldLiveStoryInProgress?.NodeID === story.NodeID) {
                foundStory = false;
                done = true;
                return false;
              }
              return foundStory;
            });
            if (done) {
              this.reconnectHistoricStoryInProgress = undefined;
              this.oldLiveStoryInProgress = undefined;
            } else {
              this.reconnectHistoricStoryInProgress = event.stories[event.stories.length - 1];
              this.onReconnect();
            }
          }
          this.reconnectQueryIds = this.reconnectQueryIds.filter(q => q !== event.queryId);
          this.call({ stories, type: 'reconnect_stories' });
        }
        break;
      case 'reconnected':
        if (this.isFeedOpen) {
          this.oldLiveStoryInProgress = this.liveStoryInProgress;
          this.socket.startFeed(this);
          this.onReconnect();
          this.call({ type: 'reconnected' });
        }
        break;
      case 'disconnected':
        this.reconnectHistoricStoryInProgress = undefined;
        this.oldLiveStoryInProgress = undefined;
        if (this.isFeedOpen) {
          this.call({ type: 'disconnected' });
        }
        break;
    }
  };
}
