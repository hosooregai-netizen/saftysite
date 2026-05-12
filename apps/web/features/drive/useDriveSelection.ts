'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  DriveContextMenuState,
  DriveCreateKind,
  DriveItemRecord,
  DriveSelectionMode,
} from '@/features/drive/types';

export function useDriveSelection(items: DriveItemRecord[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<DriveContextMenuState | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createKind, setCreateKind] = useState<DriveCreateKind>(null);
  const [createName, setCreateName] = useState('');
  const [createNoteBody, setCreateNoteBody] = useState('');
  const [createLinkUrl, setCreateLinkUrl] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [moveTargetId, setMoveTargetId] = useState('');

  const visibleSelectedIds = useMemo(
    () => selectedIds.filter((itemId) => items.some((item) => item.id === itemId)),
    [items, selectedIds],
  );

  const primarySelectedId = useMemo(
    () => visibleSelectedIds[visibleSelectedIds.length - 1] || '',
    [visibleSelectedIds],
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === primarySelectedId) ?? null,
    [items, primarySelectedId],
  );

  const selectedSet = useMemo(() => new Set(visibleSelectedIds), [visibleSelectedIds]);

  const contextMenuItem = useMemo(
    () => (contextMenu ? items.find((item) => item.id === contextMenu.itemId) ?? null : null),
    [contextMenu, items],
  );

  const clearSelection = () => {
    setSelectedIds([]);
    setLastSelectedId('');
    setNameDraft('');
    setMoveTargetId('');
    setShareDialogOpen(false);
    setContextMenu(null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (shareDialogOpen) {
          setShareDialogOpen(false);
          return;
        }
        if (createKind) {
          setCreateKind(null);
          return;
        }
        if (contextMenu) {
          setContextMenu(null);
          return;
        }
        if (appMenuOpen) {
          setAppMenuOpen(false);
          return;
        }
        if (navOpen) {
          setNavOpen(false);
          return;
        }
        if (detailOpen && visibleSelectedIds.length > 0) {
          setDetailOpen(false);
          return;
        }
        if (visibleSelectedIds.length > 0) {
          clearSelection();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [appMenuOpen, contextMenu, createKind, detailOpen, navOpen, shareDialogOpen, visibleSelectedIds.length]);

  const selectItem = (itemId: string, mode: DriveSelectionMode = 'replace') => {
    if (mode === 'replace') {
      setSelectedIds([itemId]);
      setLastSelectedId(itemId);
      return;
    }
    if (mode === 'toggle') {
      setSelectedIds((current) => {
        if (current.includes(itemId)) {
          const next = current.filter((value) => value !== itemId);
          setLastSelectedId(next[next.length - 1] || '');
          return next;
        }
        const next = [...current, itemId];
        setLastSelectedId(itemId);
        return next;
      });
      return;
    }
    const targetIndex = items.findIndex((item) => item.id === itemId);
    const anchorIndex = items.findIndex((item) => item.id === (lastSelectedId || primarySelectedId));
    if (targetIndex < 0 || anchorIndex < 0) {
      setSelectedIds([itemId]);
      setLastSelectedId(itemId);
      return;
    }
    const [start, end] = targetIndex > anchorIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
    const rangeIds = items.slice(start, end + 1).map((item) => item.id);
    setSelectedIds(rangeIds);
    setLastSelectedId(itemId);
  };

  const beginCreate = (kind: Exclude<DriveCreateKind, null>) => {
    setCreateMenuOpen(false);
    setCreateKind(kind);
    setCreateName('');
    setCreateNoteBody('');
    setCreateLinkUrl('');
  };

  const closeCreate = () => {
    setCreateKind(null);
    setCreateName('');
    setCreateNoteBody('');
    setCreateLinkUrl('');
  };

  return {
    appMenuOpen,
    beginCreate,
    clearSelection,
    closeCreate,
    contextMenu: contextMenuItem ? contextMenu : null,
    contextMenuItem,
    createKind,
    createLinkUrl,
    createMenuOpen,
    createName,
    createNoteBody,
    detailOpen,
    lastSelectedId,
    moveTargetId,
    nameDraft,
    navOpen,
    primarySelectedId,
    selectItem,
    selectedIds: visibleSelectedIds,
    selectedItem,
    selectedItemId: selectedItem ? primarySelectedId : '',
    selectedSet,
    selectionCount: visibleSelectedIds.length,
    setAppMenuOpen,
    setContextMenu,
    setCreateKind,
    setCreateLinkUrl,
    setCreateMenuOpen,
    setCreateName,
    setCreateNoteBody,
    setDetailOpen,
    setMoveTargetId,
    setNameDraft,
    setNavOpen,
    setSelectedIds,
    setShareDialogOpen,
    shareDialogOpen: selectedItem ? shareDialogOpen : false,
  };
}
