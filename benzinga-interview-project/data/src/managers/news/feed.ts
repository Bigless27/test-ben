import { ExtendedSubscribable, Subscription } from '@benzinga/subscribable';
import { NewsSession, NewsSessionEvents } from './session';
import { NewsStore } from './store';
import { Story } from './story';
import { BZQLQuery } from '../../entities/query';
import { SafePromise } from '@benzinga/safe-await';
import { NewsContainer } from './container';

interface NewsFeedOpen {
  type: 'open';
}

interface NewsFeedClose {
  type: 'close';
}

interface ReconnectEvent {
  type: 'reconnected' | 'disconnected';
}

interface NewsFeedStories {
  stories: Story[];
  type: 'new_stories' | 'historic_stories' | 'reconnect_stories';
}

export type NewsFeedEvents = NewsFeedOpen | NewsFeedClose | ReconnectEvent | NewsFeedStories;

interface SubscriptionExtension {
  getHistoric: (numStoriesRequested?: number) => SafePromise<Story[]>;
  getQuery: () => BZQLQuery;
  startFeed: () => void;
}

export class NewsFeed extends ExtendedSubscribable<NewsFeedEvents, SubscriptionExtension> {
  static count = 0;
  private session: NewsSession;
  private store: NewsStore;
  private sessionSubscription?: Subscription<NewsSession>;
  private container: NewsContainer;
  private state: 'running' | 'waiting_for_subs' | 'stopped';
  private hasSubs: boolean;

  constructor(session: NewsSession, store: NewsStore) {
    super();
    this.session = session;
    this.store = store;
    this.state = 'stopped';
    this.hasSubs = false;
    this.container = new NewsContainer(this);
  }

  public startFeed = (): void => {
    if (this.hasSubs) {
      this.sessionSubscription = this.session.subscribe(this.socketCallback);
      this.store.addActiveNewsFeed(this.session.getFeedId(), this);
      this.state = 'running';
    } else {
      this.state = 'waiting_for_subs';
    }
  };

  public getHistoric = async (numStoriesRequested = 100): SafePromise<Story[]> => {
    const stories = await this.session.getHistoric(numStoriesRequested);
    if (stories.err) {
      return stories;
    } else {
      const processedStories = [...new Set(await this.store.processMultipleStories(stories.result))];
      this.call({ stories: processedStories, type: 'historic_stories' });
      return { result: processedStories };
    }
  };

  public getQuery = (): BZQLQuery => this.session.getQuery();

  public getContainer = (): NewsContainer => this.container;

  protected onSubscribe = (): SubscriptionExtension => ({
    getHistoric: this.getHistoric,
    getQuery: this.getQuery,
    startFeed: this.startFeed,
  });

  protected onFirstSubscription = (): void => {
    if (this.state === 'waiting_for_subs') {
      this.sessionSubscription = this.session.subscribe(this.socketCallback);
      this.store.addActiveNewsFeed(this.session.getFeedId(), this);
    }
    this.hasSubs = true;
  };

  protected onZeroSubscriptions = (): void => {
    this.hasSubs = false;
    this.state = 'stopped';
    this.sessionSubscription?.unsubscribe();
    this.sessionSubscription = undefined;
    this.store.removeActiveNewsFeed(this.session.getFeedId());
  };

  private socketCallback = async (event: NewsSessionEvents): Promise<void> => {
    switch (event.type) {
      case 'new_stories':
      case 'reconnect_stories':
        const stories = [...new Set(await this.store.processMultipleStories(event.stories))];
        this.call({ stories, type: event.type });
        break;
      case 'historic_stories':
        break; // we are doing this in the getHistoric function so we don't have process twice
      default:
        this.call(event);
        break;
    }
  };
}
