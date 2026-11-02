/** Shape returned by POST /api/answer. */
export interface Passage {
  label: string;
  chunkId: string;
  title: string;
  heading: string;
  url: string;
  page: number | null;
  text: string;
}

export interface AnswerResponse {
  requestId: string;
  status: "answered" | "abstained" | "failed";
  abstainReason: "no_passages" | "model_said_insufficient" | "no_supported_claims" | null;
  failure: string | null;
  claims: { text: string; citations: string[] }[];
  passages: Passage[];
  droppedClaims: number;
  indexVersion: number;
  promptVersion: string;
  cached: boolean;
}

export type Turn =
  | { id: number; question: string; state: "loading" }
  | { id: number; question: string; state: "done"; answer: AnswerResponse }
  | { id: number; question: string; state: "error"; code: string; message: string };

export const ABSTAIN_TEXT: Record<NonNullable<AnswerResponse["abstainReason"]>, string> = {
  no_passages: "This workspace has no passages to search yet.",
  model_said_insufficient: "The passages found do not answer this. Atlas will not guess.",
  no_supported_claims: "Every draft claim lacked a valid citation, so none are shown.",
};
