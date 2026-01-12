import { component$, type QRL } from "@builder.io/qwik";
import type { Note, NoteId } from "~/lib/notes";

export interface NoteListProps {
  notes: Note[];
  selectedId: NoteId | null;
  filterText: string;
  onSelect$: QRL<(id: NoteId) => void>;
  onDelete$: QRL<(id: NoteId) => void>;
}

function formatMeta(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export const NoteList = component$<NoteListProps>(
  ({ notes, selectedId, filterText, onSelect$, onDelete$ }) => {
    return (
      <aside class="sidebar" aria-label="Notes list">
        <div class="sidebar__header">
          <div class="sidebar__title">Notes</div>
          <div class="sidebar__count" aria-label={`${notes.length} notes`}>
            {notes.length}
          </div>
        </div>

        {notes.length === 0 ? (
          <div class="empty">
            <div class="empty__title">No notes</div>
            <div class="empty__text">
              {filterText ? "Try clearing the search." : "Create your first note using “New note”."}
            </div>
          </div>
        ) : (
          <ul class="note-list" role="list">
            {notes.map((n) => {
              const isSelected = n.id === selectedId;
              return (
                <li key={n.id} class="note-list__item">
                  <button
                    type="button"
                    class={{
                      "note-card": true,
                      "note-card--selected": isSelected,
                    }}
                    onClick$={() => onSelect$(n.id)}
                    aria-current={isSelected ? "true" : "false"}
                  >
                    <div class="note-card__title">{n.title || "Untitled note"}</div>
                    <div class="note-card__meta">Updated {formatMeta(n.updatedAt)}</div>
                  </button>

                  <button
                    type="button"
                    class="icon-btn"
                    aria-label={`Delete note “${n.title || "Untitled note"}”`}
                    title="Delete"
                    onClick$={async (e) => {
                      // Prevent selecting note when clicking delete.
                      e.stopPropagation();
                      const ok = confirm("Delete this note? This cannot be undone.");
                      if (ok) onDelete$(n.id);
                    }}
                  >
                    <span aria-hidden="true">🗑</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    );
  },
);
