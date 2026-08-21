import { SAVE_STORAGE_KEY } from '../managers/SaveManager.ts';
import { isLegacySavePayload, isSignedEnvelope, extractPayloadFromEnvelope } from '../utils/saveIntegrity.ts';

const USED_IDS_KEY = 'vodichdaotam_used_display_ids';

function loadUsedIds(): Set<number> {
  const used = new Set<number>();
  try {
    const raw = localStorage.getItem(USED_IDS_KEY);
    if (raw) {
      (JSON.parse(raw) as number[]).forEach((id) => used.add(id));
    }
  } catch {
    /* ignore */
  }

  try {
    const saveRaw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (saveRaw) {
      const parsed: unknown = JSON.parse(saveRaw);
      const save = isSignedEnvelope(parsed)
        ? extractPayloadFromEnvelope(parsed)
        : isLegacySavePayload(parsed)
          ? parsed
          : null;
      if (save?.playerDisplayId) used.add(save.playerDisplayId);
    }
  } catch {
    /* ignore */
  }

  return used;
}

function persistUsedIds(used: Set<number>): void {
  localStorage.setItem(USED_IDS_KEY, JSON.stringify([...used]));
}

/** ID hiển thị 5 chữ số (10000–99999), không trùng trên thiết bị. */
export function generatePlayerDisplayId(): number {
  const used = loadUsedIds();
  let id = 10000 + Math.floor(Math.random() * 90000);
  let attempts = 0;
  while (used.has(id) && attempts < 2000) {
    id = 10000 + Math.floor(Math.random() * 90000);
    attempts += 1;
  }
  used.add(id);
  persistUsedIds(used);
  return id;
}

export function registerPlayerDisplayId(id: number): void {
  const used = loadUsedIds();
  used.add(id);
  persistUsedIds(used);
}
