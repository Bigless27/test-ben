import { SafePromise } from '@benzinga/safe-await';
import { RestfulClient } from '../../utils';
import {
  IChatChannel,
  IChatIdentity,
  IChatIdentityPost,
  IChatMember,
  IChatMessage,
  IChatMessagePost,
  ChatMessageReportReason,
  ICursorPaginatedResponse,
} from './entities';

export class ChatRestful extends RestfulClient {
  getChannels = (): SafePromise<IChatChannel[]> => {
    const url = this.URL('api/v1/chat/channels/');
    return this.debouncedGet(url);
  };

  joinChannel = (uuid: string): SafePromise<IChatIdentity> => {
    const url = this.URL(`api/v1/chat/channels/${uuid}/join`);
    return this.post(url);
  };

  partChannel = (uuid: string): SafePromise<IChatIdentity> => {
    const url = this.URL(`api/v1/chat/channels/${uuid}/part`);
    return this.post(url);
  };

  getMembers = (uuid: string): SafePromise<IChatMember[]> => {
    const url = this.URL(`api/v1/chat/channels/${uuid}/members`);
    return this.debouncedGet(url);
  };

  getIdentity = (): SafePromise<IChatIdentity> => {
    const url = this.URL(`api/v1/chat/identity`);
    return this.debouncedGet(url);
  };

  updateIdentity = (identity: IChatIdentityPost): SafePromise<IChatIdentity> => {
    const url = this.URL(`api/v1/chat/identity`);
    return this.put(url, identity);
  };

  patchIdentity(identity: Partial<IChatIdentityPost>): SafePromise<IChatIdentity> {
    const url = this.URL(`api/v1/chat/identity`);
    return this.patch(url, identity);
  }

  getMessages = (channelUuid: string, cursor?: string): SafePromise<ICursorPaginatedResponse<IChatMessage>> => {
    const url = this.URL(`api/v1/chat/messages?channel=${channelUuid}`);
    if (cursor) {
      const cursorUrl = this.URL(cursor);
      return this.debouncedGet(cursorUrl);
    }
    return this.debouncedGet(url);
  };

  postMessage = (data: IChatMessagePost): SafePromise<IChatMessage> => {
    const url = this.URL(`api/v1/chat/messages`);
    return this.post(url, data);
  };

  getMessage(uuid: string): SafePromise<IChatMessage> {
    const url = this.URL(`api/v1/chat/messages/${uuid}`);
    return this.debouncedGet(url);
  }

  patchMessage(uuid: string, data: Partial<IChatMessage>): SafePromise<IChatMessage> {
    const url = this.URL(`api/v1/chat/messages/${uuid}`);
    return this.patch(url, data);
  }

  deleteMessage(uuid: string): SafePromise<Response> {
    const url = this.URL(`api/v1/chat/messages/${uuid}`);
    return this.delete(url);
  }

  reportMessage(uuid: string, reason: ChatMessageReportReason | null, message: string): SafePromise<Response> {
    const url = this.URL(
      reason
        ? `api/v1/chat/messages/report/${uuid}?reason=${reason}&message=${message}`
        : `api/v1/chat/messages/report/${uuid}?message=${message}`,
    );
    return this.debouncedGet(url);
  }
}
