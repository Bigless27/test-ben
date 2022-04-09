import { SafePromise } from '@benzinga/safe-await';
import { Subscribable } from '@benzinga/subscribable';
import { NewsManager } from './manager';
import {
  StoryCategory,
  Meta,
  Assets,
  NodeId,
  SocketStory,
  Quote,
  Sentiment,
  StoryId,
  VersionId,
  Source,
  SourceId,
} from './entities';
import { StockSymbol } from '../../entities';

interface UpdateEvent {
  story: Story;
  type: 'story_update';
}

interface ExtendEvent {
  story: Story;
  type: 'story_extend';
}

export type StoryEvent = UpdateEvent | ExtendEvent;

export class Story extends Subscribable<StoryEvent> {
  private addedAt: Date;
  private author?: string | null;
  private assets?: Assets[];
  private body?: string | null;
  private channels?: StoryCategory[] | null;
  private createdAt: string;
  private createdAtDate: Date;
  private doNotDistribute?: boolean;
  private eventId?: string;
  private futures?: StoryCategory[] | null;
  private isBZPost?: boolean;
  private isBZProPost?: boolean;
  private meta?: Meta;
  private nodeId: NodeId;
  private partnerURL?: string | null;
  private published?: boolean;
  private quotes?: Quote[] | null;
  private sentiment?: Sentiment;
  private storyId: StoryId;
  private tags?: StoryCategory[] | null;
  private teaserText?: string | null;
  private tickers?: StoryCategory[] | null;
  private title?: string | null;
  private source?: Source;
  private updatedAt: string;
  private updatedAtDate: Date;
  private userId?: number;
  private versionId: VersionId;

  private readonly manager: NewsManager;

  constructor(story: SocketStory, manager: NewsManager, sources: Source[] | undefined) {
    super();
    this.addedAt = new Date();
    this.assets = story.assets;
    this.author = story.name;
    this.body = story.Body;
    this.channels = story.Channels;
    this.createdAt = story.CreatedAt;
    this.doNotDistribute = story.DoNotDistribute;
    this.eventId = story.EventID;
    this.futures = story.Futures;
    this.storyId = story.ID ?? null;
    this.isBZPost = story.IsBZPost;
    this.isBZProPost = story.IsBZProPost;
    this.meta = story.Meta;
    this.nodeId = story.NodeID;
    this.partnerURL = story.PartnerURL;
    this.published = story.Published;
    this.quotes = story.Quotes;
    this.sentiment = story.Sentiment;
    this.tags = story.Tags;
    this.teaserText = story.TeaserText;
    this.tickers = story.Tickers;
    this.title = story.Title;
    this.source = sources?.find(source => source.id === story.Type);
    this.updatedAt = story.UpdatedAt;
    this.userId = story.UserID;
    this.versionId = story.VersionID;

    this.createdAtDate = new Date(story.CreatedAt);
    this.updatedAtDate = new Date(story.UpdatedAt);

    this.manager = manager;
  }

  private static compareAndReturn = <T>(a: T, b: T, callback: (updated: boolean) => void): T => {
    callback(a === undefined && b !== undefined);
    return a ?? b;
  };

  public updateStory = (story: SocketStory, sources: Source[] | undefined): Story => {
    const updateType = this.storyId === story.ID ? 'story_extend' : 'story_update';

    if (updateType === 'story_update') {
      this.addedAt = new Date();
    }

    let didUpdate = false;
    const update = (updated: boolean): boolean => (didUpdate = didUpdate || updated);

    this.assets = Story.compareAndReturn(story.assets, this.assets, update);
    this.author = Story.compareAndReturn(story.name, this.author, update);
    this.body = Story.compareAndReturn(story.Body, this.body, update);
    this.channels = Story.compareAndReturn(story.Channels, this.channels, update);
    this.createdAt = Story.compareAndReturn(story.CreatedAt, this.createdAt, update);
    this.doNotDistribute = Story.compareAndReturn(story.DoNotDistribute, this.doNotDistribute, update);
    this.eventId = Story.compareAndReturn(story.EventID, this.eventId, update);
    this.futures = Story.compareAndReturn(story.Futures, this.futures, update);
    this.storyId = Story.compareAndReturn(story.ID, this.storyId, update);
    this.isBZPost = Story.compareAndReturn(story.IsBZPost, this.isBZPost, update);
    this.isBZProPost = Story.compareAndReturn(story.IsBZProPost, this.isBZProPost, update);
    this.meta = Story.compareAndReturn(story.Meta, this.meta, update);
    this.nodeId = Story.compareAndReturn(story.NodeID, this.nodeId, update);
    this.partnerURL = Story.compareAndReturn(story.PartnerURL, this.partnerURL, update);
    this.published = Story.compareAndReturn(story.Published, this.published, update);
    this.quotes = Story.compareAndReturn(story.Quotes, this.quotes, update);
    this.sentiment = Story.compareAndReturn(story.Sentiment, this.sentiment, update);
    this.tags = Story.compareAndReturn(story.Tags, this.tags, update);
    this.teaserText = Story.compareAndReturn(story.TeaserText, this.teaserText, update);
    this.tickers = Story.compareAndReturn(story.Tickers, this.tickers, update);
    this.title = Story.compareAndReturn(story.Title, this.title, update);
    this.updatedAt = Story.compareAndReturn(story.UpdatedAt, this.updatedAt, update);
    this.userId = Story.compareAndReturn(story.UserID, this.userId, update);
    this.versionId = Story.compareAndReturn(story.VersionID, this.versionId, update);

    const newSources = sources?.find(source => source.id === story.Type) ?? this.source;
    if (this.source !== newSources) {
      didUpdate = true;
    }
    this.createdAtDate = story.CreatedAt ? new Date(story.CreatedAt) : this.createdAtDate;
    this.updatedAtDate = story.UpdatedAt ? new Date(story.UpdatedAt) : this.updatedAtDate;

    if (didUpdate === true) {
      this.call({
        story: this,
        type: updateType,
      });
    }

    return this;
  };

