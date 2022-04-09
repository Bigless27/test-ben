import { SafeError, SafePromise } from '@benzinga/safe-await';
import { Category } from '../entities';
import { Sound } from '../../../entities';

export interface IncomingCategory {
  channel_description: string;
  channel_id: string;
  channel_name: string;
  channel_path: string;
  count_week: number;
  sound: Sound;
  subscription_type: string;
  tids: {
    name: string;
    tid: string;
  }[];
}

interface RestfulResult<DATA> {
  data: DATA;
  response_code: number;
}

export type IncomingCategoryResult = RestfulResult<Record<IncomingCategory['channel_id'], IncomingCategory>>;

export const ingresCategory = async (ingressCategory: SafePromise<IncomingCategoryResult>): SafePromise<Category[]> => {
  const rawCategory = await ingressCategory;

  if (rawCategory.err) {
    return rawCategory;
  } else {
    if (rawCategory.result?.data) {
      return {
        result: Object.values(rawCategory.result.data).map(category => ({
          description: category.channel_description,
          id: category.channel_id,
          name: category.channel_name,
          realtimeEmails: !!category.subscription_type,
          sound: category.sound,
          tids: category.tids.map((tid: { tid: string }) => parseInt(tid.tid, 10)),
        })),
      };
    } else {
      return { err: new SafeError('did not get a valid category', 'invalid_category') };
    }
  }
};
