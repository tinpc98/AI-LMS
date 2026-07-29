export type ConferenceStatus =
  | "idle"
  | "preparing"
  | "ready"
  | "joining"
  | "joined"
  | "reconnecting"
  | "closing"
  | "closed"
  | "error";

export type MediaErrorCode =
  | "MEDIA_PERMISSION_DENIED"
  | "MEDIA_DEVICE_NOT_FOUND"
  | "MEDIA_DEVICE_BUSY"
  | "MEDIA_INSECURE_CONTEXT"
  | "MEDIA_BROWSER_UNSUPPORTED"
  | "MEDIA_UNKNOWN_ERROR";

export interface JaasConferenceData {
  sessionId: string;
  roomName: string;
  appId: string;
  domain: string;
  token: string;
  moderator: boolean;
  expiresAt?: string;
}

export interface LiveConferenceError {
  code: string;
  title: string;
  message: string;
  retryable: boolean;
  severity: "info" | "warning" | "error";
  originalStatus?: number;
}

export interface LiveSessionError extends LiveConferenceError {}

export interface MediaPermissionState {
  hasCameraPermission: boolean | null;
  hasMicrophonePermission: boolean | null;
  isSupported: boolean;
  isSecure: boolean;
  error?: MediaErrorCode | null;
}

export interface JitsiApiLike {
  addEventListener: (event: string, handler: (...args: any[]) => void) => void;
  removeEventListener: (event: string, handler: (...args: any[]) => void) => void;
  dispose?: () => void;
  executeCommand?: (command: string, ...args: any[]) => void;
  getIFrame?: () => HTMLIFrameElement | null;
}
