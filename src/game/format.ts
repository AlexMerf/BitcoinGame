export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export function formatAccuracy(accuracy: number): string {
  return `${Math.round(accuracy)}%`;
}
