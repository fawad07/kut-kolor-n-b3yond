# Gallery photos

Drop the client's gallery photos into this folder using the **exact filenames
below**. As soon as a file is here, it replaces the emoji placeholder on the
Gallery page automatically — no code changes needed.

- Format: `.jpg` (or update the path in `src/App.jsx` → `GALLERY_ITEMS`)
- Recommended: portrait orientation, ~800×1067px (3:4), optimized/compressed.

Expected files:

| Filename                     | Shown as         | Category    |
|------------------------------|------------------|-------------|
| `balayage.jpg`               | Balayage         | Color       |
| `precision-cut.jpg`          | Precision Cut    | Cuts        |
| `full-color.jpg`             | Full Color       | Color       |
| `mens-cut.jpg`               | Men's Cut        | Cuts        |
| `highlights.jpg`             | Highlights       | Color       |
| `blowout.jpg`                | Blowout          | Style       |
| `color-correction.jpg`       | Color Correction | Color       |
| `treatment.jpg`              | Treatment        | Treatments  |
| `keratin.jpg`                | Keratin          | Treatments  |

To add, remove, or relabel gallery items, edit the `GALLERY_ITEMS` array in
`src/App.jsx`. Any item whose photo is missing simply shows its emoji fallback.
