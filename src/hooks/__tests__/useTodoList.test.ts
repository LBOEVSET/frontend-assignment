import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodoList } from '../useTodoList';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => { vi.useFakeTimers(); });
afterEach(()  => { vi.useRealTimers(); });

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup() {
  return renderHook(() => useTodoList());
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useTodoList — initial state', () => {
  it('starts with the full ITEMS list in mainList', () => {
    const { result } = setup();
    expect(result.current.mainList.length).toBeGreaterThan(0);
  });

  it('starts with empty fruit and vegetable columns', () => {
    const { result } = setup();
    expect(result.current.fruitItems).toHaveLength(0);
    expect(result.current.vegetableItems).toHaveLength(0);
  });
});

describe('useTodoList — moveToColumn', () => {
  it('removes the item from mainList when moved to a column', () => {
    const { result } = setup();
    const item = result.current.mainList[0];

    act(() => { result.current.moveToColumn(item); });

    expect(result.current.mainList.find(i => i.id === item.id)).toBeUndefined();
  });

  it('places a Fruit item in fruitItems', () => {
    const { result } = setup();
    const fruit = result.current.mainList.find(i => i.type === 'Fruit')!;

    act(() => { result.current.moveToColumn(fruit); });

    expect(result.current.fruitItems.some(ci => ci.item.id === fruit.id)).toBe(true);
    expect(result.current.vegetableItems.some(ci => ci.item.id === fruit.id)).toBe(false);
  });

  it('places a Vegetable item in vegetableItems', () => {
    const { result } = setup();
    const veg = result.current.mainList.find(i => i.type === 'Vegetable')!;

    act(() => { result.current.moveToColumn(veg); });

    expect(result.current.vegetableItems.some(ci => ci.item.id === veg.id)).toBe(true);
    expect(result.current.fruitItems.some(ci => ci.item.id === veg.id)).toBe(false);
  });

  it('records addedAt timestamp on column items', () => {
    const { result } = setup();
    const before = Date.now();
    const item = result.current.mainList[0];

    act(() => { result.current.moveToColumn(item); });

    const colItem = [...result.current.fruitItems, ...result.current.vegetableItems]
      .find(ci => ci.item.id === item.id)!;
    expect(colItem.addedAt).toBeGreaterThanOrEqual(before);
  });
});

describe('useTodoList — returnToMain', () => {
  it('removes item from column and appends to bottom of mainList', () => {
    const { result } = setup();
    const item = result.current.mainList[0];
    const originalLength = result.current.mainList.length;

    act(() => { result.current.moveToColumn(item); });
    expect(result.current.mainList).toHaveLength(originalLength - 1);

    act(() => { result.current.returnToMain(item); });
    expect(result.current.mainList).toHaveLength(originalLength);
    expect(result.current.mainList[result.current.mainList.length - 1].id).toBe(item.id);
  });

  it('clears the item from its column after returnToMain', () => {
    const { result } = setup();
    const fruit = result.current.mainList.find(i => i.type === 'Fruit')!;

    act(() => { result.current.moveToColumn(fruit); });
    expect(result.current.fruitItems).toHaveLength(1);

    act(() => { result.current.returnToMain(fruit); });
    expect(result.current.fruitItems).toHaveLength(0);
  });
});

describe('useTodoList — auto-return after 5 seconds', () => {
  it('auto-returns item to mainList after 5000 ms', () => {
    const { result } = setup();
    const item = result.current.mainList[0];
    const originalLength = result.current.mainList.length;

    act(() => { result.current.moveToColumn(item); });
    expect(result.current.mainList).toHaveLength(originalLength - 1);

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.mainList).toHaveLength(originalLength);
  });

  it('does NOT auto-return before 5000 ms', () => {
    const { result } = setup();
    const item = result.current.mainList[0];
    const originalLength = result.current.mainList.length;

    act(() => { result.current.moveToColumn(item); });
    act(() => { vi.advanceTimersByTime(4999); });

    expect(result.current.mainList).toHaveLength(originalLength - 1);
  });

  it('cancels the timer when returnToMain is called manually', () => {
    const { result } = setup();
    const item = result.current.mainList[0];
    const originalLength = result.current.mainList.length;

    act(() => { result.current.moveToColumn(item); });
    act(() => { result.current.returnToMain(item); });

    // Item already returned — advancing past 5s should not duplicate it
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.mainList).toHaveLength(originalLength);
  });

  it('can move multiple items independently and each auto-returns', () => {
    const { result } = setup();
    const [a, b] = result.current.mainList;
    const originalLength = result.current.mainList.length;

    act(() => {
      result.current.moveToColumn(a);
      result.current.moveToColumn(b);
    });
    expect(result.current.mainList).toHaveLength(originalLength - 2);

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.mainList).toHaveLength(originalLength);
  });
});
