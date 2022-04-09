import { SafePromise } from '@benzinga/safe-await';
import { ExtendedSubscribable, Subscription } from '@benzinga/subscribable';

import { StockSymbol } from '../../entities';
import { UUID } from './entities';
import { Note } from './note';
import { NotesStore } from './store';
import { NotesRequest, NotesRestfulEvent } from './request';
import { WatchlistId } from '../watchlist';
import { SessionManager } from '../session';

export interface NotesUpdateEvent {
  notes: Note[];
  type: 'notes_updated';
}

export type NotesManagerEvent = NotesRestfulEvent | NotesUpdateEvent;

interface NotesFunctions {
  createNote: NotesManager['createNote'];
  deleteNote: NotesManager['deleteNote'];
  getNotes: NotesManager['getNotes'];
  getNotesFiltered: NotesManager['getNotesFiltered'];
  updateNote: NotesManager['updateNote'];
}

export class NotesManager extends ExtendedSubscribable<NotesManagerEvent, NotesFunctions> {
  private lastUpdated: Date | null;
  private store: NotesStore;
  private request: NotesRequest;
  private requestSubscription?: Subscription<NotesRequest>;

  constructor(url: URL, session: SessionManager) {
    super();
    this.lastUpdated = null;
    this.store = new NotesStore(this);
    this.request = new NotesRequest(url, session, this.store);
  }

  public createNote = async (symbol: StockSymbol, text: string, watchlistId?: WatchlistId): SafePromise<Note> => {
    const newNote = await this.request.createNote(symbol, text, watchlistId);
    if (newNote.err) {
      return newNote;
    } else {
      if (newNote.result.state === 'new') {
        this.call({
          notes: this.store.getNotes(),
          type: 'notes_updated',
        });
      }
      return { result: newNote.result.note };
    }
  };

  public getNotes = async (): SafePromise<Note[]> => {
    const numberOfMillisecondsIn1Mins = 60000;
    if (Date.now() - (this.lastUpdated?.getTime() ?? 0) > numberOfMillisecondsIn1Mins) {
      const notes = await this.request.getNotes();
      if (notes.result) {
        this.lastUpdated = new Date();
        if (notes.result.state === 'updated') {
          this.call({
            notes: notes.result.notes,
            type: 'notes_updated',
          });
        }
        return { result: notes.result.notes };
      }
    }
    return { result: this.store.getNotes() };
  };

  public getNotesFiltered = async (symbol: StockSymbol): SafePromise<Note[]> => {
    const notes = await this.request.getNotesFiltered(symbol);
    if (notes.err) {
      return notes;
    } else {
      this.lastUpdated = new Date();
      if (notes.result.state === 'updated') {
        this.call({
          notes: this.store.getNotes(),
          type: 'notes_updated',
        });
      }
      return { result: notes.result.notes };
    }
  };

  public getNote = async (uuid: UUID): SafePromise<Note> => {
    const notes = await this.request.getNotesUUID(uuid);
    if (notes.err) {
      return notes;
    } else {
      this.lastUpdated = new Date();
      if (notes.result.state === 'updated') {
        this.call({
          notes: this.store.getNotes(),
          type: 'notes_updated',
        });
      }
      return { result: notes.result.note };
    }
  };

  public updateNote = async (note: Note, text: string): SafePromise<Note> => {
    const updatedNote = await this.request.updateNote(note, text);
    if (updatedNote.err) {
      return updatedNote;
    } else {
      if (updatedNote.result.state !== 'cache') {
        this.call({
          notes: this.store.getNotes(),
          type: 'notes_updated',
        });
      }
      return { result: updatedNote.result.note };
    }
  };

  public deleteNote = async (note: Note): SafePromise<undefined> => {
    const val = await this.request.deleteNote(note);
    if (val.err === undefined) {
      this.store.deleteNote(note);
      this.call({
        notes: this.store.getNotes(),
        type: 'notes_updated',
      });
    }
    return val;
  };

  protected onSubscribe = (): NotesFunctions => ({
    createNote: this.createNote,
    deleteNote: this.deleteNote,
    getNotes: this.getNotes,
    getNotesFiltered: this.getNotesFiltered,
    updateNote: this.updateNote,
  });

  protected onFirstSubscription = (): void => {
    this.requestSubscription = this.request.subscribe(event => this.call(event));
  };

  protected onZeroSubscriptions = (): void => {
    this.requestSubscription?.unsubscribe();
  };
}
