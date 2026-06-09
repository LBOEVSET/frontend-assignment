import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemButton } from '../ItemButton';
import { Item } from '../../types';

const item: Item = { id: '1', name: 'Apple', type: 'Fruit' };

describe('ItemButton', () => {
  it('renders item name', () => {
    render(<ItemButton item={item} onClick={vi.fn()} />);
    expect(screen.getByText('Apple')).toBeTruthy();
  });

  it('calls onClick with the item when clicked', () => {
    const onClick = vi.fn();
    render(<ItemButton item={item} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(item);
  });

  it('renders progress bar when addedAt is provided', () => {
    const { container } = render(<ItemButton item={item} onClick={vi.fn()} addedAt={1000} />);
    const progress = container.querySelector('[style]');
    expect(progress).toBeTruthy();
  });

  it('does not render progress bar when addedAt is absent', () => {
    const { container } = render(<ItemButton item={item} onClick={vi.fn()} />);
    const progress = container.querySelector('[style]');
    expect(progress).toBeNull();
  });
});
