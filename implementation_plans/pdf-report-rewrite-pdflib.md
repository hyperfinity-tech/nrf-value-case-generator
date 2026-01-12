# PDF Report Rewrite: jsPDF → pdf-lib

## Problem
The current PDF generation using jsPDF has text spacing and alignment issues:
- Irregular letter spacing in paragraphs (visible in "Strategic Overview" section)
- Misaligned badges and labels in "Data Confidence" row
- Poor font metrics causing unnatural character spacing

## Solution
Complete rewrite using `pdf-lib` which has:
- Proper font metrics and character spacing
- Better text rendering
- Cleaner API for PDF generation
- Support for custom font embedding

## Font Requirement
Current fonts are in woff2 format (`Roobert-Regular.woff2`, `Roobert-Bold.woff2`).
pdf-lib requires TTF or OTF format.

**Options:**
1. **Convert woff2 to TTF** - Add TTF versions of Roobert to `/public/fonts/`
2. **Runtime conversion** - Use a library like `woff2-to-ttf` (adds complexity)
3. **Fallback** - Use standard PDF fonts (Helvetica) if TTF not available

**Recommended:** Option 1 - Add TTF versions of Roobert fonts. The user likely has access to the full font package from https://displaay.net/typeface/roobert/

## Dependencies
```bash
pnpm add pdf-lib fontkit
```

- `pdf-lib`: Core PDF generation library
- `fontkit`: Required for custom font embedding in pdf-lib

## File Changes

### 1. `lib/abm/pdf-report.ts` - Complete Rewrite
Replace jsPDF implementation with pdf-lib:

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@aspect-dev/fontkit';

// Key changes:
// - Use PDFDocument.create() instead of new jsPDF()
// - Embed fonts with pdfDoc.embedFont()
// - Use page.drawText() with explicit positioning
// - Use page.drawRectangle() for backgrounds
// - Proper text width calculation with font.widthOfTextAtSize()
```

### 2. `lib/abm/pdf-report-styles.ts` - Minor Updates
- Convert RGB arrays to pdf-lib's `rgb()` format (0-1 scale instead of 0-255)
- Update type definitions

### 3. Font Files (User Action Required)
Add TTF versions to `/public/fonts/`:
- `Roobert-Regular.ttf`
- `Roobert-Bold.ttf`

## Architecture

### Core Functions (pdf-lib equivalents)

| jsPDF Function | pdf-lib Equivalent |
|----------------|-------------------|
| `new jsPDF()` | `PDFDocument.create()` |
| `pdf.addPage()` | `pdfDoc.addPage()` |
| `pdf.text(str, x, y)` | `page.drawText(str, {x, y, ...})` |
| `pdf.setFontSize(n)` | Pass `size` to drawText options |
| `pdf.splitTextToSize()` | Manual text wrapping with `font.widthOfTextAtSize()` |
| `pdf.roundedRect()` | `page.drawRectangle()` (no native rounded rect) |
| `pdf.addImage()` | `pdfDoc.embedPng/embedJpg()` then `page.drawImage()` |
| `pdf.save()` | `pdfDoc.save()` returns Uint8Array |

### Text Wrapping Helper
pdf-lib doesn't have built-in text wrapping. We'll implement:
```typescript
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines;
}
```

### Rounded Rectangle Helper
pdf-lib doesn't have native rounded rectangles. We'll implement using paths:
```typescript
function drawRoundedRect(page: PDFPage, x: number, y: number, width: number, height: number, radius: number, color: RGB) {
  // Use Bezier curves at corners
}
```

## Implementation Steps

1. **Install dependencies** - Add pdf-lib and fontkit
2. **Add TTF fonts** - User needs to add Roobert-Regular.ttf and Roobert-Bold.ttf
3. **Update styles file** - Convert colors to 0-1 RGB scale
4. **Rewrite pdf-report.ts** - Complete rewrite with pdf-lib API
5. **Test** - Generate PDF and verify text spacing is correct

## Coordinate System Note
- **jsPDF**: Origin at top-left, Y increases downward
- **pdf-lib**: Origin at bottom-left, Y increases upward

This requires inverting Y calculations: `y = pageHeight - topOffset`

## Rollback Plan
Keep the original jsPDF files with a `.backup` suffix until the new implementation is verified.

## Timeline Estimate
- Styles update: 10 minutes
- Core rewrite: 1-2 hours
- Testing: 30 minutes

## Questions for User
1. Do you have access to TTF/OTF versions of Roobert? If not, should we fall back to a standard font?