  public getBody = (): string | null | undefined => {
    return this.body;
  };

  public fetchBody = async (): SafePromise<string> => {
    const body = await this.manager.getStoryBody(this);
    if (body.result) {
      this.body = body.result;
    }
    return body;
  };

  public isBodyLoaded = (): boolean => this.body !== undefined;

  public getAddedAt = (): Date => {
    return this.addedAt;
  };

  public getAuthor = (): string | null | undefined => {
    return this.author;
  };

  public getAssets = (): Assets[] | undefined => {
    return this.assets;
  };

  public getChannels = (): StoryCategory[] | null | undefined => {
    return this.channels;
  };

  public getCreatedAt = (): string => {
    return this.createdAt;
  };

  public getCreatedAtDate = (): Date => {
    return this.createdAtDate;
  };

  public getDoNotDistribute = (): boolean | undefined => {
    return this.doNotDistribute;
  };

  public getEventId = (): string | undefined => {
    return this.eventId;
  };

  public getFutures = (): StoryCategory[] | null | undefined => {
    return this.futures;
  };

  public getIsBZPost = (): boolean | undefined => {
    return this.isBZPost;
  };

  public getIsBZProPost = (): boolean | undefined => {
    return this.isBZProPost;
  };

  public getMeta = (): Meta | undefined => {
    return this.meta;
  };

  public getNodeId = (): NodeId => {
    return this.nodeId;
  };

  public getPartnerURL = (): string | null | undefined => {
    return this.partnerURL;
  };

  public getPublished = (): boolean | undefined => {
    return this.published;
  };

  public getQuotes = (): Quote[] | null | undefined => {
    return this.quotes;
  };

  public getSentiment = (): Sentiment | undefined => {
    return this.sentiment;
  };

  public getStoryId = (): StoryId => {
    return this.storyId;
  };

  public getTags = (): StoryCategory[] | null | undefined => {
    return this.tags;
  };

  public getTeaserText = (): string | null | undefined => {
    return this.teaserText;
  };

  public getTickers = (): StoryCategory[] | null | undefined => {
    return this.tickers;
  };

  public getTitle = (): string | null | undefined => {
    return this.title;
  };

  public getSource = (): Source | undefined => {
    return this.source;
  };

  public getUpdatedAt = (): string => {
    return this.updatedAt;
  };

  public getUpdatedAtDate = (): Date => {
    return this.updatedAtDate;
  };

  public getUserId = (): number | undefined => {
    return this.userId;
  };

  public getVersionId = (): VersionId => {
    return this.versionId;
  };

  public viewWithIframe = (): boolean => {
    const source = this.source;
    if (source) {
      return this.manager.getStoredPressReleases()?.includes(source.id) || this.source?.id === SourceId.PrSecfilings;
    }
    console.log('viewWithIframe is being called before pulling sources');
    return false;
  };

  public getStoryQuotes = (): StoryQuotes => {
    return (
      this.quotes?.reduce<StoryQuotes>((acc, item) => {
        acc[item.symbol] = item;
        return acc;
      }, {}) ?? {}
    );
  };
}

export type StoryQuotes = {
  [stockSymbol in StockSymbol]: Quote;
};
