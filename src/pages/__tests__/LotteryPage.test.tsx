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
    expect(screen.getByText(/bitmap:\{pos\}/)).toBeTruthy();
    expect(screen.getByText(/queue:\{pattern\}/)).toBeTruthy();
  });

  it('renders ticket state machine labels', () => {
    render(<LotteryPage />);
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('Reserved')).toBeTruthy();
    expect(screen.getByText('Assigned')).toBeTruthy();
  });

  it('renders performance table rows', () => {
    render(<LotteryPage />);
    expect(screen.getByText(/Bitmap AND/)).toBeTruthy();
    expect(screen.getByText(/LPOP/)).toBeTruthy();
  });
});
