import { env } from '../config/env';

export type CoachStudent = {
  student_user_id: string;
  email: string | null;
  role: 'user' | 'coach';
  chess_com_usernames: string[];
  last_game_import_at: string | null;
  granted_at: string;
};

export type CoachStudentsResponse = {
  coach_user_id: string;
  students: CoachStudent[];
};

export type CoachContextSelectionResponse = {
  context_id: string;
  coach_user_id: string;
  student: CoachStudent;
  selected_at: string;
};

const COACH_CONTEXT_STORAGE_KEY = 'coach_selected_student_context';

export async function getCoachStudents(params: {
  accessToken: string;
}): Promise<CoachStudentsResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(`${env.apiBaseUrl}/coach/students`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Coach students fetch failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: CoachStudentsResponse };
  return payload.data;
}

export async function selectCoachStudentContext(params: {
  accessToken: string;
  studentUserId: string;
}): Promise<CoachContextSelectionResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(`${env.apiBaseUrl}/coach/context/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      student_user_id: params.studentUserId,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Coach context selection failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: CoachContextSelectionResponse };
  return payload.data;
}

export function storeSelectedCoachContext(context: CoachContextSelectionResponse) {
  localStorage.setItem(
    COACH_CONTEXT_STORAGE_KEY,
    JSON.stringify({
      context_id: context.context_id,
      coach_user_id: context.coach_user_id,
      student_user_id: context.student.student_user_id,
      selected_at: context.selected_at,
    }),
  );
}

export function readSelectedCoachContext(): {
  context_id: string;
  coach_user_id: string;
  student_user_id: string;
  selected_at: string;
} | null {
  const raw = localStorage.getItem(COACH_CONTEXT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      context_id: string;
      coach_user_id: string;
      student_user_id: string;
      selected_at: string;
    };
    return parsed;
  } catch {
    return null;
  }
}
