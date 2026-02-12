import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout/AppLayout';
import {
  getCoachStudents,
  readSelectedCoachContext,
  selectCoachStudentContext,
  storeSelectedCoachContext,
  type CoachContextSelectionResponse,
  type CoachStudent,
} from '../../lib/coach-context';
import { useAuth } from '../auth/auth-context';

function formatDate(value: string | null) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function CoachContextPage() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(Boolean(session?.access_token));
  const [isSelectingId, setIsSelectingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [students, setStudents] = useState<CoachStudent[]>([]);
  const [selectedContext, setSelectedContext] =
    useState<CoachContextSelectionResponse | null>(null);

  useEffect(() => {
    const stored = readSelectedCoachContext();
    if (!stored) {
      return;
    }

    setSelectedContext({
      context_id: stored.context_id,
      coach_user_id: stored.coach_user_id,
      selected_at: stored.selected_at,
      student: {
        student_user_id: stored.student_user_id,
        email: null,
        role: 'user',
        chess_com_usernames: [],
        last_game_import_at: null,
        granted_at: stored.selected_at,
      },
    });
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await getCoachStudents({
          accessToken: session.access_token,
        });

        if (cancelled) {
          return;
        }

        setStudents(result.students);
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStudents([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de charger le contexte coach.',
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  async function handleSelectStudent(studentUserId: string) {
    if (!session?.access_token) {
      return;
    }

    setIsSelectingId(studentUserId);
    setErrorMessage(null);

    try {
      const result = await selectCoachStudentContext({
        accessToken: session.access_token,
        studentUserId,
      });

      storeSelectedCoachContext(result);
      setSelectedContext(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Sélection du contexte impossible.',
      );
    } finally {
      setIsSelectingId(null);
    }
  }

  const selectedStudentLabel = useMemo(() => {
    if (!selectedContext) {
      return null;
    }

    const selectedStudent = students.find(
      (student) => student.student_user_id === selectedContext.student.student_user_id,
    );

    if (selectedStudent?.email) {
      return selectedStudent.email;
    }

    return selectedContext.student.student_user_id;
  }, [selectedContext, students]);

  return (
    <AppLayout>
      <main className="app-shell">
      <header className="hero">
        <h1>Contexte Coach</h1>
        <p>Sélectionne un élève autorisé avant d’ouvrir son espace de review.</p>
        <p className="hero-link-row">
          <Link to="/onboarding">Retour à l’onboarding</Link>
        </p>
      </header>

      {isLoading ? (
        <p className="auth-message" role="status" aria-live="polite">
          Chargement des élèves autorisés...
        </p>
      ) : null}

      {errorMessage ? (
        <p className="auth-message auth-message-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {selectedContext ? (
        <section className="panel coach-selected-context" data-testid="coach-selected-context">
          <h2>Contexte actif</h2>
          <p>
            Élève sélectionné: <strong>{selectedStudentLabel}</strong>
          </p>
          <p>
            Context ID: <strong>{selectedContext.context_id}</strong>
          </p>
          <p>Sélectionné le: {formatDate(selectedContext.selected_at)}</p>
          <p className="hero-link-row">
            <Link to="/coach/review">Ouvrir la review élève</Link>
          </p>
        </section>
      ) : null}

      {!isLoading && students.length === 0 ? (
        <section className="panel">
          <h2>Aucun élève autorisé</h2>
          <p>Ajoute d’abord des accès coach→élève avant d’ouvrir un contexte.</p>
        </section>
      ) : null}

      {!isLoading && students.length > 0 ? (
        <section className="panel">
          <h2>Élèves autorisés</h2>
          <ul className="coach-student-list">
            {students.map((student) => (
              <li key={student.student_user_id} className="coach-student-item">
                <div>
                  <p>
                    <strong>{student.email ?? student.student_user_id}</strong>
                  </p>
                  <p>
                    Usernames Chess.com:{' '}
                    {student.chess_com_usernames.length > 0
                      ? student.chess_com_usernames.join(', ')
                      : 'N/A'}
                  </p>
                  <p>Dernier import: {formatDate(student.last_game_import_at)}</p>
                </div>
                <button
                  className="auth-submit"
                  type="button"
                  onClick={() => {
                    void handleSelectStudent(student.student_user_id);
                  }}
                  disabled={Boolean(isSelectingId)}
                >
                  {isSelectingId === student.student_user_id
                    ? 'Ouverture...'
                    : 'Ouvrir ce contexte'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      </main>
    </AppLayout>
  );
}
