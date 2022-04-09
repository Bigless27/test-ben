import { SafePromise } from '@benzinga/safe-await';
import { ExtendedSubscribable, Subscription } from '@benzinga/subscribable';
import { SessionManager } from '../session';
import {
  ChatMessagePage,
  ChatMessageReportReason,
  IChatChannel,
  IChatIdentity,
  IChatIdentityPost,
  IChatMember,
  IChatMessage,
  IChatMessagePost,
} from './entities';
import { ChatRequest, ChatRestfulEvent, MemberEvent, MessageDeleteEvent, MessageRetrivedEvent } from './request';
import { ChatStore } from './store';

interface ChatFunctions {
  deleteMessage: ChatManager['deleteMessage'];
  getChannels: ChatManager['getChannels'];
  getIdentity: ChatManager['getIdentity'];
  getMembers: ChatManager['getMembers'];
  getMessage: ChatManager['getMessage'];
  getMessages: ChatManager['getMessages'];
  joinChannel: ChatManager['joinChannel'];
  partChannel: ChatManager['partChannel'];
  patchIdentity: ChatManager['patchIdentity'];
  patchMessage: ChatManager['patchMessage'];
  postMessage: ChatManager['postMessage'];
  reportMessage: ChatManager['reportMessage'];
  updateIdentity: ChatManager['updateIdentity'];
}

export type ChatManagerEvent =
  | ChatRestfulEvent
  | MemberEvent
  | MessageEvent
  | MessageRetrivedEvent
  | MessageDeleteEvent;

export class ChatManager extends ExtendedSubscribable<ChatManagerEvent, ChatFunctions> {
  private store: ChatStore;
  private request: ChatRequest;
  private requestSubscription?: Subscription<ChatRequest>;

  constructor(url: URL, session: SessionManager) {
    super();
    this.store = new ChatStore();
    this.request = new ChatRequest(url, session);
  }

  public getChannels = async (force?: boolean): SafePromise<IChatChannel[] | undefined> => {
    if (force || this.store.shouldWeFetchChannels() === true) {
      const channels = await this.request.getChannels();
      if (channels.result) {
        if (this.store.updateChannels(channels.result)) {
          this.call({
            channels: channels.result,
            type: 'channel_update',
          });
        }
      }
      return channels;
    } else {
      return { result: this.store.getChannels() };
    }
  };

  public joinChannel = async (uuid: string): SafePromise<IChatIdentity | undefined> => {
    return await this.request.joinChannel(uuid);
  };

  public partChannel = async (uuid: string): SafePromise<IChatIdentity | undefined> => {
    return await this.request.partChannel(uuid);
  };

  public getMembers = async (uuid: string, force?: boolean): SafePromise<IChatMember[] | undefined> => {
    if (force || this.store.shouldWeFetchMembers() === true) {
      const members = await this.request.getMembers(uuid);
      if (members.result) {
        if (this.store.updateMembers(members.result)) {
          this.call({
            members: members.result,
            type: 'member_update',
          });
        }
      }
      return members;
    } else {
      return { result: this.store.getMembers() };
    }
  };

  public getIdentity = async (): SafePromise<IChatIdentity | undefined> => {
    if (this.store.shouldWeFetchIdentity() === true) {
      const identity = await this.request.getIdentity();
      if (identity.result) {
        if (this.store.updateIdentity(identity.result)) {
          this.call({
            identity: identity.result,
            type: 'identity_update',
          });
        }
      }
      return identity;
    } else {
      return { result: this.store.getIdentity() };
    }
  };

  public updateIdentity = async (identity: IChatIdentityPost): SafePromise<IChatIdentity | undefined> => {
    return await this.request.updateIdentity(identity);
  };

  public patchIdentity = async (identity: IChatIdentityPost): SafePromise<IChatIdentity> => {
    return await this.request.patchIdentity(identity);
  };

  public getMessages = async (channelUuid: string, cursor?: string): SafePromise<ChatMessagePage> => {
    const messages = await this.request.getMessages(channelUuid, cursor);
    if (messages.result) {
      return { result: new ChatMessagePage(messages.result) };
    }
    return messages;
  };

  public postMessage = async (data: IChatMessagePost): SafePromise<IChatMessage> => {
    return await this.request.postMessage(data);
  };

  public getMessage = async (uuid: string): SafePromise<IChatMessage> => {
    return await this.request.getMessage(uuid);
  };

  public patchMessage = async (uuid: string, data: Partial<IChatMessage>): SafePromise<IChatMessage> => {
    return await this.request.patchMessage(uuid, data);
  };

  public deleteMessage = async (uuid: string): SafePromise<Response> => {
    return await this.request.deleteMessage(uuid);
  };

  public reportMessage = async (
    uuid: string,
    reason: ChatMessageReportReason | null,
    message: string,
  ): SafePromise<Response> => {
    return await this.request.reportMessage(uuid, reason, message);
  };

  protected onSubscribe = (): ChatFunctions => ({
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

  protected onFirstSubscription = (): void => {
    this.requestSubscription = this.request.subscribe(event => this.call(event));
  };

  protected onZeroSubscriptions = (): void => {
    this.requestSubscription?.unsubscribe();
  };
}
