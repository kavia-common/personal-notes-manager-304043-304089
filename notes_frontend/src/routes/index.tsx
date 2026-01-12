import { component$, useSignal, useTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { NoteList } from "~/components/NoteList";
import { NoteEditor } from "~/components/NoteEditor";
import { TopBar } from "~/components/TopBar";
import type { Note, NoteId, NotesStateV1 } from "~/lib/notes";
import { createEmptyNote, sortNotes } from "~/lib/notes";
import { loadNotesState, saveNotesState } from "~/lib/storage";

function filterNotesByTitle(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter((n) => (n.title || "").toLowerCase().includes(q));
}

// PUBLIC_INTERFACE
export default component$(() => {
  const appTitle = "Personal Notes Manager";

  const notes = useSignal<Note[]>([]);
  const selectedId = useSignal<NoteId | null>(null);
  const search = useSignal("");
  const warning = useSignal<string>("");
  const saveStatus = useSignal<string>("");

  // Load from storage on client.
  useTask$(() => {
    const { state, warning: w } = loadNotesState();
    notes.value = state.notes;
    selectedId.value = state.selectedId ?? state.notes[0]?.id ?? null;
    warning.value = w || "";
  });

  const persist$ = $(() => {
    const state: NotesStateV1 = {
      version: 1,
      notes: notes.value,
      selectedId: selectedId.value,
    };
    const res = saveNotesState(state);
    if (!res.ok) {
      warning.value = res.warning;
      return;
    }

    // If a save now succeeds, clear common save-related warnings.
    if (
      warning.value.includes("Failed to save") ||
      warning.value.includes("localStorage unavailable")
    ) {
      warning.value = "";
    }
  });

  const selectNote$ = $((id: NoteId) => {
    selectedId.value = id;
    // selection change is persisted (so reload keeps selection)
    persist$();
  });

  const createNote$ = $(async () => {
    const newNote = createEmptyNote();
    notes.value = sortNotes([{ ...newNote }, ...notes.value]);
    selectedId.value = newNote.id;
    saveStatus.value = "Saved";
    await persist$();

    // Focus management: defer to next tick so DOM exists.
    setTimeout(() => {
      const el = document.getElementById("note-title") as HTMLInputElement | null;
      el?.focus();
      el?.select();
    }, 0);
  });

  const deleteNote$ = $((id: NoteId) => {
    const remaining = notes.value.filter((n) => n.id !== id);
    notes.value = remaining;

    if (selectedId.value === id) {
      selectedId.value = remaining[0]?.id ?? null;
    }

    saveStatus.value = "Saved";
    persist$();
  });

  const updateNote$ = $((id: NoteId, patch: { title?: string; body?: string }) => {
    const now = Date.now();
    let updated = false;

    notes.value = sortNotes(
      notes.value.map((n) => {
        if (n.id !== id) return n;
        updated = true;
        return {
          ...n,
          title: patch.title ?? n.title,
          body: patch.body ?? n.body,
          updatedAt: now,
        };
      }),
    );

    if (updated) {
      const res = saveNotesState({ version: 1, notes: notes.value, selectedId: selectedId.value });
      saveStatus.value = res.ok ? "Saved" : "Save failed";
      if (!res.ok) warning.value = res.warning;
    }
  });

  const onSearchInput$ = $((value: string) => {
    search.value = value;
  });

  const filtered = filterNotesByTitle(notes.value, search.value);
  const selected = notes.value.find((n) => n.id === selectedId.value) ?? null;

  return (
    <div class="app">
      <TopBar
        title={appTitle}
        searchValue={search.value}
        onSearchInput$={onSearchInput$}
        onNewNote$={createNote$}
      />

      {warning.value ? (
        <div class="banner" role="status" aria-live="polite">
          <div class="banner__text">{warning.value}</div>
        </div>
      ) : null}

      <div class="content">
        <NoteList
          notes={filtered}
          selectedId={selectedId.value}
          filterText={search.value}
          onSelect$={selectNote$}
          onDelete$={deleteNote$}
        />
        <NoteEditor note={selected} onUpdate$={updateNote$} saveStatus={saveStatus} />
      </div>

      <footer class="footer">
        <span class="muted">
          Local-only demo. Frontend URL:{" "}
          <span class="mono">{import.meta.env.VITE_FRONTEND_URL ?? "N/A"}</span>
        </span>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Personal Notes Manager",
  meta: [
    {
      name: "description",
      content: "A fast, local-first personal notes manager built with Qwik.",
    },
  ],
};
