-- Add iyzico payment fields to payment_transactions table

-- Add iyzico payment ID column
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS iyzico_payment_id TEXT;

-- Add iyzico conversation ID column
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS iyzico_conversation_id TEXT;

-- Add error message column for failed payments
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_iyzico_payment_id
ON payment_transactions(iyzico_payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_method
ON payment_transactions(payment_method);

-- Add comment to payment_method column for clarity
COMMENT ON COLUMN payment_transactions.payment_method IS 'Payment method: bank_transfer or iyzico';
