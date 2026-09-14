let pendingVideo: { file: File; duration: number } | null = null;

export function setPendingReelVideo(file: File, duration: number) {
  pendingVideo = { file, duration };
}

export function takePendingReelVideo(): { file: File; duration: number } | null {
  const value = pendingVideo;
  pendingVideo = null;
  return value;
}
