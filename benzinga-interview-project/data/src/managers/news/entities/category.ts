import { Sound } from '../../../entities';

export type CategoryId = string;

export interface Category {
  description: string;
  id: CategoryId;
  name: string;
  realtimeEmails: boolean;
  sound: Sound;
  tids: number[];
  //tid: number
  //vid: number;
}
