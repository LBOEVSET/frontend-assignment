import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LotteryPage } from '../LotteryPage';

describe('LotteryPage', () => {
  it('renders all 6 section labels', () => {
    render(<LotteryPage />);
    expect(screen.getByText(/System Architecture/)).toBeTruthy();
    expect(screen.getByText(/Pattern Matching/)).toBeTruthy();
    expect(screen.getByText(/Redis Data Layout/)).toBeTruthy();
    expect(screen.getByText(/Concurrent Assignment/)).toBeTruthy();
    expect(screen.getByText(/Ticket Lifecycle/)).toBeTruthy();
    expect(screen.getByText(/Performance Summary/)).toBeTruthy();
  });

  it('renders Redis key names', () => {
    render(<LotteryPage />);
    // Use exact strings so we match the key-name div only, not its ancestors.
    expect(screen.getByText('bitmap:{pos}:{digit}')).toBeTruthy();
    expect(screen.getByText('queue:{pattern}')).toBeTruthy();
  });

  it('renders ticket state machine labels', () => {
    render(<LotteryPage />);
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('Reserved')).toBeTruthy();
    expect(screen.getByText('Assigned')).toBeTruthy();
  });

  it('renders performance table rows', () => {
    render(<LotteryPage />);
    // Use full cell text — "Bitmap AND" appears in a section heading too,
    // and "LPOP" appears in the concurrency section; exact match targets the table cells.
    expect(screen.getByText('Bitmap AND (pattern match)')).toBeTruthy();
    expect(screen.getByText('LPOP (ticket assign)')).toBeTruthy();
  });
});
