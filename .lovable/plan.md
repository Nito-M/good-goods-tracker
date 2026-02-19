
## Add Card Deposit on Bank Card Detail Page

**Goal:** Add a "Deposit" button on the card detail page that allows users to add funds directly to a specific card. The deposit should:
1. Increase the card's balance in `bank_cards`
2. Record a tagged transaction in `bank_transactions` (with the `bank_card_id` set) so it appears in both the card's transaction list and the overall bank ledger

---

### What will be built

A dialog/modal accessible from the `BankCardDetail` page with:
- An amount input
- An optional description input
- A submit button that triggers the deposit logic

---

### Files to change

**1. `src/hooks/useBank.ts`**
- Add a new `addCardDeposit(cardId, amount, description?)` function that:
  - Inserts a `deposit` transaction into `bank_transactions` with `bank_card_id` set to the given card
  - Updates the card's balance in `bank_cards` (increments by amount)
  - Refreshes transactions

**2. `src/hooks/useBankCards.ts`**
- The `updateCard` function already exists and can update balances, so we'll reuse it via the new hook function

**3. `src/pages/BankCardDetail.tsx`**
- Add a "Add Deposit" button in the header area next to the card visual
- Add a simple inline dialog (using the existing `Dialog` component) with:
  - Amount field (number input)
  - Description field (optional text input)
  - Submit button
- Wire up to the new `addCardDeposit` function
- Refresh card data and transactions after deposit

---

### Technical Details

**New `addCardDeposit` function logic:**
```
1. Fetch current card balance from bank_cards
2. Insert bank_transaction with type='deposit', bank_card_id=cardId
3. Update bank_cards.balance = current + amount
4. Refresh both transactions and cards
```

This ensures the deposit shows up in:
- The card's own transaction list (filtered by `bankCardId`)
- The overall bank ledger (it's a standard bank_transaction record)
- The card's displayed balance (updated in bank_cards)

No database migrations needed — the `bank_card_id` column already exists on `bank_transactions` from the previous migration.
