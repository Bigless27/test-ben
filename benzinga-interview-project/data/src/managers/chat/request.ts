import { SafeError, SafePromise } from '@benzinga/safe-await';
import { ExtendedSubscribable } from '@benzinga/subscribable';
import { ChatRestful } from './restful';
import { SessionManager } from '../session';
import {
  ChatMessageReportReason,
  IChatChannel,
  IChatIdentity,
  IChatIdentityPost,
  IChatMember,
  IChatMessage,
  IChatMessagePost,
  ICursorPaginatedResponse,
} from './entities';

interface ErrorEvent {
  error: SafeError;
  errorType:
    | 'get_channel_error'
    | 'join_channel_error'
    | 'part_channel_error'
    | 'member_error'
    | 'identity_error'
    | 'message_error';
  type: 'error';
}

interface ChannelEvent {
  channels: IChatChannel[];
  type: 'channel_received';
}

export interface ChatEvent {
  identity: IChatIdentity;
  type: 'join_channel' | 'part_channel' | 'identity_retrived' | 'identity_update';
}

export interface MemberEvent {
  members: IChatMember[];
  type: 'members_retrieved' | 'member_update';
}

export interface MessageEvent {
  message: IChatMessage;
  type: 'message_updated';
}

export interface MessageRetrivedEvent {
  messages: ICursorPaginatedResponse<IChatMessage>;
  type: 'messages_retrieved';
}

export interface MessageDeleteEvent {
  message: Response;
  type: 'message_deleted' | 'message_report';
}

export interface ChannelUpdateEvent {
  channels: IChatChannel[];
  type: 'channel_update';
}
export type ChatRestfulEvent =
  | ErrorEvent
  | ChannelEvent
  | ChannelUpdateEvent
  | ChatEvent
  | MemberEvent
  | MessageEvent
  | MessageRetrivedEvent
  | MessageDeleteEvent;

interface ChatFunctions {
  deleteMessage: ChatRequest['deleteMessage'];
  getChannels: ChatRequest['getChannels'];
  getIdentity: ChatRequest['getIdentity'];
  getMembers: ChatRequest['getMembers'];
  getMessage: ChatRequest['getMessage'];
  getMessages: ChatRequest['getMessages'];
  joinChannel: ChatRequest['joinChannel'];
  partChannel: ChatRequest['partChannel'];
  patchIdentity: ChatRequest['patchIdentity'];
  patchMessage: ChatRequest['patchMessage'];
  postMessage: ChatRequest['postMessage'];
  reportMessage: ChatRequest['reportMessage'];
  updateIdentity: ChatRequest['updateIdentity'];
}

export class ChatRequest extends ExtendedSubscribable<ChatRestfulEvent, ChatFunctions> {
  private restful: ChatRestful;

  constructor(url: URL, session: SessionManager) {
    super();
    this.restful = new ChatRestful(url, session);
  }

  public getChannels = async (): SafePromise<IChatChannel[]> => {
    const channels = await this.restful.getChannels();
    if (channels.err) {
      this.call({
        error: channels.err,
        errorType: 'get_channel_error',
        type: 'error',
      });
    } else {
      this.call({
        channels: channels.result,
        type: 'channel_received',
      });
    }
    return channels;
  };

  public joinChannel = async (uuid: string): SafePromise<IChatIdentity> => {
    const identity = await this.restful.joinChannel(uuid);
    if (identity.err) {
      this.call({
        error: identity.err,
        errorType: 'join_channel_error',
        type: 'error',
      });
    } else {
      this.call({
        identity: identity.result,
        type: 'join_channel',
      });
    }
    return identity;
  };

  public partChannel = async (uuid: string): SafePromise<IChatIdentity> => {
    const identity = await this.restful.partChannel(uuid);
    if (identity.err) {
      this.call({
        error: identity.err,
        errorType: 'part_channel_error',
        type: 'error',
      });
    } else {
      this.call({
        identity: identity.result,
        type: 'part_channel',
      });
    }
    return identity;
  };

  public getMembers = async (uuid: string): SafePromise<IChatMember[]> => {
    const members = await this.restful.getMembers(uuid);
    if (members.err) {
      this.call({
        error: members.err,
        errorType: 'member_error',
        type: 'error',
      });
    } else {
      this.call({
        members: members.result,
        type: 'members_retrieved',
      });
    }
    return members;
  };

