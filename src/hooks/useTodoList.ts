import { useState, useCallback, useRef } from 'react';
import { Item, ColumnItem } from '../types';
import { ITEMS } from '../data/items';

const COLUMN_TIMEOUT_MS = 5000;

export function useTodoList() {
  const [mainList, setMainList]     = useState<Item[]>(ITEMS);
  const [columnItems, setColumnItems] = useState<Map<string, ColumnItem>>(new Map());

  /**
   * timersRef keeps setTimeout IDs outside of React state so we can clear
   * them without stale-closure issues inside the timeout callbacks.
   */
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /** Move an item from a column back to the bottom of the main list. */
  const returnToMain = useCallback((item: Item) => {
    const timerId = timersRef.current.get(item.id);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timersRef.current.delete(item.id);
    }
    setColumnItems(prev => {
      const next = new Map(prev);
      next.delete(item.id);
      return next;
    });
    setMainList(prev => [...prev, item]);
  }, []);

  /** Move an item from the main list into its type column and start the timer. */
  const moveToColumn = useCallback((item: Item) => {
    setMainList(prev => prev.filter(i => i.id !== item.id));

    setColumnItems(prev =>
      new Map(prev).set(item.id, { item, addedAt: Date.now() }),
    );

    const timerId = setTimeout(() => returnToMain(item), COLUMN_TIMEOUT_MS);
    timersRef.current.set(item.id, timerId);
  }, [returnToMain]);

  const fruitItems = Array.from(columnItems.values()).filter(
    ci => ci.item.type === 'Fruit',
  );
  const vegetableItems = Array.from(columnItems.values()).filter(
    ci => ci.item.type === 'Vegetable',
  );

  return { mainList, fruitItems, vegetableItems, moveToColumn, returnToMain };
}
