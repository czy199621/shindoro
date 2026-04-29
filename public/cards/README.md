Card art JPG assets live in this folder.

Convention:
- Each card resolves `/cards/<card-id>.jpg` from `src/data/cardArt.ts`.
- Replace any generated file with a hand-painted JPG using the same card id.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-card-art.ps1` to regenerate the simple default illustrations from the card data.
- Keep art crop-safe and avoid printed rules text; rules are shown by hover inspection.
