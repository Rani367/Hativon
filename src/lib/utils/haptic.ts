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
