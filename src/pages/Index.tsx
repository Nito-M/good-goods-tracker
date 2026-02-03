import { Package, DollarSign, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface IndexProps {
  items: unknown[];
  stats: {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
  };
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  categories: string[];
  onEdit: (item: unknown) => void;
  onDelete: (id: string) => void;
  onOpenDialog: () => void;
}

const Index = ({
  stats,
  loading,
}: IndexProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
              Dashboard
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading dashboard...</div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <StatCard
                title="Total Items"
                value={stats.totalItems.toLocaleString()}
                icon={Package}
                variant="default"
              />
              <StatCard
                title="Total Value"
                value={formatCurrency(stats.totalValue)}
                icon={DollarSign}
                variant="success"
              />
              <StatCard
                title="Low Stock Alerts"
                value={stats.lowStockCount}
                icon={AlertTriangle}
                variant="warning"
              />
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link to="/items">
                  <Button variant="outline">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Items
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
