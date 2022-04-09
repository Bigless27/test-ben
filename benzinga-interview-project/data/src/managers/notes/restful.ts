import { SafePromise } from '@benzinga/safe-await';

import { RestfulClient } from '../../utils';
import { IngressNote, UUID } from './entities';
import { StockSymbol } from '../../entities';
import { WatchlistId } from '../watchlist';

export class NotesRestful extends RestfulClient {
  getNotes = (): SafePromise<IngressNote[]> => {
    const url = this.URL('api/v1/watchlistnotes/');
    return this.get(url);
  };

  createNote = (symbol: StockSymbol, text: string, watchlistid?: WatchlistId): SafePromise<IngressNote> => {
    const url = this.URL('api/v1/watchlistnotes/');
    return this.post(url, {
      symbol,
      text,
      watchlistid,
    });
  };

  getNotesFiltered = (symbolOrUUID: StockSymbol | UUID): SafePromise<IngressNote[]> => {
    const url = this.URL(`api/v1/watchlistnotes/${symbolOrUUID}/`);
    return this.get(url);
  };

  updateNote = (uuid: UUID, text: string): SafePromise<IngressNote> => {
    const url = this.URL(`api/v1/watchlistnote/${uuid}/`);
    return this.post(url, { text });
  };

  deleteNote = async (uuid: UUID): SafePromise<undefined> => {
    const url = this.URL(`api/v1/watchlistnote/${uuid}/`);
    const deleted = await this.delete(url);
    if (deleted.err) {
      return deleted;
    } else {
      return { result: undefined };
    }
  };
}
