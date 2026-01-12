import { component$, type QRL } from "@builder.io/qwik";

export interface TopBarProps {
  title: string;
  searchValue: string;
  onSearchInput$: QRL<(value: string) => void>;
  onNewNote$: QRL<() => void>;
}

export const TopBar = component$<TopBarProps>(
  ({ title, searchValue, onSearchInput$, onNewNote$ }) => {
    return (
      <header class="topbar" role="banner">
        <div class="topbar__left">
          <div class="app-mark" aria-hidden="true">
            <div class="app-mark__dot" />
          </div>
          <div class="topbar__title">{title}</div>
        </div>

        <div class="topbar__right">
          <label class="sr-only" for="note-search">
            Search notes by title
          </label>
          <div class="search">
            <input
              id="note-search"
              name="note-search"
              class="input input--search"
              type="search"
              value={searchValue}
              placeholder="Search by title…"
              onInput$={(e) => onSearchInput$((e.target as HTMLInputElement).value)}
            />
          </div>

          <button class="btn btn--primary" type="button" onClick$={() => onNewNote$()}>
            New note
          </button>
        </div>
      </header>
    );
  },
);