  public getIdentity = async (): SafePromise<IChatIdentity> => {
    const identity = await this.restful.getIdentity();
    if (identity.err) {
      this.call({
        error: identity.err,
        errorType: 'identity_error',
        type: 'error',
      });
    } else {
      this.call({
        identity: identity.result,
        type: 'identity_retrived',
      });
    }
    return identity;
  };

  public updateIdentity = async (identity: IChatIdentityPost): SafePromise<IChatIdentity> => {
    const updatedIdentity = await this.restful.updateIdentity(identity);
    if (updatedIdentity.err) {
      this.call({
        error: updatedIdentity.err,
        errorType: 'identity_error',
        type: 'error',
      });
    } else {
      this.call({
        identity: updatedIdentity.result,
        type: 'identity_update',
      });
    }
    return updatedIdentity;
  };

  public patchIdentity = async (identity: IChatIdentityPost): SafePromise<IChatIdentity> => {
    const updatedIdentity = await this.restful.patchIdentity(identity);
    if (updatedIdentity.err) {
      this.call({
        error: updatedIdentity.err,
        errorType: 'identity_error',
        type: 'error',
      });
    } else {
      this.call({
        identity: updatedIdentity.result,
        type: 'identity_update',
      });
    }
    return updatedIdentity;
  };

  public getMessages = async (
    channelUuid: string,
    cursor?: string,
  ): SafePromise<ICursorPaginatedResponse<IChatMessage>> => {
    const messages = await this.restful.getMessages(channelUuid, cursor);
    if (messages.err) {
      this.call({
        error: messages.err,
        errorType: 'message_error',
        type: 'error',
      });
    } else {
      this.call({
        messages: messages.result,
        type: 'messages_retrieved',
      });
    }
    return messages;
  };

  public postMessage = async (data: IChatMessagePost): SafePromise<IChatMessage> => {
    const messages = await this.restful.postMessage(data);
    if (messages.err) {
      this.call({
        error: messages.err,
        errorType: 'message_error',
        type: 'error',
      });
    } else {
      this.call({
        message: messages.result,
        type: 'message_updated',
      });
    }
    return messages;
  };

  public getMessage = async (uuid: string): SafePromise<IChatMessage> => {
    const messages = await this.restful.getMessage(uuid);
    if (messages.err) {
      this.call({
        error: messages.err,
        errorType: 'message_error',
        type: 'error',
      });
    } else {
      this.call({
        message: messages.result,
        type: 'message_updated',
      });
    }
    return messages;
  };

  public patchMessage = async (uuid: string, data: Partial<IChatMessage>): SafePromise<IChatMessage> => {
    const messages = await this.restful.patchMessage(uuid, data);
    if (messages.err) {
      this.call({
        error: messages.err,
        errorType: 'message_error',
        type: 'error',
      });
    } else {
      this.call({
        message: messages.result,
        type: 'message_updated',
      });
    }
    return messages;
  };

  public deleteMessage = async (uuid: string): SafePromise<Response> => {
    const messages = await this.restful.deleteMessage(uuid);
    if (messages.err) {
      this.call({
        error: messages.err,
        errorType: 'message_error',
        type: 'error',
      });
    } else {
      this.call({
        message: messages.result,
        type: 'message_deleted',
      });
    }
    return messages;
  };

  public reportMessage = async (
    uuid: string,
    reason: ChatMessageReportReason | null,
    message: string,
  ): SafePromise<Response> => {
    const messages = await this.restful.reportMessage(uuid, reason, message);
    if (messages.err) {
      this.call({
        error: messages.err,
        errorType: 'message_error',
        type: 'error',
      });
    } else {
      this.call({
        message: messages.result,
        type: 'message_report',
      });
    }
    return messages;
  };

  public onSubscribe = (): ChatFunctions => ({
    deleteMessage: this.deleteMessage,
    getChannels: this.getChannels,
    getIdentity: this.getIdentity,
    getMembers: this.getMembers,
    getMessage: this.getMessage,
    getMessages: this.getMessages,
    joinChannel: this.joinChannel,
    partChannel: this.partChannel,
    patchIdentity: this.patchIdentity,
    patchMessage: this.patchMessage,
    postMessage: this.postMessage,
    reportMessage: this.reportMessage,
    updateIdentity: this.updateIdentity,
  });
}
