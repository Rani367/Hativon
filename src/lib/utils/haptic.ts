import { WebHaptics } from "web-haptics";

let instance: WebHaptics | null = null;

function getInstance(): WebHaptics {
  if (!instance) {
    instance = new WebHaptics();
  }
  return instance;
}

export function triggerHaptic(): void {
  getInstance().trigger(50);
}

/**
 * Triggers a staggered haptic pattern matching the login form
 * field animations (username at 50ms, password at 100ms, button at 150ms).
 */
export function triggerLoginHaptic(): void {
  const haptics = getInstance();
  setTimeout(() => haptics.trigger(20), 50);
  setTimeout(() => haptics.trigger(20), 100);
  setTimeout(() => haptics.trigger(25), 150);
}
