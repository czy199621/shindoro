import type { CharacterDefinition, PlayerState } from "../../types.js";

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function getSlotNote(current: number): string {
  if (current >= 13) return "13 点已满，可发动强化效果";
  if (current >= 10) return "10 点已就绪，可选择发动";
  return `还差 ${10 - current} 点到 10 点`;
}

function getSlotStateClass(current: number): "full" | "ready" | "charging" {
  if (current >= 13) return "full";
  if (current >= 10) return "ready";
  return "charging";
}

function SlotMeter({ label, current, colorClass }: { label: string; current: number; colorClass: string }) {
  const percentage = Math.min((current / 13) * 100, 100);
  const slotState = getSlotStateClass(current);

  return (
    <div className={classNames("slot-card", slotState)}>
      <div className="slot-card-header">
        <strong className="slot-card-label">{label}</strong>
        <span className="small-note slot-card-count">{current}/13</span>
      </div>
      <div className="slot-bar" aria-hidden="true">
        <div className={classNames("slot-fill", colorClass)} style={{ width: `${percentage}%` }} />
      </div>
      <p className="slot-card-note">{getSlotNote(current)}</p>
    </div>
  );
}

function PrimaryResource({ label, value, tone }: { label: string; value: string; tone: "hp" | "mana" }) {
  return (
    <div className={classNames("hud-resource", tone)}>
      <div className={classNames("hud-resource-emblem", tone)} aria-hidden="true">
        <span className={classNames("hud-resource-glyph", tone)} />
      </div>
      <div className="hud-resource-copy">
        <span className="hud-resource-label">{label}</span>
        <strong className="hud-resource-value">{value}</strong>
      </div>
    </div>
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hud-stat">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

export function PlayerHUD({
  player,
  character,
  ownership,
  targetableHero,
  impactTarget = false,
  pixiEntityId,
  onAttackHero
}: {
  player: PlayerState;
  character: CharacterDefinition;
  ownership: "player" | "enemy";
  targetableHero: boolean;
  impactTarget?: boolean;
  pixiEntityId?: string;
  onAttackHero?: () => void;
}) {
  return (
    <button
      type="button"
      data-pixi-entity-id={pixiEntityId}
      className={classNames("hud", ownership, targetableHero && "targetable", impactTarget && "impact-target")}
      disabled={!targetableHero}
      onClick={() => {
        if (targetableHero) onAttackHero?.();
      }}
    >
      <div className="hud-header">
        <div>
          <div className="hud-title">{character.name}</div>
          <div className="small-note">{character.title ?? character.passive.name}</div>
        </div>
        <div className="hud-passive small-note">{character.passive.description}</div>
      </div>

      <div className="hud-resource-row">
        <PrimaryResource label="生命" value={`${player.hp}/${player.maxHp}`} tone="hp" />
        <PrimaryResource label="法力" value={`${player.mana}/${player.maxMana}`} tone="mana" />
      </div>

      <div className="hud-stats">
        <HudStat label="手牌" value={`${player.hand.length}`} />
        <HudStat label="牌库" value={`${player.deck.length}`} />
      </div>

      <div className="slot-metrics">
        <SlotMeter label="跳跃槽" current={player.jumpSlot} colorClass="jump" />
        <SlotMeter label="神抽槽" current={player.godDrawSlot} colorClass="god" />
      </div>
    </button>
  );
}
