export type NoteColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface NoteTag {
  id: string;
  userId: string;
  name: string;
  color: NoteColor;
  createdAt: string;
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  userId: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  signedUrl?: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  archived: boolean;
  deletedAt: string | null;
  reminderAt: string | null;
  isTemplate: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  tagIds: string[];
}

export interface CreateNoteInput {
  title: string;
  content: string;
  color?: NoteColor;
  isPinned?: boolean;
  archived?: boolean;
  deletedAt?: string | null;
  reminderAt?: string | null;
  isTemplate?: boolean;
  isPrivate?: boolean;
}

export type NoteView = 'active' | 'archived' | 'trash' | 'reminders' | 'templates';
