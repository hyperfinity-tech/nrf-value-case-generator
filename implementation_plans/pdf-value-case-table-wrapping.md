## Goal
Fix PDF Value Case table cell text overlap by wrapping long content in the
`Area of Impact` and `Opportunity` columns, ensuring consistent row heights.

## Current Behavior
- PDF output uses fixed column positions and single-line rendering for
  `Area of Impact` and `Opportunity`.
- Long text overlaps into adjacent columns.

## Proposed Changes
1. Update `renderValueCase` in `lib/abm/pdf-report.ts`:
   - Use `wrapText` for `area` and `opp` cell values.
   - Compute `maxLines` across columns per row.
   - Render multi-line text per column with consistent line height.
   - Increase row height based on `maxLines` and add padding.
2. Keep numeric `GM Uplift` column single-line, but vertically align with the
   first line of the row.
3. Ensure page breaks account for dynamic row height.

## Alternatives Considered
- Truncate with ellipsis: simpler but loses information and user requested
  wrapping.
- Narrower columns or smaller font: reduces overlap but harms readability.

## Files to Change
- `lib/abm/pdf-report.ts`

## Risks / Edge Cases
- Very long text could exceed page height; page-break logic will check required
  row height before rendering each row.
- If table markdown fallback is used, it already wraps per cell in
  `renderParsedTable`.

## Validation
- Generate a PDF with long `Area of Impact` values (mock + real data).
- Verify no overlap and consistent row spacing.
