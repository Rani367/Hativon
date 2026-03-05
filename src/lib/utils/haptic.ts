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
 * Triggers a buzz haptic that lasts for the full duration of the
 * login form animations (last field finishes at ~500ms).
 */
export function triggerLoginHaptic(): void {
  getInstance().trigger(500);
}
