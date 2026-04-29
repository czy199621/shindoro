import type { CSSProperties, FocusEvent, MouseEvent } from "react";
import type { CardType, Effect, MinionInstance, PersistentInstance, RuntimeCard } from "../../types.js";

export interface InspectPoint {
  x: number;
  y: number;
}

export interface CardDetailInfo {
  name: string;
  type: string;
  description: string;
  tags?: string[];
  effects?: Effect[];
  cost?: number;
  baseCost?: number;
  currentCost?: number;
  attack?: number;
  health?: number;
  maxHealth?: number;
  threat?: number;
  flavor?: string;
  status?: string;
}

export type CardInspectHandler = (info: CardDetailInfo, point: InspectPoint) => void;

const CARD_TYPE_LABELS: Record<CardType, string> = {
  minion: "随从",
  spell: "法术",
  persistent: "持续物",
  trap: "陷阱"
};

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function getInspectPoint(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>): InspectPoint {
  if ("clientX" in event && event.clientX > 0 && event.clientY > 0) {
    return { x: event.clientX, y: event.clientY };
  }

  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function resolveThreat(attack: number | undefined, health: number | undefined, threat: number | undefined): number | null {
  if (threat !== undefined) return threat;
  if (attack === undefined || health === undefined) return null;
  return Math.floor(attack + health / 2);
}

function shouldShowCardStats(cardType: CardType): boolean {
  return cardType === "minion";
}

function CardArt({ tone, art }: { tone: CardType | "unit" | "persistent-unit"; art?: string }) {
  return (
    <span
      className={classNames("card-art", tone, art && "has-card-art")}
      style={art ? ({ "--card-art-image": `url(${art})` } as CSSProperties) : undefined}
      aria-hidden="true"
    >
      <span className="card-art-glass" />
      <span className="card-art-spark one" />
      <span className="card-art-spark two" />
    </span>
  );
}

function CardFrameLayers() {
  return (
    <span className="card-frame-layers" aria-hidden="true">
      <span className="card-frame-layer card-frame-base" />
      <span className="card-frame-layer card-frame-art-window" />
      <span className="card-frame-layer card-frame-title-plate" />
      <span className="card-frame-layer card-frame-text-box" />
      <span className="card-frame-layer card-frame-ornaments" />
    </span>
  );
}

function CardStats({
  attack,
  health,
  threat,
  maxHealth
}: {
  attack?: number;
  health?: number;
  threat?: number;
  maxHealth?: number;
}) {
  const attackText = attack === undefined ? "-" : `${attack}`;
  const defenseText = health === undefined ? "-" : maxHealth === undefined ? `${health}` : `${health}/${maxHealth}`;
  const threatText = resolveThreat(attack, health, threat);

  return (
    <div className="stats-line">
      <span className="stat-badge attack" aria-label={`攻击 ${attackText}`}>
        <span className="stat-icon stat-icon-sword" aria-hidden="true" />
        <span className="stat-value">{attackText}</span>
      </span>
      <span className="stat-badge health" aria-label={`防御 ${defenseText}`}>
        <span className="stat-icon stat-icon-shield" aria-hidden="true" />
        <span className="stat-value">{defenseText}</span>
      </span>
      <span className="stat-badge threat" aria-label={`威胁 ${threatText ?? "-"}`}>
        <span className="stat-icon stat-icon-lightning" aria-hidden="true" />
        <span className="stat-value">{threatText ?? "-"}</span>
      </span>
    </div>
  );
}

export function HandCard({
  card,
  disabled = false,
  disabledReason,
  extraClass = "",
  selected = false,
  selectionLabel = "已选择",
  onInspect,
  onClearInspect,
  onSelect,
  onPlay,
  fanIndex = 0,
  fanCount = 1
}: {
  card: RuntimeCard;
  disabled?: boolean;
  disabledReason?: string;
  extraClass?: string;
  selected?: boolean;
  selectionLabel?: string;
  fanIndex?: number;
  fanCount?: number;
  onInspect?: CardInspectHandler;
  onClearInspect?: () => void;
  onSelect?: (runtimeId: string) => void;
  onPlay?: (runtimeId: string) => void;
}) {
  const playStateText = disabled ? disabledReason ?? "当前无法打出" : "可以打出";
  const detailInfo: CardDetailInfo = {
    name: card.name,
    type: CARD_TYPE_LABELS[card.type] ?? card.type,
    description: card.description,
    tags: card.tags,
    effects: card.effects,
    cost: card.cost,
    baseCost: card.baseCost,
    currentCost: card.currentCost,
    attack: card.attack,
    health: card.health,
    threat: card.threat,
    flavor: card.flavor,
    status: playStateText
  };

  return (
    <button
      type="button"
      className={classNames("card", "framed-card", card.type, disabled && "disabled", extraClass)}
      aria-disabled={disabled}
      aria-pressed={selected || undefined}
      style={
        {
          "--fan-index": fanIndex,
          "--fan-count": Math.max(fanCount, 1)
        } as CSSProperties
      }
      onMouseEnter={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseMove={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseLeave={onClearInspect}
      onFocus={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onBlur={onClearInspect}
      onClick={(event) => {
        if (onSelect) {
          event.preventDefault();
          onSelect(card.runtimeId);
          return;
        }
        if (disabled) {
          event.preventDefault();
          return;
        }
        onPlay?.(card.runtimeId);
      }}
    >
      <CardFrameLayers />
      <span className="card-cost">{card.currentCost}</span>
      <CardArt tone={card.type} art={card.art} />
      {selected ? <span className="card-selection-mark">{selectionLabel}</span> : null}
      {shouldShowCardStats(card.type) && <CardStats attack={card.attack} health={card.health} threat={card.threat} />}
    </button>
  );
}

export function MinionCard({
  minion,
  ownership,
  selectedAttackerId,
  targetable = false,
  attacking = false,
  impactTarget = false,
  summoning = false,
  pixiEntityId,
  onInspect,
  onClearInspect,
  onClick
}: {
  minion: MinionInstance;
  ownership: "player" | "enemy";
  selectedAttackerId: string | null;
  targetable?: boolean;
  attacking?: boolean;
  impactTarget?: boolean;
  summoning?: boolean;
  pixiEntityId?: string;
  onInspect?: CardInspectHandler;
  onClearInspect?: () => void;
  onClick?: (minionId: string) => void;
}) {
  const isPlayer = ownership === "player";
  const isSelected = selectedAttackerId === minion.instanceId;
  const statusText = targetable ? "可被攻击" : isSelected ? "已选择" : minion.canAttack && isPlayer ? "可以攻击" : "暂不能攻击";
  const detailInfo: CardDetailInfo = {
    name: minion.name,
    type: "随从",
    description: minion.description,
    tags: minion.tags,
    effects: minion.effects,
    attack: minion.attack,
    health: minion.health,
    maxHealth: minion.maxHealth,
    threat: minion.threat,
    status: statusText
  };

  return (
    <button
      type="button"
      data-pixi-entity-id={pixiEntityId}
      className={classNames(
        "minion-card",
        "framed-card",
        minion.canAttack && isPlayer && "ready",
        isSelected && "selected",
        targetable && "targetable",
        attacking && "attacking",
        impactTarget && "impact-target",
        summoning && "summoning"
      )}
      onMouseEnter={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseMove={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseLeave={onClearInspect}
      onFocus={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onBlur={onClearInspect}
      onClick={() => onClick?.(minion.instanceId)}
    >
      <CardFrameLayers />
      <CardArt tone="unit" art={minion.art} />
      <CardStats attack={minion.attack} health={minion.health} threat={minion.threat} maxHealth={minion.maxHealth} />
    </button>
  );
}

export function PersistentCard({
  card,
  placing = false,
  cardTone = "persistent",
  pixiEntityId,
  onInspect,
  onClearInspect
}: {
  card: PersistentInstance;
  placing?: boolean;
  cardTone?: "persistent" | "trap";
  pixiEntityId?: string;
  onInspect?: CardInspectHandler;
  onClearInspect?: () => void;
}) {
  const detailInfo: CardDetailInfo = {
    name: card.name,
    type: CARD_TYPE_LABELS[card.type] ?? card.type,
    description: card.description,
    effects: card.effects,
    threat: card.threat,
    status: cardTone === "trap" ? "陷阱" : "持续物"
  };

  return (
    <div
      className={classNames("persistent-card", "framed-card", cardTone, placing && "placing")}
      data-pixi-entity-id={pixiEntityId}
      tabIndex={0}
      onMouseEnter={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseMove={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseLeave={onClearInspect}
      onFocus={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onBlur={onClearInspect}
    >
      <CardFrameLayers />
      <CardArt tone={cardTone === "trap" ? "trap" : "persistent-unit"} art={card.art} />
    </div>
  );
}
