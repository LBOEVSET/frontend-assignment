import { useState, useEffect } from 'react';
import { TodoApp } from './components/TodoApp';
import { UsersPage } from './pages/UsersPage';
import { fetchUsersByDepartment } from './services/users.service';
import './App.css';

type Tab = 'todo' | 'users';

function getTabFromHash(): Tab {
  return window.location.hash === '#users' ? 'users' : 'todo';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromHash);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // Warm the cache while the user is on the Todo tab.
  // StrictMode calls this twice — both calls return the same singleton Promise.
  useEffect(() => {
    fetchUsersByDepartment();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">7Solutions Frontend Assignment</h1>
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'todo' ? 'tab--active' : ''}`}
            onClick={() => switchTab('todo')}
          >
            1 · Auto-Delete Todo
          </button>
          <button
            className={`tab ${activeTab === 'users' ? 'tab--active' : ''}`}
            onClick={() => switchTab('users')}
          >
            2 · Users by Department
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'todo'  && <TodoApp />}
        {activeTab === 'users' && <UsersPage />}
      </main>
    </div>
  );
}
