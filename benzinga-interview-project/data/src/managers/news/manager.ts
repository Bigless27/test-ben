import { Subscribable, Subscription } from '@benzinga/subscribable';
import { NewsRequest, NewsRequestEvent } from './request';
import { NewsSocket, NewsSocketEvent } from './socket';
import { NewsStore } from './store';
import { SafeError, SafePromise } from '@benzinga/safe-await';
import { NodeId, NewsfeedFieldType, Source, StoryId, Category } from './entities';
import { Story } from './story';
import { NewsFeed } from './feed';
import { BZQLExpression } from '../../expressions';
import { ingresPressReleases, ingresSources, PressRelease } from './ingress';
import { SessionManager } from '../session';

interface StoryEvent {
  story: Story;
  type: 'story';
}

interface StoriesEvent {
  Stories: Story[];
  type: 'stories';
}

interface ErrorEvent {
  error?: SafeError;
  errorType: 'storyId_query_returned_more_then_one_story' | `nodeId_query_returned_more_then_one_story`;
  type: 'error';
}

export type NewsManagerEvent = StoryEvent | StoriesEvent | NewsRequestEvent | NewsSocketEvent | ErrorEvent;

export class NewsManager extends Subscribable<NewsManagerEvent> {
  private store: NewsStore;
  private restful: NewsRequest;
  private socket: NewsSocket;
  private restfulSubscription?: Subscription<NewsRequest>;
  private socketSubscription?: Subscription<NewsSocket>;

  constructor(restfulURL: URL, socketUrl: URL, session: SessionManager) {
    super();
    this.socket = new NewsSocket(socketUrl);
    this.restful = new NewsRequest(restfulURL, session);
    this.store = new NewsStore(this);
  }

  public getCategories = async (): SafePromise<Category[]> => {
    const cachedCategories = this.store.getCategories();
    if (cachedCategories) {
      return { result: cachedCategories };
    }
    const categories = await this.restful.getCategories();
    if (categories.err) {
      return categories;
    } else {
      this.store.setCategories(categories.result);
      return categories;
    }
  };

  public getSources = async (): SafePromise<Source[]> => {
    const cachedSources = this.store.getSources();
    if (cachedSources) {
      return { result: cachedSources };
    }
    const contentTypes = await this.restful.getContentTypes();
    if (contentTypes.err) {
      return contentTypes;
    } else {
      const sources = ingresSources(contentTypes.result);
      const pressRelease = ingresPressReleases(contentTypes.result);
      if (pressRelease.result) {
        this.store.setPressReleases(pressRelease.result);
      }
      if (sources.result) {
        this.store.setSources(sources.result);
      }
      return sources;
    }
  };

  public getPressReleases = async (): SafePromise<PressRelease[]> => {
    const cachedPressReleases = this.store.getPressReleases();
    if (cachedPressReleases) {
      return { result: cachedPressReleases };
    }
    const contentTypes = await this.restful.getContentTypes();
    if (contentTypes.err) {
      return contentTypes;
    } else {
      const sources = ingresSources(contentTypes.result);
      const pressRelease = ingresPressReleases(contentTypes.result);
      if (sources.result) {
        this.store.setSources(sources.result);
      }
      if (pressRelease.result) {
        this.store.setPressReleases(pressRelease.result);
      }
      return pressRelease;
    }
  };

  public getStoryFromStoryId = async (id: StoryId, requiredFields?: NewsfeedFieldType[]): SafePromise<Story> => {
    const cachedStory = this.store.getStoryFromStoryId(id);
    if (cachedStory) {
      return { result: cachedStory };
    } else {
      return this.fetchStory(
        BZQLExpression.fromToken<NewsfeedFieldType>(['ID', 'eq', id]),
        requiredFields,
      );
    }
  };

  public getStory = async (id: NodeId, requiredFields?: NewsfeedFieldType[]): SafePromise<Story> => {
    const cachedStory = this.store.getStory(id);
    if (cachedStory) {
      return { result: cachedStory };
    } else {
      return this.fetchStory(
        BZQLExpression.fromToken<NewsfeedFieldType>(['NodeID', 'eq', id]),
        requiredFields,
      );
    }
  };

  public getStoryBody = async (story: Story): SafePromise<string> => {
    const cachedStory = this.store.getStory(story.getNodeId());
    const body = cachedStory?.getBody();
    if (body) {
      return { result: body };
    }
    const storyWithBody = await this.fetchStory(
      BZQLExpression.fromToken<NewsfeedFieldType>(['NodeID', 'eq', story.getNodeId()]),
      ['Body'],
    );
    if (storyWithBody.err) {
      return storyWithBody;
    } else {
      return { result: storyWithBody.result.getBody() ?? '' };
    }
  };

  public createFeed = (...query: Parameters<NewsSocket['createFeed']>): NewsFeed => {
    return new NewsFeed(this.socket.createFeed(...query), this.store);
  };

  public getActiveFeeds = (): NewsFeed[] => this.store.getActiveNewsFeeds();
  public getStoredSources = (): Source[] | undefined => this.store.getSources();
  public getStoredPressReleases = (): PressRelease[] | undefined => this.store.getPressReleases();
  public getStoredCategories = (): Category[] | undefined => this.store.getCategories();

  public fetchStories = async (
    query: BZQLExpression<NewsfeedFieldType>,
    requiredFields?: NewsfeedFieldType[],
  ): SafePromise<Story[]> => {
    const stories = await this.socket.query({
      fields: requiredFields,
      where: query,
    }).stories;
    if (stories.err) {
      return stories;
    } else {
      const processedStories = Promise.all(stories.result.map(story => this.store.processStory(story)));
      this.call({
        Stories: await processedStories,
        type: 'stories',
      });
      return { result: await processedStories };
    }
  };

  public fetchStory = async (
    query: BZQLExpression<NewsfeedFieldType>,
    requiredFields?: NewsfeedFieldType[],
  ): SafePromise<Story> => {
    const stories = await this.socket.query({
      fields: requiredFields,
      where: query,
    }).stories;
    if (stories.err) {
      return stories;
    } else {
      const processedStories = [...new Set(await this.store.processMultipleStories(stories.result))];
      if (processedStories.length === 1) {
        const story = processedStories[0];
        this.call({
          story: await story,
          type: 'story',
        });
        return { result: await story };
      } else {
        const error = new SafeError('nodeId query returned more then one story', 'newsfeed', stories);
        this.call({
          error,
          errorType: 'nodeId_query_returned_more_then_one_story',
          type: 'error',
        });
        return { err: error };
      }
    }
  };

  protected onFirstSubscription = (): void => {
    this.socketSubscription = this.socket.subscribe(event => this.call(event));
    this.restfulSubscription = this.restful.subscribe(event => this.call(event));
  };

  protected onZeroSubscriptions = (): void => {
    this.restfulSubscription?.unsubscribe();
    this.socketSubscription?.unsubscribe();
  };
}
