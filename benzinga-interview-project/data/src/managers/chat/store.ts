import { IChatChannel, IChatIdentity, IChatMember } from './entities';

export class ChatStore {
  private channelLastFetched?: Date;
  private membersLastFetched?: Date;
  private identityLastFetched?: Date;
  private channels?: IChatChannel[];
  private members?: IChatMember[];
  private identity?: IChatIdentity;

  constructor() {
    this.channelLastFetched = undefined;
    this.membersLastFetched = undefined;
    this.identityLastFetched = undefined;
    this.channels = undefined;
    this.members = undefined;
    this.identity = undefined;
  }

  public static compareChannels = (lhs: IChatChannel[], rhs: IChatChannel[]): boolean => {
    return lhs?.every(channel => {
      const newChannel = rhs.find(newChannel => channel.uuid === newChannel.uuid);
      if (newChannel) {
        return true;
      } else {
        return false;
      }
    });
  };

  public static compareMembers = (lhs: IChatMember[], rhs: IChatMember[]): boolean => {
    return lhs?.every(member => {
      const newMember = rhs.find(newMember => member.uuid === newMember.uuid);
      if (newMember) {
        return true;
      } else {
        return false;
      }
    });
  };

  public shouldWeFetchChannels = (): boolean => {
    const ONE_MIN = 60 * 1000; /* ms */
    const lastCalled = this.channelLastFetched?.getTime() ?? 0; // use this once all channels are grabbed from manager
    if (this.channels === undefined || Date.now() - lastCalled > ONE_MIN) {
      return true;
    }
    return false;
  };

  public shouldWeFetchMembers = (): boolean => {
    const ONE_MIN = 60 * 1000; /* ms */
    const lastCalled = this.membersLastFetched?.getTime() ?? 0; // use this once all channels are grabbed from manager
    if (this.members === undefined || Date.now() - lastCalled > ONE_MIN) {
      return true;
    }
    return false;
  };

  public shouldWeFetchIdentity = (): boolean => {
    const ONE_MIN = 60 * 1000; /* ms */
    const lastCalled = this.identityLastFetched?.getTime() ?? 0; // use this once all channels are grabbed from manager
    if (this.identity === undefined || Date.now() - lastCalled > ONE_MIN) {
      return true;
    }
    return false;
  };

  public getChannels = (): IChatChannel[] | undefined => {
    return this.channels;
  };

  public getMembers = (): IChatMember[] | undefined => {
    return this.members;
  };

  public getIdentity = (): IChatIdentity | undefined => {
    return this.identity;
  };

  public updateIdentity = (identity: IChatIdentity): boolean => {
    if (this.identity) {
      this.identityLastFetched = new Date();
      return true;
    } else {
      this.identity = identity;
      return false;
    }
  };

  public updateChannels = (channels: IChatChannel[]): boolean => {
    if (this.channels && ChatStore.compareChannels(this.channels, channels)) {
      this.channelLastFetched = new Date();
      return true;
    } else {
      this.channels = channels;
      return false;
    }
  };

  public updateMembers = (members: IChatMember[]): boolean => {
    if (this.members && ChatStore.compareMembers(this.members, members)) {
      this.membersLastFetched = new Date();
      return true;
    } else {
      this.members = members;
      return false;
    }
  };
}
