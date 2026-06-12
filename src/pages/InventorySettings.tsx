import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useInventoryPreferences, InventoryPriceDisplay } from '@/hooks/useInventoryPreferences';

export const InventorySettings = () => {
  const navigate = useNavigate();
  const { priceDisplay, setPriceDisplay, loading, saving } = useInventoryPreferences();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/items')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
              Inventory Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">Price column</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which price is shown in the Items & Inventory table.
          </p>

          <RadioGroup
            value={priceDisplay}
            onValueChange={(v) => setPriceDisplay(v as InventoryPriceDisplay)}
            className="mt-5 space-y-3"
            disabled={loading || saving}
          >
            <label
              htmlFor="price-selling"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 hover:bg-muted/30"
            >
              <RadioGroupItem value="selling" id="price-selling" className="mt-1" />
              <div>
                <Label htmlFor="price-selling" className="cursor-pointer text-sm font-medium">
                  Selling price
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show the customer-facing sale price for each item.
                </p>
              </div>
            </label>

            <label
              htmlFor="price-cost"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 hover:bg-muted/30"
            >
              <RadioGroupItem value="cost" id="price-cost" className="mt-1" />
              <div>
                <Label htmlFor="price-cost" className="cursor-pointer text-sm font-medium">
                  Cost price
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show what each item costs you (your purchase cost).
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>
      </main>
    </div>
  );
};

export default InventorySettings;
