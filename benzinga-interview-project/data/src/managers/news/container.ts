import { Subscribable } from '@benzinga/subscribable';
import { SortedArrayBuffer, Container, ContainerEvent } from '../../utils';
import { Story } from './story';
import { NewsFeedEvents } from './feed';

export type NewsContainerEvent = ContainerEvent<Story>;

export class NewsContainer extends Container<Story, NewsFeedEvents, SortedArrayBuffer<Story>> {
  constructor(signalSocket: Subscribable<NewsFeedEvents>, MaxQueueSize = Infinity) {
    super(
      signalSocket,
      MaxQueueSize,
      new SortedArrayBuffer<Story>(NewsContainer.sort),
      new SortedArrayBuffer<Story>(NewsContainer.sort),
    );
  }

  private static sort = (a: Story, b: Story): -1 | 0 | 1 =>
    NewsContainer.getCreatedAt(a) < NewsContainer.getCreatedAt(b)
      ? -1
      : NewsContainer.getCreatedAt(a) > NewsContainer.getCreatedAt(b)
      ? 1
      : 0;

  private static getCreatedAt = (story: Story): Date => {
    return story.getCreatedAtDate();
  };

  protected onMessage = (event: NewsFeedEvents): void => {
    switch (event.type) {
      case 'new_stories':
      case 'historic_stories':
        this.pushItems(event.stories);
        break;
      case 'close':
        this.clear();
        break;
    }
  };
}
