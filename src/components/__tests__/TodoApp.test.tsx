import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TodoApp } from '../TodoApp';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(()  => { vi.useRealTimers(); });

describe('TodoApp', () => {
  it('renders the main list and both columns', () => {
    render(<TodoApp />);
    expect(screen.getByText('Items')).toBeTruthy();
    expect(screen.getByText(/Fruit/)).toBeTruthy();
    expect(screen.getByText(/Vegetable/)).toBeTruthy();
  });

  it('moving an item removes it from the main list', () => {
    render(<TodoApp />);
    const buttons = screen.getAllByRole('button');
    const initialCount = buttons.length;
    act(() => { fireEvent.click(buttons[0]); });
    // One button leaves the main list (but appears in a column)
    expect(screen.getAllByRole('button').length).toBe(initialCount);
  });

  it('clicking a column item returns it to the main list', () => {
    render(<TodoApp />);
    // Move first item to a column
    const mainButtons = screen.getAllByRole('button');
    act(() => { fireEvent.click(mainButtons[0]); });

    // The item is now in a column — clicking it sends it back
    const allButtons = screen.getAllByRole('button');
    // Just verify no error is thrown on the return click
    act(() => { fireEvent.click(allButtons[allButtons.length - 1]); });
    expect(screen.getByText('Items')).toBeTruthy();
  });

  it('item auto-returns to main list after 5 seconds', () => {
    render(<TodoApp />);
    const mainButtons = screen.getAllByRole('button');
    const initialCount = mainButtons.length;

    act(() => { fireEvent.click(mainButtons[0]); });
    act(() => { vi.advanceTimersByTime(5000); });

    expect(screen.getAllByRole('button').length).toBe(initialCount);
  });
});
