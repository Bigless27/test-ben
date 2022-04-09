import { SafePromise } from '@benzinga/safe-await';
import { Subscribable } from '@benzinga/subscribable';
import { NotesManager } from './manager';
import { IngressNote, UUID } from './entities';

interface UpdateEvent {
  note: Note;
  type: 'note_updated';
}

interface DeleteEvent {
  note: Note;
  type: 'note_deleted';
}

export type NoteEvent = UpdateEvent | DeleteEvent;

export interface NoteJson {
  addedAt: Date;
  createdAt: string;
  createdAtDate: Date;
  deleted: boolean;
  settings: Record<string, unknown>;
  symbol: string;
  text: string;
  updatedAt: string | null;
  updatedAtDate: Date | null;
  uuid: UUID;
  watchlist: string | null;
  watchlistId: null | string | number;
}

export class Note extends Subscribable<NoteEvent> {
  private createdAt: string;
  private updatedAt: string | null;
  private deleted: boolean;
  private settings: Record<string, unknown>;
  private symbol: string;
  private text: string;
  private uuid: UUID;
  private watchlist: string | null;
  private watchlistId: null | string | number;

  private addedAt: Date;
  private createdAtDate: Date;
  private updatedAtDate: Date | null;

  private readonly manager: NotesManager;

  constructor(note: IngressNote, manager: NotesManager) {
    super();
    this.addedAt = new Date();
    this.createdAt = note.date_created;
    this.updatedAt = note.date_updated;
    this.deleted = note.deleted;
    this.settings = note.settings;
    this.symbol = note.symbol;
    this.text = note.text;
    this.uuid = note.uuid;
    this.watchlist = note.watchlist;
    this.watchlistId = note.benzinga_watchlist_id;

    this.createdAtDate = new Date(note.date_created);
    this.updatedAtDate = note.date_updated ? new Date(note.date_updated) : null;

    this.manager = manager;
  }

  public updateNote = (note: IngressNote): Note => {
    if (this.updatedAt === note.date_updated) {
      return this;
    }

    this.addedAt = new Date();
    this.createdAt = note.date_created;
    this.updatedAt = note.date_updated;
    this.deleted = note.deleted;
    this.settings = note.settings;
    this.symbol = note.symbol;
    this.text = note.text;
    this.uuid = note.uuid;
    this.watchlist = note.watchlist;
    this.watchlistId = note.benzinga_watchlist_id;

    this.createdAtDate = new Date(note.date_created);
    this.updatedAtDate = note.date_updated ? new Date(note.date_updated) : null;

    this.call({
      note: this,
      type: 'note_updated',
    });

    return this;
  };

  public getUuid = (): UUID => this.uuid;
  public getCreatedAt = (): string => this.createdAt;
  public getUpdatedAt = (): string | null => this.updatedAt;
  public getDeleted = (): boolean => this.deleted;
  public getSettings = (): Record<string, unknown> => this.settings;
  public getSymbol = (): string => this.symbol;
  public getText = (): string => this.text;
  public getWatchlist = (): string | null => this.watchlist;
  public getWatchlistId = (): null | string | number => this.watchlistId;
  public getAddedAt = (): Date => this.addedAt;
  public getCreatedAtDate = (): Date => this.createdAtDate;
  public getUpdatedAtDate = (): Date | null => this.updatedAtDate;

  public delete = async (): SafePromise<undefined> => this.manager.deleteNote(this);
  public update = (text: string): SafePromise<Note> => this.manager.updateNote(this, text);

  public toJSON = (): NoteJson => ({
    addedAt: this.addedAt,
    createdAt: this.createdAt,
    createdAtDate: this.createdAtDate,
    deleted: this.deleted,
    settings: this.settings,
    symbol: this.symbol,
    text: this.text,
    updatedAt: this.updatedAt,
    updatedAtDate: this.updatedAtDate,
    uuid: this.uuid,
    watchlist: this.watchlist,
    watchlistId: this.watchlistId,
  });
}

// this was my solution to javascript not having friend classes
export class NoteInternal extends Note {
  public internalFireDeleteEvent = (): void => {
    this.call({
      note: this,
      type: 'note_deleted',
    });
  };
}
