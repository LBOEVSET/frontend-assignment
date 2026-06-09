import { useState, useEffect } from 'react';
import { TodoApp } from './components/TodoApp';
import { UsersPage } from './pages/UsersPage';
import { BackendPage } from './pages/BackendPage';
import { fetchUsersByDepartment } from './services/users.service';
import './App.css';

type Assignment = 'frontend' | 'backend';
type FrontendTab = 'todo' | 'users';

function getInitialAssignment(): Assignment {
  return window.location.hash === '#backend' ? 'backend' : 'frontend';
}
function getInitialFrontendTab(): FrontendTab {
  return window.location.hash === '#users' ? 'users' : 'todo';
}

export default function App() {
  const [assignment,   setAssignment]   = useState<Assignment>(getInitialAssignment);
  const [frontendTab,  setFrontendTab]  = useState<FrontendTab>(getInitialFrontendTab);

  const switchAssignment = (a: Assignment) => {
    setAssignment(a);
    window.location.hash = a === 'backend' ? 'backend' : frontendTab;
  };

  const switchFrontendTab = (tab: FrontendTab) => {
    setFrontendTab(tab);
    window.location.hash = tab;
  };

  useEffect(() => {
    fetchUsersByDepartment();
  }, []);

  const title = assignment === 'frontend'
    ? '7Solutions Frontend Assignment'
    : '7Solutions Backend Assignment';

  return (
    <div className="app">
      <header className="app-header">

        {/* ── Top assignment switcher ── */}
        <div className="assignment-switcher">
          <button
            className={`assignment-btn ${assignment === 'frontend' ? 'assignment-btn--active' : ''}`}
            onClick={() => switchAssignment('frontend')}
          >
            Frontend Assignment
          </button>
          <button
            className={`assignment-btn ${assignment === 'backend' ? 'assignment-btn--active' : ''}`}
            onClick={() => switchAssignment('backend')}
          >
            Backend Assignment
          </button>
        </div>

        {/* ── Title ── */}
        <h1 className="app-title">{title}</h1>

        {/* ── Sub-tabs (frontend only) ── */}
        {assignment === 'frontend' && (
          <nav className="tabs">
            <button
              className={`tab ${frontendTab === 'todo' ? 'tab--active' : ''}`}
              onClick={() => switchFrontendTab('todo')}
            >
              1 · Auto-Delete Todo
            </button>
            <button
              className={`tab ${frontendTab === 'users' ? 'tab--active' : ''}`}
              onClick={() => switchFrontendTab('users')}
            >
              2 · Users by Department
            </button>
          </nav>
        )}
      </header>

      <main className="app-main">
        {assignment === 'frontend' && frontendTab === 'todo'  && <TodoApp />}
        {assignment === 'frontend' && frontendTab === 'users' && <UsersPage />}
        {assignment === 'backend'                             && <BackendPage />}
      </main>
    </div>
  );
}
