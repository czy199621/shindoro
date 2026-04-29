# Card Frame Assets

This folder stores bitmap card-frame pieces used by the card UI.

## Recommended Sizes

- Full-card frame layers: `720 x 1040` transparent PNG.
- Cost gem: `256 x 256` transparent PNG.
- Attack / defense / threat badges: `256 x 160` transparent PNG.

## Current Structure

```text
public/card-frames/common/
  frame.png
  cost-gem.png
  title-plate.png
  text-box.png
  stat-attack.png
  stat-health.png
  stat-threat.png

public/card-frames/minion/
  frame.png
  art-window.png
  title-plate.png
  text-box.png
  ornaments.png
  cost-gem.png

public/card-frames/spell/
  frame.png
  art-window.png
  title-plate.png
  text-box.png
  ornaments.png
  cost-gem.png

public/card-frames/persistent/
  frame.png
  art-window.png
  title-plate.png
  text-box.png
  ornaments.png
  cost-gem.png

public/card-frames/trap/
  frame.png
  art-window.png
  title-plate.png
  text-box.png
  ornaments.png
  cost-gem.png
```

## Usage Notes

- `frame.png` is the full-card base frame. The first pass is a shared pastel moe frame copied into every card type so the UI has a visible baseline style.
- Type-specific assets override common assets when present. Replace `public/card-frames/<type>/frame.png` to give a card type its own frame.
- Keep full-card transparent PNG layers aligned to the same `720 x 1040` canvas to avoid layout drift.
- Do not bake card name, effect text, cost number, attack, defense, or threat numbers into frame images. The UI renders gameplay values separately.
