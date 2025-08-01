# RHY Battery Data Files

This directory contains critical data files for the RHY Battery supplier portal integration.

## Files

### import-9.11.xls
- **Purpose**: RHY Battery's standard CSV order format specification
- **Format**: Excel file containing the import-9.11 format structure
- **Used by**: Terminal 5 - Partner Portal for CSV order generation
- **Integration**: Used in artifact `08-csv-processor.ts` for order export

### inventory-list.xlsx
- **Purpose**: Current RHY Battery inventory across all warehouses
- **Format**: Excel spreadsheet with multi-warehouse inventory data
- **Warehouses**: US, Japan, EU, Australia
- **Used by**: Terminal 5 - Partner Portal for inventory management
- **Integration**: Used in artifacts:
  - `02-inventory-management.tsx`
  - `09-inventory-sync.ts`
  - `10-global-dashboard.tsx`

## Usage Notes

These files are referenced by the Partner Portal (Terminal 5) for:
1. Generating orders in RHY's required CSV format
2. Syncing inventory levels across global warehouses
3. Validating product codes and pricing
4. Managing multi-currency transactions

## Security Note
These files contain sensitive business data and should not be committed to version control.
Add `*.xls` and `*.xlsx` to `.gitignore` in this directory.