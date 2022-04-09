import { Category, FeedId, NodeId, Source, SocketStory, StoryId } from './entities';
import { Story } from './story';
import { NewsFeed } from './feed';
import { NewsManager } from './manager';
import { PressRelease } from './ingress';

export class NewsStore {
  private stories: Map<NodeId, Story> = new Map();
  private storiesFromStoryId: Map<StoryId, Story> = new Map();
  private activeNewsFeeds: Map<FeedId, NewsFeed> = new Map();

  private categories?: Category[];
  private sources?: Source[];
  private pressReleases?: PressRelease[];
  private manager: NewsManager;

  constructor(manager: NewsManager) {
    this.manager = manager;
  }

  public processMultipleStories = async (stories: SocketStory[]): Promise<Story[]> => {
    return Promise.all(stories.map(story => this.processStory(story)));
  };

  public processStory = async (quoteStory: SocketStory): Promise<Story> => {
    const sources = await this.manager.getSources();
    const cachedStory = this.getStory(quoteStory.NodeID);

    if (cachedStory) {
      if (cachedStory.getVersionId() === quoteStory.VersionID) {
        return cachedStory.updateStory(quoteStory, sources.result);
      } else if (cachedStory.getUpdatedAtDate() <= new Date(quoteStory.UpdatedAt)) {
        return cachedStory.updateStory(quoteStory, sources.result);
      } else {
        return cachedStory;
      }
    } else {
      const story = new Story(quoteStory, this.manager, sources.result);
      this.setStory(story);
      return story;
    }
  };

  public getStory = (id: NodeId): Story | undefined => this.stories.get(id);
  public getStoryFromStoryId = (id: StoryId): Story | undefined => this.storiesFromStoryId.get(id);

  public addActiveNewsFeed = (feedId: FeedId, newsfeed: NewsFeed): void => {
    this.activeNewsFeeds.set(feedId, newsfeed);
  };

  public removeActiveNewsFeed = (feedId: FeedId): void => {
    this.activeNewsFeeds.delete(feedId);
  };

  public getActiveNewsFeeds = (): NewsFeed[] => {
    return Array.from(this.activeNewsFeeds.values());
  };

  public getCategories = (): Category[] | undefined => {
    return this.categories;
  };

  public setCategories = (categories: Category[]): void => {
    this.categories = categories;
  };

  public getSources = (): Source[] | undefined => {
    return this.sources;
  };

  public getPressReleases = (): PressRelease[] | undefined => {
    return this.pressReleases;
  };

  public setPressReleases = (pressRelease: PressRelease[]): void => {
    this.pressReleases = pressRelease;
  };

  public setSources = (sources: Source[]): void => {
    this.sources = sources;
  };

  private setStory = (story: Story) => {
    this.stories.set(story.getNodeId(), story);
    this.storiesFromStoryId.set(story.getStoryId(), story);
  };
}
