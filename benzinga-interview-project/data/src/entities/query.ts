import { BZQLExpressionType, BZQLExpression } from '../expressions';
import { NewsfeedFieldType } from '../managers/news/entities';

export type BZQLQuery = {
  fields: NewsfeedFieldType[];
  limit: number;
  offset: number;
  sort: Partial<Record<NewsfeedFieldType, -1 | 1>>;
  where: BZQLExpression<NewsfeedFieldType> | null;
};

export type BZQLRequestQuery = {
  fields: NewsfeedFieldType[];
  limit: number;
  offset: number;
  sort?: Partial<Record<NewsfeedFieldType, -1 | 1>>;
  where: BZQLExpressionType<NewsfeedFieldType> | null;
};
