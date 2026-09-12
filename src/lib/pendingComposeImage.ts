let pendingImage: File | null = null;

export function setPendingComposeImage(file: File | null) {
  pendingImage = file;
}

export function takePendingComposeImage(): File | null {
  const file = pendingImage;
  pendingImage = null;
  return file;
}
