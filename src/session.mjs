import { validateOrigin } from './network.mjs';

// Track origin-bound authorization state only. Credentials and tokens are
// owned by a supported transport, never by this module or Lampa.Storage.
export function createSessionState() {
  let current = null;
  let generation = 0;
  let authenticated = false;
  return Object.freeze({
    select(origin) {
      const next = validateOrigin(origin);
      if (next !== current) {
        current = next;
        generation++;
        authenticated = false;
      }
      return Object.freeze({ origin: current, generation });
    },
    confirm(ticket, verified) {
      if (!ticket || !current || ticket.origin !== current ||
          ticket.generation !== generation || verified !== true) return false;
      authenticated = true;
      return true;
    },
    logout() {
      generation++;
      authenticated = false;
    },
    snapshot() {
      return Object.freeze({ origin: current, generation, authenticated });
    }
  });
}
