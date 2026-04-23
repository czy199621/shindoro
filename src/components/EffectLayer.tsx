import type { CardFxState } from "../store/useGameStore.js";
import { escapeHtml } from "./html.js";

function getEffectTone(kind: CardFxState["kind"]): "summon" | "persistent" | "spell" | "trap" {
  switch (kind) {
    case "summonMinion":
      return "summon";
    case "placePersistent":
      return "persistent";
    case "spellCast":
      return "spell";
    case "placeTrap":
    case "trapTrigger":
      return "trap";
  }
}

function getEffectTitle(kind: CardFxState["kind"]): string {
  switch (kind) {
    case "summonMinion":
      return "召唤使魔";
    case "placePersistent":
      return "放置持续物";
    case "placeTrap":
      return "盖伏陷阱";
    case "spellCast":
      return "发动法术";
    case "trapTrigger":
      return "陷阱触发";
  }
}

function getEffectDescription(fx: CardFxState): string {
  const ownerLabel = fx.ownerId === "P1" ? "玩家" : "AI";
  switch (fx.kind) {
    case "summonMinion":
      return `${ownerLabel} 召唤了 ${fx.cardName}`;
    case "placePersistent":
      return `${ownerLabel} 放置了 ${fx.cardName}`;
    case "placeTrap":
      return `${ownerLabel} 盖伏了 ${fx.cardName}`;
    case "spellCast":
      return `${ownerLabel} 发动了 ${fx.cardName}`;
    case "trapTrigger":
      return `${ownerLabel} 的 ${fx.cardName} 被触发`;
  }
}

export function renderEffectLayer(fx: CardFxState | null): string {
  if (!fx) return "";

  const tone = getEffectTone(fx.kind);
  return `
    <div class="effect-layer" aria-live="polite">
      <div class="effect-banner ${tone} ${fx.ownerId === "P1" ? "player" : "enemy"}">
        <div class="effect-banner-mark" aria-hidden="true"></div>
        <div class="effect-banner-copy">
          <span class="effect-banner-title">${escapeHtml(getEffectTitle(fx.kind))}</span>
          <strong class="effect-banner-name">${escapeHtml(fx.cardName)}</strong>
          <span class="effect-banner-detail">${escapeHtml(getEffectDescription(fx))}</span>
        </div>
      </div>
    </div>
  `;
}
