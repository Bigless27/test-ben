export interface IChatChannel {
  category: string;
  description: string;
  name: string;
  uuid: string;
}

export type BadgeName = 'pro' | 'admin' | 'trial' | string;

export interface IChatBadge {
  name: BadgeName;
}

export interface IChatMember {
  badges: IChatBadge[];
  icon_url: string;
  nickname: string;
  uuid: string;
}

export interface IChatChannelMembership {
  category: string;
  description: string;
  name: string;
  uuid: string;
}

export interface IChatIdentity extends IChatMember {
  channels: IChatChannelMembership[];
}

export interface IChatMember {
  badges: IChatBadge[];
  icon_url: string;
  nickname: string;
  uuid: string;
}

export interface IChatIdentityPost {
  nickname: string;
}

export interface IChatMessage {
  author: IChatMember;
  channel: string;
  created_at: string;
  deleted_at: string;
  text: string;
  updated_at: string;
  uuid: string;
}

export interface ICursorPaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface IChatCursor {
  next: string | null;
  previous: string | null;
}

export class ChatMessagePage {
  protected response: ICursorPaginatedResponse<IChatMessage>;

  constructor(response: ICursorPaginatedResponse<IChatMessage>) {
    this.response = response;
  }

  cursor(): IChatCursor {
    return {
      next: this.response.next,
      previous: this.response.previous,
    };
  }

  results(): IChatMessage[] {
    return this.response.results;
  }
}

export interface IChatMessagePost {
  channel: string;
  text: string;
}

export enum ChatMessageReportReason {
  abusive = 'abusive',
  illegal = 'illegal',
  other = 'other',
  rumors = 'rumors',
  sexual = 'sexual',
  spam = 'spam',
}
