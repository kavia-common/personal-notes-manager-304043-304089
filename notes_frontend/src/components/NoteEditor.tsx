import {
  component$,
  useSignal,
  useTask$,
  type Signal,
  type QRL,
  $,
} from "@builder.io/qwik";
import type { Note, NoteId } from "~/lib/notes";

export interface NoteEditorProps {
  note: Note | null;
  saveStatus: Signal<string>;
  onUpdate$: QRL<(id: NoteId, patch: { title?: string; body?: string }) => void>;
}

export const NoteEditor = component$<NoteEditorProps>(({ note, onUpdate$, saveStatus }) => {
  const title = useSignal(note?.title ?? "");
  const body = useSignal(note?.body ?? "");

  // Keep local editor buffer in sync when selection changes.
  useTask$(({ track }) => {
    track(() => note?.id);
    title.value = note?.title ?? "";
    body.value = note?.body ?? "";
    // Status resets on note change; any warning is managed outside.
    saveStatus.value = "";
  });

  const debouncedTimer = useSignal<number | null>(null);

  const scheduleAutosave$ = $(() => {
    if (!note) return;

    // Basic debounce so we don't write to storage on every keystroke.
    if (debouncedTimer.value) {
      window.clearTimeout(debouncedTimer.value);
    }
    saveStatus.value = "Saving…";
    debouncedTimer.value = window.setTimeout(() => {
      onUpdate$(note.id, { title: title.value, body: body.value });
    }, 450) as unknown as number;
  });

  if (!note) {
    return (
      <section class="main" aria-label="Note editor">
        <div class="empty empty--main">
          <div class="empty__title">Select a note</div>
          <div class="empty__text">Choose a note on the left, or create a new one.</div>
        </div>
      </section>
    );
  }

  return (
    <section class="main" aria-label="Note editor">
      <div class="editor">
        <div class="editor__header">
          <div class="editor__title">Edit note</div>
          <div class="editor__status" role="status" aria-live="polite">
            {saveStatus.value}
          </div>
        </div>

        <div class="editor__fields">
          <div class="field">
            <label class="label" for="note-title">
              Title
            </label>
            <input
              id="note-title"
              class="input"
              type="text"
              value={title.value}
              onInput$={(e) => {
                title.value = (e.target as HTMLInputElement).value;
                scheduleAutosave$();
              }}
            />
          </div>

          <div class="field field--grow">
            <label class="label" for="note-body">
              Body
            </label>
            <textarea
              id="note-body"
              class="textarea"
              value={body.value}
              onInput$={(e) => {
                body.value = (e.target as HTMLTextAreaElement).value;
                scheduleAutosave$();
              }}
              placeholder="Write your note…"
            />
          </div>
        </div>

        <div class="editor__footer">
          <div class="muted">
            Autosave is on. Updated at{" "}
            <span class="mono">
              {new Date(note.updatedAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});
