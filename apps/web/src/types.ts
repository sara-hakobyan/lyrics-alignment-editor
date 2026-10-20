export type Line = {
  id: string;
  index: number;
  text: string;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  duration_seconds: number;
  audio_url: string;
  lines: Line[];
  version: number;
  alignment: Alignment | null;
};

// Any track the editor works with: from the backend (isLocal: false) or added by the user (isLocal: true).
export type EditorTrack = Track & { isLocal: boolean };

export type Segment = { line_id: string; start_ms: number; end_ms: number };

export type Alignment = { segments: Segment[] };

// Body of PUT /api/v1/track/alignment
export type SaveAlignmentRequest = {
  version: number;
  lines: Line[];
  segments: Segment[];
};

// 200 response of PUT /api/v1/track/alignment
export type SaveAlignmentResponse = {
  version: number;
  lines: Line[];
  alignment: Alignment;
};

export type Response<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};
