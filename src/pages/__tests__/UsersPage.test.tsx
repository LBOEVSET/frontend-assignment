import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock the service before importing the component.
vi.mock('../../services/users.service', () => ({
  fetchUsersByDepartment: vi.fn(),
  refreshUsersByDepartment: vi.fn(),
}));

import { UsersPage } from '../UsersPage';
import { fetchUsersByDepartment, refreshUsersByDepartment } from '../../services/users.service';

const mockPayload = {
  data: {
    Engineering: {
      male: 2, female: 1,
      ageRange: '25-35',
      hair: { Black: 2, Blond: 1 },
      addressUser: { AliceSmith: '10001', BobJones: '10002' },
    },
  },
  meta: { responseTime: 42, isCached: true, cacheAge: 5000 },
};

beforeEach(() => {
  vi.mocked(fetchUsersByDepartment).mockResolvedValue(mockPayload);
  vi.mocked(refreshUsersByDepartment).mockResolvedValue(mockPayload);
});

describe('UsersPage', () => {
  it('shows loading indicator initially', () => {
    render(<UsersPage />);
    expect(screen.getByText(/Loading/)).toBeTruthy();
  });

  it('shows department cards after data loads', async () => {
    render(<UsersPage />);
    await waitFor(() => expect(screen.getByText('Engineering')).toBeTruthy());
  });

  it('shows hair colour tags', async () => {
    render(<UsersPage />);
    await waitFor(() => expect(screen.getByText(/Black: 2/)).toBeTruthy());
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(fetchUsersByDepartment).mockRejectedValueOnce(new Error('Network error'));
    render(<UsersPage />);
    await waitFor(() => expect(screen.getByText(/Network error/)).toBeTruthy());
  });

  it('toggles cache info panel open and closed', async () => {
    render(<UsersPage />);
    await waitFor(() => screen.getByText('Engineering'));
    fireEvent.click(screen.getByText(/Cache info/));
    expect(screen.getByText(/Response time/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Cache info/));
    expect(screen.queryByText(/Response time/)).toBeNull();
  });

  it('shows tooltip when ? button is clicked', async () => {
    render(<UsersPage />);
    await waitFor(() => screen.getByText('Engineering'));
    fireEvent.click(screen.getByLabelText('What does this do?'));
    expect(screen.getByText(/Clears both/)).toBeTruthy();
  });

  it('closes tooltip when ✕ is clicked', async () => {
    render(<UsersPage />);
    await waitFor(() => screen.getByText('Engineering'));
    fireEvent.click(screen.getByLabelText('What does this do?'));
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByText(/Clears both/)).toBeNull();
  });

  it('calls refreshUsersByDepartment when refresh button clicked', async () => {
    render(<UsersPage />);
    await waitFor(() => screen.getByText('Engineering'));
    fireEvent.click(screen.getByText(/Fetch fresh data/));
    expect(vi.mocked(refreshUsersByDepartment)).toHaveBeenCalled();
  });

  it('shows non-cached meta info', async () => {
    vi.mocked(fetchUsersByDepartment).mockResolvedValueOnce({
      ...mockPayload,
      meta: { responseTime: 10, isCached: false, cacheAge: 0 },
    });
    render(<UsersPage />);
    await waitFor(() => screen.getByText('Engineering'));
    fireEvent.click(screen.getByText(/Cache info/));
    expect(screen.getByText(/No \(fresh fetch\)/)).toBeTruthy();
  });
});
