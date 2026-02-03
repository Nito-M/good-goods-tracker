import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

interface OfflineDbSchema extends DBSchema {
  inventory_items: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  purchase_orders: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  sales: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  sale_items: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-sale': string };
  };
  vendors: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  categories: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number };
  };
  metadata: {
    key: string;
    value: { key: string; value: unknown };
  };
}

type DataTableName = 'inventory_items' | 'purchase_orders' | 'sales' | 'sale_items' | 'vendors' | 'categories';

const DB_NAME = 'zumy-offline-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDbSchema> | null = null;

export async function getOfflineDb(): Promise<IDBPDatabase<OfflineDbSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Inventory items store
      if (!db.objectStoreNames.contains('inventory_items')) {
        const store = db.createObjectStore('inventory_items', { keyPath: 'id' });
        store.createIndex('by-user', 'user_id');
      }

      // Purchase orders store
      if (!db.objectStoreNames.contains('purchase_orders')) {
        const store = db.createObjectStore('purchase_orders', { keyPath: 'id' });
        store.createIndex('by-user', 'user_id');
      }

      // Sales store
      if (!db.objectStoreNames.contains('sales')) {
        const store = db.createObjectStore('sales', { keyPath: 'id' });
        store.createIndex('by-user', 'user_id');
      }

      // Sale items store
      if (!db.objectStoreNames.contains('sale_items')) {
        const store = db.createObjectStore('sale_items', { keyPath: 'id' });
        store.createIndex('by-sale', 'sale_id');
      }

      // Vendors store
      if (!db.objectStoreNames.contains('vendors')) {
        const store = db.createObjectStore('vendors', { keyPath: 'id' });
        store.createIndex('by-user', 'user_id');
      }

      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        const store = db.createObjectStore('categories', { keyPath: 'id' });
        store.createIndex('by-user', 'user_id');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      }

      // Metadata store for last sync times, etc.
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Generic CRUD operations for offline storage
export async function getAll(
  table: DataTableName,
  userId?: string
): Promise<Record<string, unknown>[]> {
  const db = await getOfflineDb();
  if (userId && table !== 'sale_items') {
    return db.getAllFromIndex(table, 'by-user', userId);
  }
  return db.getAll(table);
}

export async function getById(
  table: DataTableName,
  id: string
): Promise<Record<string, unknown> | undefined> {
  const db = await getOfflineDb();
  return db.get(table, id);
}

export async function put(
  table: DataTableName,
  data: Record<string, unknown>
): Promise<void> {
  const db = await getOfflineDb();
  await db.put(table, data);
}

export async function putMany(
  table: DataTableName,
  items: Record<string, unknown>[]
): Promise<void> {
  const db = await getOfflineDb();
  const tx = db.transaction(table, 'readwrite');
  await Promise.all([
    ...items.map((item) => tx.store.put(item)),
    tx.done,
  ]);
}

export async function deleteItem(
  table: DataTableName,
  id: string
): Promise<void> {
  const db = await getOfflineDb();
  await db.delete(table, id);
}

export async function clearTable(
  table: DataTableName
): Promise<void> {
  const db = await getOfflineDb();
  await db.clear(table);
}

// Sync queue operations
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
  const db = await getOfflineDb();
  const queueItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  await db.put('sync_queue', queueItem);
  window.dispatchEvent(new CustomEvent('sync-queue-changed'));
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getOfflineDb();
  return db.getAllFromIndex('sync_queue', 'by-timestamp');
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getOfflineDb();
  await db.delete('sync_queue', id);
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getOfflineDb();
  await db.clear('sync_queue');
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getOfflineDb();
  return db.count('sync_queue');
}

// Metadata operations
export async function setMetadata(key: string, value: unknown): Promise<void> {
  const db = await getOfflineDb();
  await db.put('metadata', { key, value });
}

export async function getMetadata(key: string): Promise<unknown | undefined> {
  const db = await getOfflineDb();
  const result = await db.get('metadata', key);
  return result?.value;
}

export type { SyncQueueItem, DataTableName };
