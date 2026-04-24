import type { FocusEvent, MouseEvent } from "react";
import type { Effect, MinionInstance, PersistentInstance, RuntimeCard } from "../../types.js";

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

const TAG_LABELS: Record<string, string> = {
  rush: "冲锋",
  guard: "护卫",
  menace: "威慑",
  magicRes: "魔抗"
};

const TAG_CLASSES: Record<string, string> = {
  rush: "rush",
  guard: "guard",
  menace: "menace",
  magicRes: "magicRes"
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

function KeywordTags({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;

  return (
    <div className="keyword-row" aria-label="词条">
      {tags.map((tag) => (
        <span key={tag} className={classNames("keyword-badge", TAG_CLASSES[tag])}>
          {TAG_LABELS[tag] ?? tag}
        </span>
      ))}
    </div>
  );
}

function MinionStats({
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
  if (attack === undefined || health === undefined) return null;

  const hpText = maxHealth === undefined ? `${health}` : `${health}/${maxHealth}`;
  const threatText = resolveThreat(attack, health, threat);

  return (
    <div className="stats-line">
      <span className="stat-badge attack">攻 {attack}</span>
      <span className="stat-badge health">血 {hpText}</span>
      <span className="stat-badge threat">威 {threatText ?? "-"}</span>
    </div>
  );
}

export function HandCard({
  card,
  disabled = false,
  extraClass = "",
  onInspect,
  onClearInspect,
  onPlay
}: {
  card: RuntimeCard;
  disabled?: boolean;
  extraClass?: string;
  onInspect?: CardInspectHandler;
  onClearInspect?: () => void;
  onPlay?: (runtimeId: string) => void;
}) {
  const detailInfo: CardDetailInfo = {
    name: card.name,
    type: card.type,
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
    status: disabled ? "当前无法打出" : "可以打出"
  };

  return (
    <button
      type="button"
      className={classNames("card", card.type, disabled && "disabled", extraClass)}
      aria-disabled={disabled}
      onMouseEnter={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseMove={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseLeave={onClearInspect}
      onFocus={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onBlur={onClearInspect}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onPlay?.(card.runtimeId);
      }}
    >
      <span className="card-cost">{card.currentCost}</span>
      <h4>{card.name}</h4>
      <p className="card-meta">{card.type}</p>
      <KeywordTags tags={card.tags} />
      <p>{card.description}</p>
      {card.type === "minion" ? <MinionStats attack={card.attack} health={card.health} threat={card.threat} /> : null}
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
  const detailInfo: CardDetailInfo = {
    name: minion.name,
    type: "minion",
    description: minion.description,
    tags: minion.tags,
    effects: minion.effects,
    attack: minion.attack,
    health: minion.health,
    maxHealth: minion.maxHealth,
    threat: minion.threat,
    status: minion.canAttack && isPlayer ? "可以攻击" : "暂不能攻击"
  };

  return (
    <button
      type="button"
      data-pixi-entity-id={pixiEntityId}
      className={classNames(
        "minion-card",
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
      <h4>{minion.name}</h4>
      <KeywordTags tags={minion.tags} />
      <p className="minion-meta">{minion.description}</p>
      <MinionStats attack={minion.attack} health={minion.health} threat={minion.threat} maxHealth={minion.maxHealth} />
      <p className="small-note">{minion.canAttack && isPlayer ? "可以攻击" : "暂不能攻击"}</p>
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
    type: card.type,
    description: card.description,
    effects: card.effects,
    threat: card.threat,
    status: cardTone === "trap" ? "陷阱" : "持续物"
  };

  return (
    <div
      className={classNames("persistent-card", cardTone, placing && "placing")}
      data-pixi-entity-id={pixiEntityId}
      tabIndex={0}
      onMouseEnter={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseMove={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onMouseLeave={onClearInspect}
      onFocus={(event) => onInspect?.(detailInfo, getInspectPoint(event))}
      onBlur={onClearInspect}
    >
      <h4>{card.name}</h4>
      <p className="persistent-meta">威胁 {card.threat ?? 0}</p>
      <p>{card.description}</p>
    </div>
  );
}
