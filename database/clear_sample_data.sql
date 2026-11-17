-- ==============================================================================
-- KING PLAST | الكينج بلاست — Clean Sample Data Script
-- Instructions: Run this script against your production PostgreSQL database
-- to remove any demo products, test quotation requests, or development logs.
-- ==============================================================================

BEGIN;

-- Remove sample quotation items and requests
DELETE FROM quotation_items;
DELETE FROM quotation_requests;

-- Remove development products (leaves categories intact or clear as needed)
DELETE FROM products WHERE sku LIKE 'DEMO-%' OR sku LIKE 'KP-SAMPLE-%';

-- Optional: Reset audit logs from local testing
-- DELETE FROM audit_logs WHERE details LIKE '%test%';

COMMIT;
