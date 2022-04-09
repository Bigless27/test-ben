import { StockSymbol } from '../../../entities';
import { Essential, UnpackedArray } from '@benzinga/utils';

export type FeedId = string;
export type QueryId = string;

interface Story {
  Body: string | null;
  Channels: StoryCategory[] | null;
  CreatedAt: string;
  DoNotDistribute: boolean;
  EventID: string;
  Futures: StoryCategory[] | null;
  ID: StoryId;
  IsBZPost: boolean;
  IsBZProPost: boolean;
  Meta: Meta;
  NodeID: NodeId;
  PartnerURL: string | null;
  Published: boolean;
  Quotes: Quote[] | null;
  Sentiment: Sentiment;
  Tags: StoryCategory[] | null;
  TeaserText: string | null;
  Tickers: StoryCategory[] | null;
  Title: string | null;
  Type: string;
  UpdatedAt: string;
  UserID: number;
  VersionID: VersionId;

  assets: Assets[];
  name: string | null;
}

export type QueryStory = Partial<Story>;

export type RequiredSocketStoryFields = ['CreatedAt', 'ID', 'NodeID', 'UpdatedAt', 'VersionID'];
export type SocketStory = Essential<QueryStory, UnpackedArray<RequiredSocketStoryFields>>;

export interface Quote {
  price: string;
  symbol: StockSymbol;
  volume: number;
}

export type Sentiment = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export interface StoryCategory {
  description: string;
  name: string;
  price?: string;
  primary: boolean;
  sectors?: Record<string, number>;
  tid: number;
  vid: number;
  volume?: number;
}

export interface Assets {
  copyright: string;
  mime: string;
  primary: boolean;
  title: string;
  type: string;
  url: string;
}

interface Partner {
  Contact: string;
  Copyright: string;
  ID: string;
  Published: string;
  Resource: string;
  RevisionID: string;
  Taxonomies: string[];
  Updated: string;
}

interface PartnerTaxonomy {
  Taxonomies: {
    CIK: string;
    CUSIP: string;
    Exchange: string;
    ISIN: string;
    Name: string;
    Order: string;
    Symbol: string;
  }[];
}

interface MorningstarSector {
  Industry: string;
  // 8-digit Morningstar Industry code.
  IndustryCode: number;

  IndustryGroup: string;
  // 5-digit industry group code. (first 5 digits)
  IndustryGroupCode: number;

  Sector: string;
  // 3-digit sector code. (first 3 digits)
  SectorCode: number;

  SuperSector: string;
  // 1-digit super sector code. (first digit)
  SuperSectorCode: number;
}

interface SICSector {
  // Top-level division description.
  Division: string;
  Industry: string;
  // 4-digit SIC industry code
  IndustryCode: number;

  // 3-digit SIC industry group code (first 3 digits)
  IndustryGroup: number;

  // 2-digit SIC major group code (first 2 digits)
  MajorGroup: number;
}

interface NAICSSector {
  Industry: string;
  // 5-digit NAICS industry code
  IndustryCode: number;

  IndustryGroup: string;
  // 4-digit NAICS industry group code (first 4 digits)
  IndustryGroupCode: number;

  NationalIndustry: string;
  // 6-digit NAICS national industry code
  NationalIndustryCode: number;

  Sector: string;
  // 2-digit NAICS sector code (first 2 digits)
  SectorCode: number;

  SubSector: string;
  // 3-digit NAICS subsector code (first 3 digits)
  SubSectorCode: number;
}

interface SECMeta {
  AccessionNumber: string;
}

export interface Meta {
  EXT: Record<string, unknown> | null;
  Partner: Partner | null;
  PartnerTaxonomy: PartnerTaxonomy | null;
  SEC: SECMeta | null;
  SectorV2: {
    Morningstar: MorningstarSector[];
    NAICS: NAICSSector[];
    SIC: SICSector[];
  } | null;
}

export type StoryId = string; // this is NodeId + VersionID
export type NodeId = number; // this is the Id representing the story without versioning.
export type VersionId = number; // this is the Id representing the NodeId version;
