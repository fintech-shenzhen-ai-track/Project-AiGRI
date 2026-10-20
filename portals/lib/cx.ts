/** Join class names, skipping falsy values. The class names themselves come from styles/system.css. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
