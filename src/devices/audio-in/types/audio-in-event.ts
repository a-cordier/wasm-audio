/** Controller → UI mirror events (the panel subscribes, state stays owned). */
export enum AudioInEvent {
  STATUS = "audio-in:status",
}

/** Where the capture stands — drives which panel controls are live. */
export type AudioInStatus = "idle" | "pending" | "active" | "denied" | "error";
