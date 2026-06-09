import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnList } from '../ColumnList';
import { ColumnItem } from '../../types';

const fruitItems: ColumnItem[] = [
  { item: { id: '1', name: 'Apple', type: 'Fruit' }, addedAt: 1000 },
];

describe('ColumnList', () => {
  it('renders the column heading with type name', () => {
    render(<ColumnList type="Fruit" items={fruitItems} onItemClick={vi.fn()} />);
    expect(screen.getByText(/Fruit/)).toBeTruthy();
  });

  it('renders vegetable heading', () => {
    render(<ColumnList type="Vegetable" items={[]} onItemClick={vi.fn()} />);
    expect(screen.getByText(/Vegetable/)).toBeTruthy();
  });

  it('renders item names', () => {
    render(<ColumnList type="Fruit" items={fruitItems} onItemClick={vi.fn()} />);
    expect(screen.getByText('Apple')).toBeTruthy();
  });

  it('shows empty placeholder when no items', () => {
    render(<ColumnList type="Fruit" items={[]} onItemClick={vi.fn()} />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('calls onItemClick with the item when clicked', () => {
    const onItemClick = vi.fn();
    render(<ColumnList type="Fruit" items={fruitItems} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByText('Apple'));
    expect(onItemClick).toHaveBeenCalledWith(fruitItems[0].item);
  });
});
