'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchBlockedUsers, unblockUser, hideBlockedEntries } from '@/lib/api/userApi';

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
}
interface BlockedEntry {
  blockedAt: string;
  user: BlockedUser;
}

function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center font-semibold text-slate-600"
      style={url ? { backgroundImage: `url(${url})` } : {}}
    >
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
function BlockIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
    </svg>
  );
}

const LONG_PRESS_MS = 500;

// Blocks the browser's native long-press callout/selection menu so our
// custom action menu is the only thing that opens.
const noCalloutStyle: React.CSSProperties = {
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none',
};

function BlockedRow({
  entry,
  selectMode,
  isSelected,
  menuOpen,
  busy,
  onOpenMenu,
  onCloseMenu,
  onEnterSelectMode,
  onToggleSelected,
  onDelete,
  onUnblock,
}: {
  entry: BlockedEntry;
  selectMode: boolean;
  isSelected: boolean;
  menuOpen: boolean;
  busy: boolean;
  onOpenMenu: (id: string) => void;
  onCloseMenu: () => void;
  onEnterSelectMode: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onDelete: (id: string) => void;
  onUnblock: (id: string) => void;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  function clear() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }
  function start() {
    fired.current = false;
    clear();
    longPressTimer.current = setTimeout(() => {
      fired.current = true;
      onOpenMenu(entry.user.id);
    }, LONG_PRESS_MS);
  }
  function cancel() {
    clear();
  }
  function handleClick() {
    if (fired.current) {
      fired.current = false;
      return;
    }
    if (selectMode) onToggleSelected(entry.user.id);
  }

  return (
    <div
      className="relative flex items-center gap-3 rounded-lg bg-white px-2 py-2.5"
      style={noCalloutStyle}
      onTouchStart={start}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleClick}
    >
      {selectMode && (
        <span
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
          }`}
        >
          {isSelected && <CheckIcon />}
        </span>
      )}

      <Avatar url={entry.user.profilePictureUrl} name={entry.user.displayName} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{entry.user.displayName || entry.user.username}</p>
        <p className="truncate text-xs text-slate-500">@{entry.user.username}</p>
      </div>

      {!selectMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onUnblock(entry.user.id); }}
          disabled={busy}
          className="rounded-full border px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
        >
          {busy ? '...' : 'Unblock'}
        </button>
      )}

      {menuOpen && (
        <div
          className="absolute right-2 top-full z-20 mt-1 w-36 rounded-lg border bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
          onMouseLeave={onCloseMenu}
        >
          <button
            onClick={() => { onEnterSelectMode(entry.user.id); onCloseMenu(); }}
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Select
          </button>
          <button
            onClick={() => { onDelete(entry.user.id); onCloseMenu(); }}
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function BlockedPage() {
  const [entries, setEntries] = useState<BlockedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBlockedUsers().then((result) => {
      if (result.success) setEntries(result.data.blocked);
      setLoading(false);
    });
  }, []);

  function enterSelectMode(id: string) {
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  }
  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }
  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function handleSelectAll() {
    if (selectedIds.size === entries.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(entries.map((e) => e.user.id)));
  }

  async function handleUnblock(id: string) {
    if (!confirm('Unblock this account? They will be able to see your profile and interact with you again.')) return;
    setBusyId(id);
    const result = await unblockUser(id);
    setBusyId(null);
    if (result.success) setEntries((prev) => prev.filter((e) => e.user.id !== id));
  }

  async function handleDeleteSingle(id: string) {
    setEntries((prev) => prev.filter((e) => e.user.id !== id));
    await hideBlockedEntries([id]);
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0 || deleting) return;
    setDeleting(true);
    const ids = Array.from(selectedIds);
    const result = await hideBlockedEntries(ids);
    setDeleting(false);
    if (result.success) {
      setEntries((prev) => prev.filter((e) => !selectedIds.has(e.user.id)));
      exitSelectMode();
    }
  }

  if (loading) return <p className="py-10 text-center text-slate-500">Loading...</p>;

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="text-slate-300"><BlockIcon /></div>
        <h1 className="mt-4 text-xl font-semibold">Blocked Accounts</h1>
        <p className="mt-2 text-slate-500">Accounts you block will appear here.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-2 py-2 pb-20">
      <div className="flex items-center justify-between px-2 py-2">
        {selectMode ? (
          <>
            <button onClick={exitSelectMode} aria-label="Cancel selection" className="p-1 text-slate-600">
              <CloseIcon />
            </button>
            <span className="text-sm font-medium text-slate-700">{selectedIds.size} selected</span>
            <button onClick={handleSelectAll} className="text-sm font-medium text-blue-600">
              {selectedIds.size === entries.length ? 'Unselect all' : 'Select all'}
            </button>
          </>
        ) : (
          <h1 className="text-lg font-semibold">Blocked Accounts</h1>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        {entries.map((entry) => (
          <BlockedRow
            key={entry.user.id}
            entry={entry}
            selectMode={selectMode}
            isSelected={selectedIds.has(entry.user.id)}
            menuOpen={menuOpenId === entry.user.id}
            busy={busyId === entry.user.id}
            onOpenMenu={setMenuOpenId}
            onCloseMenu={() => setMenuOpenId(null)}
            onEnterSelectMode={enterSelectMode}
            onToggleSelected={toggleSelected}
            onDelete={handleDeleteSingle}
            onUnblock={handleUnblock}
          />
        ))}
      </div>

      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white p-3">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0 || deleting}
            className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-full bg-red-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            <TrashIcon />
            {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
          </button>
        </div>
      )}
    </div>
  );
}
