/**
 * FileShareQueueService
 * Holds a pending file to be shared in chat.
 * No key is stored here — the recipient must enter the key manually to decrypt.
 * User selects a file from /files, queues it here, then navigates to /chat to send it.
 */

import { Injectable, signal } from '@angular/core';
import { UploadedFile } from '../../models/file.models';

export interface QueuedFile {
  file: UploadedFile;
}

@Injectable({
  providedIn: 'root'
})
export class FileShareQueueService {
  /** The currently queued file waiting to be shared in chat */
  queuedFile = signal<QueuedFile | null>(null);

  enqueue(file: UploadedFile): void {
    this.queuedFile.set({ file });
  }

  dequeue(): void {
    this.queuedFile.set(null);
  }
}
