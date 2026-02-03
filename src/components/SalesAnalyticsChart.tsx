import { useMemo } from 'react';
import { Sale } from '@/types/sale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Package, Wallet } from 'lucide-react';

interface SalesAnalyticsChartProps {
  sales: Sale[];
}

export function SalesAnalyticsChart({ sales }: SalesAnalyticsChartProps) {
  const analytics = useMemo(() => {
    // Filter only completed sales
    const completedSales = sales.filter((s) => s.status === 'completed');

    // Calculate totals
    const totalItemsSold = completedSales.reduce(
      (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCost = completedSales.reduce((sum, sale) => sum + sale.totalCost, 0);
    const totalProfit = completedSales.reduce((sum, sale) => sum + sale.totalProfit, 0);

    // Prepare data for bar chart (last 7 sales or all if less)
    const recentSales = completedSales.slice(0, 10).reverse();
    const barChartData = recentSales.map((sale, index) => ({
      name: sale.invoiceNumber || `Sale ${index + 1}`,
      revenue: sale.total,
      cost: sale.totalCost,
      profit: sale.totalProfit,
    }));

    // Pie chart data
    const pieData = [
      { name: 'Profit', value: totalProfit, fill: 'hsl(var(--success))' },
      { name: 'Cost', value: totalCost, fill: 'hsl(var(--destructive))' },
    ];

    return {
      totalItemsSold,
      totalRevenue,
      totalCost,
      totalProfit,
      barChartData,
      pieData,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    };
  }, [sales]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const chartConfig: ChartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--primary))',
    },
    cost: {
      label: 'Cost',
      color: 'hsl(var(--destructive))',
    },
    profit: {
      label: 'Profit',
      color: 'hsl(var(--success))',
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Items Sold"
          value={analytics.totalItemsSold}
          icon={Package}
          variant="default"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analytics.totalRevenue)}
          icon={DollarSign}
          variant="default"
        />
        <StatCard
          title="Total Cost"
          value={formatCurrency(analytics.totalCost)}
          icon={Wallet}
          variant="warning"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(analytics.totalProfit)}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart - Revenue vs Cost vs Profit per sale */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.barChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No completed sales to display
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={analytics.barChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value}`}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <span>
                            {name}: {formatCurrency(Number(value))}
                          </span>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Profit vs Cost Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profit vs Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.totalRevenue === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No sales data to display
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <PieChart>
                    <Pie
                      data={analytics.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="flex gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-sm text-muted-foreground">
                      Profit ({analytics.profitMargin.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-sm text-muted-foreground">
                      Cost ({(100 - analytics.profitMargin).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
