import { SafeError, SafePromise } from '@benzinga/safe-await';
import { ExtendedSubscribable } from '@benzinga/subscribable';

import { StockSymbol } from '../../entities';
import { UUID } from './entities';
import { Note } from './note';
import { NotesStore, NoteState, NotesState } from './store';
import { NotesRestful } from './restful';
import { WatchlistId } from '../watchlist';
import { SessionManager } from '../session';

interface ErrorEvent {
  error: SafeError;
  errorType:
    | 'get_note_error'
    | 'get_filtered_note_error'
    | 'create_note_error'
    | 'delete_note_error'
    | 'remove_note_error'
    | 'update_note_error';
  type: 'error';
}

interface NoteEvent {
  note: Note;
  type: 'note_created' | 'note_deleted';
}

interface NoteGetEvent {
  note: Note[];
  type: 'note_get';
}

interface NoteFilteredGetEvent {
  note: Note[];
  symbol: StockSymbol;
  type: 'note_symbol_get';
}

interface NoteUUIDGetEvent {
  note: Note;
  type: 'note_uuid_get';
  uuid: UUID;
}

interface NoteUpdateEvent {
  note: Note;
  type: 'note_updated';
}

export type NotesRestfulEvent =
  | ErrorEvent
  | NoteEvent
  | NoteGetEvent
  | NoteUUIDGetEvent
  | NoteFilteredGetEvent
  | NoteUpdateEvent;

interface NotesFunctions {
  createNote: NotesRequest['createNote'];
  deleteNote: NotesRequest['deleteNote'];
  getNotes: NotesRequest['getNotes'];
  getNotesFiltered: NotesRequest['getNotesFiltered'];
  updateNote: NotesRequest['updateNote'];
}

export class NotesRequest extends ExtendedSubscribable<NotesRestfulEvent, NotesFunctions> {
  private restful: NotesRestful;
  private store: NotesStore;

  constructor(url: URL, session: SessionManager, store: NotesStore) {
    super();
    this.store = store;
    this.restful = new NotesRestful(url, session);
  }

  public createNote = async (symbol: StockSymbol, text: string, watchlistId?: WatchlistId): SafePromise<NoteState> => {
    const newNote = await this.restful.createNote(symbol, text, watchlistId);
    if (newNote.err) {
      this.call({
        error: newNote.err,
        errorType: 'create_note_error',
        type: 'error',
      });
      return { err: newNote.err };
    } else {
      const noteState = this.store.updateNote(newNote.result);
      this.call({
        note: noteState.note,
        type: 'note_created',
      });
      return { result: noteState };
    }
  };

  public getNotes = async (): SafePromise<NotesState> => {
    const notes = await this.restful.getNotes();
    if (notes.err) {
      this.call({
        error: notes.err,
        errorType: 'get_note_error',
        type: 'error',
      });
      return { err: notes.err };
    } else {
      const notesState = this.store.resetAllNotes(notes.result);
      this.call({
        note: notesState.notes,
        type: 'note_get',
      });
      return { result: notesState };
    }
  };

  public getNotesFiltered = async (symbol: StockSymbol): SafePromise<NotesState<Note>> => {
    const notes = await this.restful.getNotesFiltered(symbol);
    if (notes.err) {
      this.call({
        error: notes.err,
        errorType: 'get_filtered_note_error',
        type: 'error',
      });
      return { err: notes.err };
    } else {
      const notesState = this.store.resetSameSymbolNotes(symbol, notes.result);
      this.call({
        note: notesState.notes,
        symbol,
        type: 'note_symbol_get',
      });
      return { result: notesState };
    }
  };

  public getNotesUUID = async (uuid: UUID): SafePromise<NoteState<Note>> => {
    const notes = await this.restful.getNotesFiltered(uuid);
    if (notes.err) {
      this.call({
        error: notes.err,
        errorType: 'get_filtered_note_error',
        type: 'error',
      });
      return { err: notes.err };
    } else if (notes.result.length === 0) {
      const notesState = this.store.updateNote(notes.result[0]);
      this.call({
        note: notesState.note,
        type: 'note_uuid_get',
        uuid,
      });
      return { result: notesState };
    } else if (notes.result.length > 1) {
      const err = new SafeError('more then one note was returned for uuid lookup', 'invalid_return_for_uuid');
      this.call({
        error: err,
        errorType: 'get_filtered_note_error',
        type: 'error',
      });
      return { err };
    } else {
      const err = new SafeError('no notes were returned for uuid', 'invalid_return_for_uuid');
      this.call({
        error: err,
        errorType: 'get_filtered_note_error',
        type: 'error',
      });
      return { err };
    }
  };

  public updateNote = async (note: Note, text: string): SafePromise<NoteState<Note>> => {
    const updatedNote = await this.restful.updateNote(note.getUuid(), text);
    if (updatedNote.err) {
      this.call({
        error: updatedNote.err,
        errorType: 'update_note_error',
        type: 'error',
      });

      return { err: updatedNote.err };
    } else {
      const notesState = this.store.updateNote(updatedNote.result);
      this.call({
        note: notesState.note,
        type: 'note_updated',
      });
      return { result: notesState };
    }
  };

  public deleteNote = async (note: Note): SafePromise<undefined> => {
    const val = await this.restful.deleteNote(note.getUuid());
    if (val.err) {
      this.call({
        error: val.err,
        errorType: 'delete_note_error',
        type: 'error',
      });
      return { err: val.err };
    } else {
      this.call({
        note: note,
        type: 'note_deleted',
      });
      return { result: undefined };
    }
  };

  public onSubscribe = (): NotesFunctions => ({
    createNote: this.createNote,
    deleteNote: this.deleteNote,
    getNotes: this.getNotes,
    getNotesFiltered: this.getNotesFiltered,
    updateNote: this.updateNote,
  });
}
