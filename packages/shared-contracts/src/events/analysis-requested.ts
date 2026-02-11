export type AnalysisRequestedEvent = {
  event_id: string;
  occurred_at: string;
  version: number;
  trace_id: string;
  data: {
    game_id: string;
    user_id: string;
  };
};
