let pendingVideo: { file: File; duration: number } | null = null;

export function setPendingReelVideo(file: File, duration: number): void;
export function setPendingReelVideo(file: string): void;
export function setPendingReelVideo(file: File | string, duration?: number) {
  if (typeof file === 'string') {
    pendingVideo = null;
    return;
  }
  pendingVideo = { file, duration: duration ?? 0 };
}

export function takePendingReelVideo(): { file: File; duration: number } | null {
  const value = pendingVideo;
  pendingVideo = null;
  return value;
}
