import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from './useOnlineStatus';
import {
  getSyncQueue,
  removeSyncQueueItem,
  getSyncQueueCount,
  SyncQueueItem,
  DataTableName,
} from '@/lib/offlineDb';

export function useSyncQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOnline } = useOnlineStatus();
  const { toast } = useToast();

  const updatePendingCount = useCallback(async () => {
    const count = await getSyncQueueCount();
    setPendingCount(count);
  }, []);

  const processQueueItem = async (item: SyncQueueItem): Promise<boolean> => {
    try {
      const tableName = item.table as DataTableName;
      
      switch (item.operation) {
        case 'insert': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await supabase.from(tableName).insert(item.data as any);
          if (error) throw error;
          break;
        }
        case 'update': {
          const { id, ...updates } = item.data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await supabase.from(tableName).update(updates as any).eq('id', id as string);
          if (error) throw error;
          break;
        }
        case 'delete': {
          const { error } = await supabase.from(tableName).delete().eq('id', item.data.id as string);
          if (error) throw error;
          break;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to sync item:', item, error);
      return false;
    }
  };

  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    const queue = await getSyncQueue();
    
    if (queue.length === 0) {
      setIsSyncing(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      const success = await processQueueItem(item);
      if (success) {
        await removeSyncQueueItem(item.id);
        successCount++;
      } else {
        failCount++;
      }
    }

    await updatePendingCount();
    setIsSyncing(false);

    if (successCount > 0) {
      toast({
        title: 'Sync complete',
        description: `${successCount} change${successCount > 1 ? 's' : ''} synced${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });
    }

    // Trigger refetch of data
    window.dispatchEvent(new CustomEvent('sync-complete'));
  }, [isOnline, isSyncing, toast, updatePendingCount]);

  // Sync when coming back online
  useEffect(() => {
    const handleCameOnline = () => {
      syncAll();
    };

    window.addEventListener('app-came-online', handleCameOnline);
    return () => window.removeEventListener('app-came-online', handleCameOnline);
  }, [syncAll]);

  // Update pending count on mount and when queue changes
  useEffect(() => {
    updatePendingCount();

    const handleQueueChange = () => updatePendingCount();
    window.addEventListener('sync-queue-changed', handleQueueChange);
    return () => window.removeEventListener('sync-queue-changed', handleQueueChange);
  }, [updatePendingCount]);

  // Auto-sync periodically when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      if (pendingCount > 0) {
        syncAll();
      }
    }, 30000); // Try to sync every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, pendingCount, syncAll]);

  return {
    pendingCount,
    isSyncing,
    syncAll,
    updatePendingCount,
  };
}
