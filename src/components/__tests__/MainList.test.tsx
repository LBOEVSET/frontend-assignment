import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainList } from '../MainList';
import { Item } from '../../types';

const items: Item[] = [
  { id: '1', name: 'Apple',  type: 'Fruit' },
  { id: '2', name: 'Carrot', type: 'Vegetable' },
];

describe('MainList', () => {
  it('renders the section heading', () => {
    render(<MainList items={items} onItemClick={vi.fn()} />);
    expect(screen.getByText('Items')).toBeTruthy();
  });

  it('renders all item names', () => {
    render(<MainList items={items} onItemClick={vi.fn()} />);
    expect(screen.getByText('Apple')).toBeTruthy();
    expect(screen.getByText('Carrot')).toBeTruthy();
  });

  it('calls onItemClick with the clicked item', () => {
    const onItemClick = vi.fn();
    render(<MainList items={items} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByText('Apple'));
    expect(onItemClick).toHaveBeenCalledWith(items[0]);
  });

  it('renders an empty list without errors', () => {
    render(<MainList items={[]} onItemClick={vi.fn()} />);
    expect(screen.getByText('Items')).toBeTruthy();
  });
});
