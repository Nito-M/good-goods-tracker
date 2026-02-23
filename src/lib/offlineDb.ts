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
  warehouses: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  quotes: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  quote_items: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-quote': string };
  };
  jobs: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  job_items: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-job': string };
  };
  requests: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  customers: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  notes: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  calendar_events: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  assemblies: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  assembly_items: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-assembly': string };
  };
  bank_cards: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  bank_transactions: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  tags: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  tag_categories: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  item_tags: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-item': string };
  };
  item_images: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-item': string };
  };
  item_vendor_prices: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-item': string };
  };
  companies: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  po_attachments: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-po': string };
  };
  po_job_links: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-po': string };
  };
  po_item_allocations: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-po': string };
  };
  profiles: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-user': string };
  };
  so_item_job_links: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-quote': string };
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

type DataTableName =
  | 'inventory_items' | 'purchase_orders' | 'sales' | 'sale_items' | 'vendors' | 'categories'
  | 'warehouses' | 'quotes' | 'quote_items' | 'jobs' | 'job_items' | 'requests'
  | 'customers' | 'notes' | 'calendar_events' | 'assemblies' | 'assembly_items'
  | 'bank_cards' | 'bank_transactions' | 'tags' | 'tag_categories'
  | 'item_tags' | 'item_images' | 'item_vendor_prices' | 'companies'
  | 'po_attachments' | 'po_job_links' | 'po_item_allocations' | 'profiles' | 'so_item_job_links';

const DB_NAME = 'zumy-offline-db';
const DB_VERSION = 2;

// Helper to create a store with an index if it doesn't exist
function ensureStore(
  db: IDBPDatabase<OfflineDbSchema>,
  name: string,
  indexName: string,
  indexKey: string
) {
  if (!db.objectStoreNames.contains(name as never)) {
    const store = db.createObjectStore(name as never, { keyPath: 'id' });
    (store as unknown as { createIndex: (n: string, k: string) => void }).createIndex(indexName, indexKey);
  }
}

let dbInstance: IDBPDatabase<OfflineDbSchema> | null = null;

export async function getOfflineDb(): Promise<IDBPDatabase<OfflineDbSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // User-scoped stores
      const userStores = [
        'inventory_items', 'purchase_orders', 'sales', 'vendors', 'categories',
        'warehouses', 'quotes', 'jobs', 'requests', 'customers', 'notes',
        'calendar_events', 'assemblies', 'bank_cards', 'bank_transactions',
        'tags', 'tag_categories', 'companies', 'profiles',
      ];
      for (const name of userStores) {
        ensureStore(db, name, 'by-user', 'user_id');
      }

      // Child/relation stores with specific indexes
      const childStores: [string, string, string][] = [
        ['sale_items', 'by-sale', 'sale_id'],
        ['quote_items', 'by-quote', 'quote_id'],
        ['job_items', 'by-job', 'job_id'],
        ['assembly_items', 'by-assembly', 'assembly_id'],
        ['item_tags', 'by-item', 'item_id'],
        ['item_images', 'by-item', 'item_id'],
        ['item_vendor_prices', 'by-item', 'item_id'],
        ['po_attachments', 'by-po', 'purchase_order_id'],
        ['po_job_links', 'by-po', 'purchase_order_id'],
        ['po_item_allocations', 'by-po', 'purchase_order_id'],
        ['so_item_job_links', 'by-quote', 'quote_id'],
      ];
      for (const [name, idx, key] of childStores) {
        ensureStore(db, name, idx, key);
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

// Tables that have a 'by-user' index
const USER_INDEXED_TABLES = new Set<DataTableName>([
  'inventory_items', 'purchase_orders', 'sales', 'vendors', 'categories',
  'warehouses', 'quotes', 'jobs', 'requests', 'customers', 'notes',
  'calendar_events', 'assemblies', 'bank_cards', 'bank_transactions',
  'tags', 'tag_categories', 'companies', 'profiles',
]);

// Generic CRUD operations for offline storage
export async function getAll(
  table: DataTableName,
  userId?: string
): Promise<Record<string, unknown>[]> {
  const db = await getOfflineDb();
  if (userId && USER_INDEXED_TABLES.has(table)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.getAllFromIndex(table as any, 'by-user', userId);
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
