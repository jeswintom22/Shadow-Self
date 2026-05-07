export const ONBOARDING_STORAGE_KEY = "shadow-self-onboarded";

export function hasCompletedOnboarding(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function completeOnboarding(): void {
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
  } catch {
    return;
  }
}

export function resetOnboarding(): void {
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    return;
  }
}
