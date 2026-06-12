import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useInventoryPreferences, InventoryPriceDisplay, InventoryColumnKey } from '@/hooks/useInventoryPreferences';

const COLUMN_LABELS: Record<InventoryColumnKey, string> = {
  image: 'Image',
  name: 'Product name',
  sku: 'Part number',
  quantity: 'Quantity',
  price: 'Price / Cost',
};

export const InventorySettings = () => {
  const navigate = useNavigate();
  const { priceDisplay, showTags, showImages, showSku, showQuantity, showPrice, columnOrder, setPriceDisplay, setShowTags, setShowImages, setShowSku, setShowQuantity, setShowPrice, setColumnOrder, loading, saving } = useInventoryPreferences();

  const moveColumn = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= columnOrder.length) return;
    const next = [...columnOrder];
    [next[index], next[target]] = [next[target], next[index]];
    setColumnOrder(next);
  };

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

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Price Column */}
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

        {/* Display Options */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">Display options</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose what else is visible in the Items & Inventory table.
          </p>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <Label htmlFor="show-tags" className="text-sm font-medium">
                  Show tags
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display tags under each item name.
                </p>
              </div>
              <Switch
                id="show-tags"
                checked={showTags}
                onCheckedChange={setShowTags}
                disabled={loading || saving}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <Label htmlFor="show-images" className="text-sm font-medium">
                  Show images
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display the thumbnail image column for each item.
                </p>
              </div>
              <Switch
                id="show-images"
                checked={showImages}
                onCheckedChange={setShowImages}
                disabled={loading || saving}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <Label htmlFor="show-sku" className="text-sm font-medium">
                  Show part number
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display the Part Number column for each item.
                </p>
              </div>
              <Switch
                id="show-sku"
                checked={showSku}
                onCheckedChange={setShowSku}
                disabled={loading || saving}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <Label htmlFor="show-quantity" className="text-sm font-medium">
                  Show quantity
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display the Quantity column for each item.
                </p>
              </div>
              <Switch
                id="show-quantity"
                checked={showQuantity}
                onCheckedChange={setShowQuantity}
                disabled={loading || saving}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <Label htmlFor="show-price" className="text-sm font-medium">
                  Show price column
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display the Price/Cost column for each item.
                </p>
              </div>
              <Switch
                id="show-price"
                checked={showPrice}
                onCheckedChange={setShowPrice}
                disabled={loading || saving}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InventorySettings;
