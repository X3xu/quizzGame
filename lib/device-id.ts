// Persistent anonymous device identity stored in localStorage.
// Gives each browser a stable ID so users can see their own history.
// No login required — UUID is generated on first visit.

const KEY = 'brainwave_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
