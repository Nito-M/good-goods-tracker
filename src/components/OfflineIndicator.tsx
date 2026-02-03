import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline } = useOnlineStatus();
  const { pendingCount, isSyncing, syncAll } = useSyncQueue();

  return (
    <div className="flex items-center gap-2">
      {/* Pending changes badge */}
      {pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={syncAll}
              disabled={!isOnline || isSyncing}
              className="gap-1.5 h-8 px-2"
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {pendingCount}
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSyncing
              ? 'Syncing changes...'
              : isOnline
              ? `${pendingCount} pending change${pendingCount > 1 ? 's' : ''} - Click to sync`
              : `${pendingCount} change${pendingCount > 1 ? 's' : ''} waiting to sync`}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Online/Offline status */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
              isOnline
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
            )}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline
            ? 'Connected - Changes sync automatically'
            : 'Offline - Changes will sync when back online'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
