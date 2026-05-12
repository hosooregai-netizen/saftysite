'use client';

import { useMemo, useState } from 'react';
import type { DriveItemViewModel } from '@/lib/webhard/driveTypes';

export function useDriveSelection(items: DriveItemViewModel[]) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [moveParentId, setMoveParentId] = useState('');

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const syncInputs = (item: DriveItemViewModel | null) => {
    if (!item) {
      setNameInput('');
      setMoveParentId('');
      return;
    }
    setNameInput(item.name);
    setMoveParentId(item.parentId || '');
  };

  const selectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = items.find((candidate) => candidate.id === itemId) ?? null;
    syncInputs(item);
  };

  const selectItemSnapshot = (item: DriveItemViewModel) => {
    setSelectedItemId(item.id);
    syncInputs(item);
  };

  const clearSelection = () => {
    setSelectedItemId('');
    syncInputs(null);
  };

  const syncFromSelectedItem = () => {
    syncInputs(selectedItem);
  };

  return {
    clearSelection,
    moveParentId,
    nameInput,
    selectedItem,
    selectedItemId,
    selectItem,
    selectItemSnapshot,
    setMoveParentId,
    setNameInput,
    syncFromSelectedItem,
  };
}
