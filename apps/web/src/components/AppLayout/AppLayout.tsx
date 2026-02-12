import { NavLink } from 'react-router-dom';

type AppLayoutProps = {
  children: React.ReactNode;
  sidebarFooter?: React.ReactNode;
};

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return ['app-nav-link', isActive ? 'app-nav-link-active' : null]
    .filter(Boolean)
    .join(' ');
}

export function AppLayout({ children, sidebarFooter }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar-inner">
          <details className="app-nav-root" open>
            <summary className="app-nav-root-summary">Menu</summary>

            <nav className="app-nav" aria-label="Navigation principale">
              <NavLink to="/onboarding" className={navLinkClassName} end>
                Accueil
              </NavLink>
              <NavLink to="/onboarding#import" className={navLinkClassName}>
                Importer des parties
              </NavLink>

              <details className="app-nav-section" open>
                <summary className="app-nav-section-summary">Entraînement</summary>
                <div className="app-nav-section-links">
                  <NavLink to="/puzzle" className={navLinkClassName}>
                    Puzzles
                  </NavLink>
                  <NavLink to="/progress" className={navLinkClassName}>
                    Résumé
                  </NavLink>
                  <NavLink to="/progress/trends" className={navLinkClassName}>
                    Statistiques
                  </NavLink>
                </div>
              </details>

              <details className="app-nav-section">
                <summary className="app-nav-section-summary">Données</summary>
                <div className="app-nav-section-links">
                  <NavLink to="/data/inventory" className={navLinkClassName}>
                    Inventaire
                  </NavLink>
                </div>
              </details>

              <details className="app-nav-section">
                <summary className="app-nav-section-summary">Coach</summary>
                <div className="app-nav-section-links">
                  <NavLink to="/coach/context" className={navLinkClassName}>
                    Contexte
                  </NavLink>
                  <NavLink to="/coach/review" className={navLinkClassName}>
                    Review
                  </NavLink>
                </div>
              </details>
            </nav>

            {sidebarFooter ? <div className="app-sidebar-footer">{sidebarFooter}</div> : null}
          </details>
        </div>
      </aside>

      <div className="app-layout-main">{children}</div>
    </div>
  );
}

