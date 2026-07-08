export function updatedTime(item) {
  const time = new Date(item?.updatedAt || item?.createdAt || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function pickLatestEntity(local, remote) {
  if (!local) return remote || null;
  if (!remote) return local;
  const localTime = updatedTime(local);
  const remoteTime = updatedTime(remote);
  if (remoteTime > localTime) return remote;
  if (localTime > remoteTime) return local;
  return (Number(remote.syncVersion) || 0) > (Number(local.syncVersion) || 0) ? remote : local;
}

export function mergeEntityList(localItems = [], remoteItems = []) {
  const byId = new Map();
  for (const item of localItems) {
    if (item?.id) byId.set(item.id, pickLatestEntity(byId.get(item.id), item));
  }
  for (const item of remoteItems) {
    if (item?.id) byId.set(item.id, pickLatestEntity(byId.get(item.id), item));
  }
  return [...byId.values()].sort((a, b) => updatedTime(b) - updatedTime(a));
}

export function mergeGoalMaps(localGoals = {}, remoteGoals = {}) {
  const keys = new Set([...Object.keys(localGoals), ...Object.keys(remoteGoals)]);
  return [...keys].reduce((next, key) => {
    const picked = pickLatestEntity(localGoals[key], remoteGoals[key]);
    if (picked) next[key] = picked;
    return next;
  }, {});
}

export function applyDeletedEntitiesToMap(items = {}, deletedItems = []) {
  const deletedById = new Map(
    deletedItems
      .map(normalizeDeletedEntity)
      .filter(Boolean)
      .map((tombstone) => [tombstone.id, tombstone])
  );

  return Object.entries(items).reduce((next, [id, item]) => {
    const tombstone = deletedById.get(id);
    if (!tombstone || updatedTime(item) > updatedTime(tombstone)) {
      next[id] = item;
    }
    return next;
  }, {});
}

export function normalizeDeletedEntity(tombstone = {}) {
  if (!tombstone?.id) return null;
  const now = new Date().toISOString();
  const deletedAt = tombstone.deletedAt || tombstone.updatedAt || now;
  return {
    id: tombstone.id,
    deletedAt,
    updatedAt: tombstone.updatedAt || deletedAt,
    syncVersion: Math.max(1, Math.round(Number(tombstone.syncVersion) || 1)),
  };
}

export function mergeDeletedEntities(localDeleted = [], remoteDeleted = []) {
  const byId = new Map();
  for (const tombstone of [...localDeleted, ...remoteDeleted]) {
    const normalized = normalizeDeletedEntity(tombstone);
    if (!normalized) continue;
    byId.set(normalized.id, pickLatestEntity(byId.get(normalized.id), normalized));
  }
  return [...byId.values()].sort((a, b) => updatedTime(b) - updatedTime(a));
}

export function applyDeletedEntities(items = [], deletedItems = []) {
  const deletedById = new Map(
    deletedItems
      .map(normalizeDeletedEntity)
      .filter(Boolean)
      .map((tombstone) => [tombstone.id, tombstone])
  );

  return items.filter((item) => {
    const tombstone = deletedById.get(item?.id);
    if (!tombstone) return true;
    return updatedTime(item) > updatedTime(tombstone);
  });
}

export function pruneObsoleteDeletedEntities(items = [], deletedItems = []) {
  const itemById = new Map(
    items
      .filter((item) => item?.id)
      .map((item) => [item.id, item])
  );

  return deletedItems
    .map(normalizeDeletedEntity)
    .filter(Boolean)
    .filter((tombstone) => {
      const item = itemById.get(tombstone.id);
      return !item || updatedTime(tombstone) >= updatedTime(item);
    });
}

export function pruneObsoleteDeletedEntitiesFromMap(items = {}, deletedItems = []) {
  return deletedItems
    .map(normalizeDeletedEntity)
    .filter(Boolean)
    .filter((tombstone) => {
      const item = items[tombstone.id];
      return !item || updatedTime(tombstone) >= updatedTime(item);
    });
}
