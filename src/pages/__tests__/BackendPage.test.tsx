import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// window.confirm is used in handleDelete — return true so deletes proceed.
vi.stubGlobal('confirm', () => true);

vi.mock('../../services/backend.service', () => ({
  register:   vi.fn(),
  login:      vi.fn(),
  listUsers:  vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

import { BackendPage } from '../BackendPage';
import * as api from '../../services/backend.service';

const mockUser = { id: '1', name: 'Alice', email: 'alice@example.com', created_at: '2024-01-01T00:00:00Z' };

beforeEach(() => { vi.clearAllMocks(); });

describe('BackendPage — unauthenticated', () => {
  it('renders login and register tabs', () => {
    render(<BackendPage />);
    // Both "Login" tab and "Login" submit button are rendered — use getAllByText.
    expect(screen.getAllByText('Login').length).toBeGreaterThan(0);
    expect(screen.getByText('Register')).toBeTruthy();
  });

  it('shows name field only in register mode', () => {
    render(<BackendPage />);
    expect(screen.queryByPlaceholderText('Jane Doe')).toBeNull();
    fireEvent.click(screen.getByText('Register'));
    expect(screen.getByPlaceholderText('Jane Doe')).toBeTruthy();
  });

  it('shows error on failed login', async () => {
    vi.mocked(api.login).mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<BackendPage />);
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
    // The Login tab and the Login submit button both match /Login/ — take the last one (submit).
    const loginBtns = screen.getAllByRole('button', { name: /Login/ });
    fireEvent.click(loginBtns[loginBtns.length - 1]);
    await waitFor(() => expect(screen.getByText(/Invalid credentials/)).toBeTruthy());
  });

  it('registers then auto-logs-in', async () => {
    vi.mocked(api.register).mockResolvedValueOnce(mockUser);
    vi.mocked(api.login).mockResolvedValueOnce({ token: 'tok' });
    vi.mocked(api.listUsers).mockResolvedValueOnce([mockUser]);

    render(<BackendPage />);
    fireEvent.click(screen.getByText('Register'));
    fireEvent.change(screen.getByPlaceholderText('Jane Doe'),          { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'),  { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'),          { target: { value: 'pass123' } });
    // After switching to Register mode both the tab and submit say "Register" — take last (submit).
    const registerBtns = screen.getAllByRole('button', { name: /Register/ });
    fireEvent.click(registerBtns[registerBtns.length - 1]);
    await waitFor(() => expect(vi.mocked(api.login)).toHaveBeenCalled());
  });
});

describe('BackendPage — authenticated', () => {
  async function login() {
    vi.mocked(api.login).mockResolvedValueOnce({ token: 'tok' });
    vi.mocked(api.listUsers).mockResolvedValue([mockUser]);
    render(<BackendPage />);
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'),         { target: { value: 'pass' } });
    const loginBtns = screen.getAllByRole('button', { name: /Login/ });
    fireEvent.click(loginBtns[loginBtns.length - 1]);
    await waitFor(() => expect(screen.getByText('Alice')).toBeTruthy());
  }

  it('shows users list after login', async () => {
    await login();
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('shows delete button per user', async () => {
    await login();
    // Delete buttons have text "Delete", no title attribute.
    expect(screen.getAllByRole('button', { name: 'Delete' }).length).toBeGreaterThan(0);
  });

  it('deletes a user', async () => {
    vi.mocked(api.deleteUser).mockResolvedValueOnce({ message: 'deleted' });
    vi.mocked(api.listUsers).mockResolvedValue([]);
    await login();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(vi.mocked(api.deleteUser)).toHaveBeenCalled());
  });

  it('shows create form when + Add user is clicked', async () => {
    await login();
    fireEvent.click(screen.getByText('+ Add user'));
    expect(screen.getByText('Create user')).toBeTruthy();
  });
});
