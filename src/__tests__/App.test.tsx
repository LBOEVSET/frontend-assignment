import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../services/users.service', () => ({
  fetchUsersByDepartment: vi.fn().mockResolvedValue({
    data: {},
    meta: { responseTime: 0, isCached: false, cacheAge: 0 },
  }),
}));

vi.mock('../services/backend.service', () => ({
  pingHealth: vi.fn().mockResolvedValue({ status: 'ok' }),
}));

// Stub heavy pages to isolate App routing logic.
vi.mock('../pages/BackendPage', () => ({ BackendPage: () => <div>BackendPageStub</div> }));
vi.mock('../pages/LotteryPage', () => ({ LotteryPage: () => <div>LotteryPageStub</div> }));
vi.mock('../pages/UsersPage',   () => ({ UsersPage:   () => <div>UsersPageStub</div>   }));

import App from '../App';

describe('App', () => {
  it('renders frontend assignment title by default', () => {
    render(<App />);
    expect(screen.getByText('7Solutions Frontend Assignment')).toBeTruthy();
  });

  it('shows todo app by default', () => {
    render(<App />);
    expect(screen.getByText('Items')).toBeTruthy();
  });

  it('switches to Users by Department tab', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Users by Department/));
    expect(screen.getByText('UsersPageStub')).toBeTruthy();
  });

  it('switches back to Todo tab', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Users by Department/));
    fireEvent.click(screen.getByText(/Auto-Delete Todo/));
    expect(screen.getByText('Items')).toBeTruthy();
  });

  it('switches to Backend Assignment', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Backend Assignment'));
    expect(screen.getByText('7Solutions Backend Assignment')).toBeTruthy();
    expect(screen.getByText('BackendPageStub')).toBeTruthy();
  });

  it('hides frontend sub-tabs when on backend', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Backend Assignment'));
    expect(screen.queryByText(/Auto-Delete Todo/)).toBeNull();
  });

  it('switches to Lottery Search System', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Lottery Search System'));
    expect(screen.getByText('Lottery Search System — Design Proposal')).toBeTruthy();
    expect(screen.getByText('LotteryPageStub')).toBeTruthy();
  });

  it('switches back to frontend from backend', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Backend Assignment'));
    fireEvent.click(screen.getByText('Frontend Assignment'));
    expect(screen.getByText('7Solutions Frontend Assignment')).toBeTruthy();
  });
});
