import { BZQLExpressionType, ExpressionType } from '../../../expressions';

type Attributes<ATT extends string> = '' | `.${ATT}`;

type AssetType = Attributes<'type' | 'title' | 'mime' | 'primary' | 'copyright' | 'url'>;
type CategoryType = Attributes<'tid' | 'vid' | 'name' | 'description' | 'primary' | 'price' | 'volume' | 'sectors'>;
type QuoteType = Attributes<'symbol' | 'price' | 'volume'>;

export type NewsfeedFieldType =
  | 'ID'
  | 'Event'
  | 'NodeID'
  | 'UserID'
  | 'VersionID'
  | 'Type'
  | 'Published'
  | 'CreatedAt'
  | 'UpdatedAt'
  | 'Title'
  | 'Fulltext'
  | 'Body'
  | 'Name'
  | `Assets${AssetType}`
  | 'PartnerUrl'
  | 'TeaserText'
  | `Tags${CategoryType}`
  | `Tickers${CategoryType}`
  | `Futures${CategoryType}`
  | `Channels${CategoryType}`
  | `Quotes${QuoteType}`
  | 'IsBzPost'
  | 'IsBzProPost'
  | 'DoNotDistribute'
  | 'Sentiment'
  | 'Meta';

export type NewsExpressionType = ExpressionType<NewsfeedFieldType>;
export type NewsBZQLExpressionType = BZQLExpressionType<NewsfeedFieldType>;
