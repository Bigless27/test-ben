import { StockSymbol } from '../../entities';
import { IngressNote, UUID } from './entities';
import { NotesManager } from './manager';
import { Note, NoteInternal } from './note';
import { SortedArrayBuffer } from '../../utils';

export interface NoteState<T extends Note = Note> {
  note: T;
  state: 'updated' | 'new' | 'cache';
}

export interface NotesState<T extends Note = Note> {
  notes: T[];
  state: 'updated' | 'cache';
}

export class NotesStore {
  private notes: Map<UUID, NoteInternal> = new Map();
  private stockSymbolsToNotes: Map<StockSymbol, SortedArrayBuffer<NoteInternal>> = new Map();
  private manager: NotesManager;

  constructor(manager: NotesManager) {
    this.manager = manager;
  }

  // the following function is hacky for performance since we are taking advantage Map lookup speed
  public resetAllNotes = (notes: IngressNote[]): NotesState => {
    const newNotes = this.processNotes(notes);
    // remove all items we from the buffer that we know we are keeping
    newNotes.notes.forEach(note => this.notes.delete(note.getUuid()));
    // this leaves us with only the items we are going to be deleting
    this.notes.forEach(val => val.internalFireDeleteEvent());
    this.notes = new Map();
    this.stockSymbolsToNotes = new Map();
    // add all the items we are keeping back in
    newNotes.notes.forEach(note => this.setNote(note));
    return newNotes;
  };

  // the following function is hacky for performance since we are taking advantage of SortedArrayBuffer binary search
  public resetSameSymbolNotes = (symbol: StockSymbol, notes: IngressNote[]): NotesState => {
    const newNotes = this.processNotes(notes);
    const buffer = this.stockSymbolsToNotes.get(symbol);
    // this will always be true since process Notes creates the buffer. added check to make typescript happy
    if (buffer) {
      // remove all items we from the buffer that we know we are keeping
      newNotes.notes.forEach(note => buffer.delete(note));
      // this leaves us with only the items we are going to be deleting
      buffer.toArray().forEach(note => {
        note.internalFireDeleteEvent();
        const id = note.getUuid();
        if (id) {
          this.notes.delete(id.toString());
        }
      });
      buffer.clear();
      // add all the items we are keeping back in
      newNotes.notes.forEach(note => buffer.push(note));
    }
    return newNotes;
  };

  public updateNote = (note: IngressNote): NoteState => this.processNote(note);

  public deleteNote = (note: Note): boolean => {
    const cachedNote = this.notes.get(note.getUuid());
    const val = this.notes.delete(note.getUuid());
    cachedNote?.internalFireDeleteEvent();
    return val;
  };

  public getNotes = (): Note[] => Array.from(this.notes.values());

  protected getNote = (id: UUID): NoteInternal | undefined => this.notes.get(id);

  private compare = (lhs: NoteInternal, rhs: NoteInternal) =>
    lhs.getCreatedAtDate() < rhs.getCreatedAtDate() ? -1 : lhs.getCreatedAtDate() > rhs.getCreatedAtDate() ? 1 : 0;

  private setNote = (note: NoteInternal) => {
    this.notes.set(note.getUuid(), note);
    let buffer = this.stockSymbolsToNotes.get(note.getSymbol());
    if (buffer === undefined) {
      buffer = new SortedArrayBuffer<NoteInternal>(this.compare);
      this.stockSymbolsToNotes.set(note.getSymbol(), buffer);
    }
    buffer.push(note);
  };

  private processNotes = (notes: IngressNote[]): NotesState<NoteInternal> => {
    const noteStates = notes.map(note => this.processNote(note));
    const newNotes = noteStates.reduce<NotesState<NoteInternal>>(
      (acc, val) => ({
        notes: [...acc.notes, val.note],
        state: acc.state === 'cache' ? (val.state === 'new' ? 'updated' : val.state) : acc.state,
      }),
      { notes: [], state: 'cache' },
    );
    return newNotes;
  };

  private processNote = (note: IngressNote): NoteState<NoteInternal> => {
    const cachedStory = this.getNote(note.uuid);

    if (cachedStory) {
      if (
        note.date_updated !== null &&
        (cachedStory.getUpdatedAtDate() ?? cachedStory.getCreatedAtDate()) <= new Date(note.date_updated)
      ) {
        cachedStory.updateNote(note);
        return { note: cachedStory, state: 'updated' };
      } else {
        return { note: cachedStory, state: 'cache' };
      }
    } else {
      const newNote = new NoteInternal(note, this.manager);
      this.setNote(newNote);
      return { note: newNote, state: 'new' };
    }
  };
}
