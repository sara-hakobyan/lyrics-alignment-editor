import { api } from "../api";
import type {
  SaveAlignmentRequest,
  SaveAlignmentResponse,
  Track,
} from "../types";

export function getTrack(): Promise<Track> {
  return api<Track>("/api/v1/track");
}

export function saveAlignment(
  body: SaveAlignmentRequest
): Promise<SaveAlignmentResponse> {
  return api<SaveAlignmentResponse>("/api/v1/track/alignment", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
