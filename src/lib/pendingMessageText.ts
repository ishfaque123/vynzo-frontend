let pendingText: string | null = null;

export function setPendingMessageText(text: string) {
  pendingText = text;
}

export function takePendingMessageText(): string | null {
  const t = pendingText;
  pendingText = null;
  return t;
}
