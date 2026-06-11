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

const mockUser = { id: '1', name: 'Alice', email: 'alice@example.com', role: 'user', created_at: '2024-01-01T00:00:00Z' };

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

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

  it('shows role selector only in register mode', () => {
    render(<BackendPage />);
    expect(screen.queryByDisplayValue('user')).toBeNull();
    fireEvent.click(screen.getByText('Register'));
    // Radio buttons with value "user" and "admin" should be present
    expect(screen.getByDisplayValue('user')).toBeTruthy();
    expect(screen.getByDisplayValue('admin')).toBeTruthy();
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
    vi.mocked(api.login).mockResolvedValueOnce({ token: 'tok', role: 'user' });
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
  async function loginAs(role = 'user') {
    vi.mocked(api.login).mockResolvedValueOnce({ token: 'tok', role });
    vi.mocked(api.listUsers).mockResolvedValue([mockUser]);
    render(<BackendPage />);
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'),         { target: { value: 'pass' } });
    const loginBtns = screen.getAllByRole('button', { name: /Login/ });
    fireEvent.click(loginBtns[loginBtns.length - 1]);
    await waitFor(() => expect(screen.getByText('Alice')).toBeTruthy());
  }

  it('shows users list after login', async () => {
    await loginAs();
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('shows delete button per user', async () => {
    await loginAs();
    // Delete buttons have text "Delete" — Alice can delete her own row.
    expect(screen.getAllByRole('button', { name: 'Delete' }).length).toBeGreaterThan(0);
  });

  it('deletes a user', async () => {
    vi.mocked(api.deleteUser).mockResolvedValueOnce({ message: 'deleted' });
    vi.mocked(api.listUsers).mockResolvedValue([]);
    await loginAs();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(vi.mocked(api.deleteUser)).toHaveBeenCalled());
  });

  it('shows create form when + Add user is clicked', async () => {
    await loginAs();
    fireEvent.click(screen.getByText('+ Add user'));
    expect(screen.getByText('Create user')).toBeTruthy();
  });

  it('persists session to sessionStorage on login', async () => {
    await loginAs('user');
    expect(sessionStorage.getItem('backend_token')).toBe('tok');
    expect(sessionStorage.getItem('backend_email')).toBe('alice@example.com');
    expect(sessionStorage.getItem('backend_role')).toBe('user');
  });

  it('clears sessionStorage on logout', async () => {
    await loginAs();
    fireEvent.click(screen.getByText('Logout'));
    expect(sessionStorage.getItem('backend_token')).toBeNull();
    expect(sessionStorage.getItem('backend_email')).toBeNull();
    expect(sessionStorage.getItem('backend_role')).toBeNull();
  });

  it('restores session from sessionStorage on mount', async () => {
    sessionStorage.setItem('backend_token', 'saved-tok');
    sessionStorage.setItem('backend_email', 'saved@example.com');
    sessionStorage.setItem('backend_role', 'user');
    vi.mocked(api.listUsers).mockResolvedValue([mockUser]);
    render(<BackendPage />);
    // Should skip the login form and show the session bar directly.
    await waitFor(() => expect(screen.getByText(/saved@example.com/)).toBeTruthy());
  });

  it('user role: hides Edit/Delete for users that are not the logged-in user', async () => {
    const otherUser = { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user', created_at: '2024-01-01T00:00:00Z' };
    vi.mocked(api.listUsers).mockResolvedValue([mockUser, otherUser]);
    vi.mocked(api.login).mockResolvedValueOnce({ token: 'tok', role: 'user' });
    render(<BackendPage />);
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    const loginBtns = screen.getAllByRole('button', { name: /Login/ });
    fireEvent.click(loginBtns[loginBtns.length - 1]);
    await waitFor(() => expect(screen.getByText('Bob')).toBeTruthy());
    // Only one Delete button — Alice's own row, not Bob's
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1);
  });

  it('admin role: shows Edit/Delete for user-role rows', async () => {
    const adminUser = { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', created_at: '2024-01-01T00:00:00Z' };
    const regularUser = { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user', created_at: '2024-01-01T00:00:00Z' };
    vi.mocked(api.listUsers).mockResolvedValue([adminUser, regularUser]);
    vi.mocked(api.login).mockResolvedValueOnce({ token: 'tok', role: 'admin' });
    render(<BackendPage />);
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    const loginBtns = screen.getAllByRole('button', { name: /Login/ });
    fireEvent.click(loginBtns[loginBtns.length - 1]);
    await waitFor(() => expect(screen.getByText('Bob')).toBeTruthy());
    // Admin sees Delete for own row (self-edit) + Bob's row (user role) = 2
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);
  });

  it('admin role: shows Edit/Delete for own row, hides for other admin rows', async () => {
    // Alice is logged in as admin; Bob is also admin.
    const adminUser  = { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', created_at: '2024-01-01T00:00:00Z' };
    const otherAdmin = { id: '2', name: 'Bob',   email: 'bob@example.com',   role: 'admin', created_at: '2024-01-01T00:00:00Z' };
    vi.mocked(api.listUsers).mockResolvedValue([adminUser, otherAdmin]);
    vi.mocked(api.login).mockResolvedValueOnce({ token: 'tok', role: 'admin' });
    render(<BackendPage />);
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    const loginBtns = screen.getAllByRole('button', { name: /Login/ });
    fireEvent.click(loginBtns[loginBtns.length - 1]);
    await waitFor(() => expect(screen.getByText('Bob')).toBeTruthy());
    // Only Alice's own row gets a Delete button (self-edit); Bob's admin row does not.
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1);
  });
});
