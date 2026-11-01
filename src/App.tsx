import { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';
import { createEmptyProject, type Project } from './domain/schema';
import { loadProject, saveProject } from './data/database';

export default function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let active = true;
    loadProject().then((saved) => {
      if (!active) return;
      setProject(saved ?? createEmptyProject());
      setStorageReady(true);
    }).catch(() => {
      if (!active) return;
      setProject(createEmptyProject());
      setStorageError(true);
      setStorageReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!project || !storageReady || storageError) return;
    const timeout = window.setTimeout(() => {
      saveProject(project).catch(() => setStorageError(true));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [project, storageReady, storageError]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Rooted home">
          <span className="brand-mark"><Sprout size={19} strokeWidth={1.8} /></span>
          <span>rooted</span>
        </a>
        <div className="save-state" aria-live="polite">
          {!storageReady ? 'Opening your tree…' : storageError ? 'Local storage unavailable' : 'Saved on this device'}
          <span className={storageError ? 'save-dot save-dot-error' : 'save-dot'} />
        </div>
      </header>
      <section className="canvas" aria-label="Family tree">
        <div className="welcome">
          <div className="welcome-icon"><Sprout size={28} strokeWidth={1.35} /></div>
          <p className="eyebrow">YOUR FAMILY, YOUR STORY</p>
          <h1>A place to put down roots.</h1>
          <p className="welcome-copy">Your family tree will grow here, one person at a time.</p>
          <p className="welcome-note">A little space for the people who came before you, and those who come after.</p>
          {!storageReady && <span className="loading-label">Preparing your space</span>}
          {storageError && <span className="error-label">Your browser could not open local storage. Try enabling site data in your browser settings.</span>}
        </div>
      </section>
      <footer className="footer"><span>Rooted</span><span>Kept on this device</span></footer>
    </main>
  );
}