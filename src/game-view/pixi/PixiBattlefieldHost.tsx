import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text, type Ticker } from "pixi.js";
import type { AttackFxState, CardFxState } from "../../store/useGameStore.js";
import type { GameState, PlayerId } from "../../types.js";

interface Point {
  x: number;
  y: number;
}

interface BattlefieldLayout {
  width: number;
  height: number;
  laneX: number;
  laneWidth: number;
  laneHeight: number;
  enemyY: number;
  playerY: number;
  gap: number;
  slotWidth: number;
  slotHeight: number;
}

interface DamageSnapshot {
  heroes: Record<PlayerId, number>;
  minions: Map<string, { health: number; ownerId: PlayerId; point: Point }>;
}

interface RuntimeEffect {
  id: string;
  elapsed: number;
  duration: number;
  root: Container;
  update(progress: number): void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function buildLayout(width: number, height: number): BattlefieldLayout {
  const centerX = width / 2;
  const laneWidth = clamp(width * 0.7, 680, 1180);
  const laneHeight = clamp(height * 0.13, 96, 148);
  const laneX = centerX - laneWidth / 2;
  const gap = clamp(laneWidth * 0.012, 8, 14);
  const slotWidth = (laneWidth - gap * 8) / 7;
  const slotHeight = clamp(laneHeight * 0.42, 42, 70);

  return {
    width,
    height,
    laneX,
    laneWidth,
    laneHeight,
    enemyY: height * 0.26,
    playerY: height * 0.56,
    gap,
    slotWidth,
    slotHeight
  };
}

function readDomEntityPoint(id: string, host: HTMLElement | null, app: Application | null): Point | null {
  if (!host || !app || typeof document === "undefined") return null;

  const hostRect = host.getBoundingClientRect();
  if (hostRect.width <= 0 || hostRect.height <= 0) return null;

  const elements = document.querySelectorAll<HTMLElement>("[data-pixi-entity-id]");
  let matchedPoint: Point | null = null;
  elements.forEach((element) => {
    if (matchedPoint) return;
    if (element.dataset.pixiEntityId !== id) return;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const scaleX = app.renderer.width / hostRect.width;
    const scaleY = app.renderer.height / hostRect.height;

    matchedPoint = {
      x: (rect.left + rect.width / 2 - hostRect.left) * scaleX,
      y: (rect.top + rect.height / 2 - hostRect.top) * scaleY
    };
  });

  return matchedPoint;
}

function getLaneY(layout: BattlefieldLayout, ownerId: PlayerId): number {
  return ownerId === "P1" ? layout.playerY : layout.enemyY;
}

function getSlotPoint(layout: BattlefieldLayout, ownerId: PlayerId, index: number): Point {
  const laneY = getLaneY(layout, ownerId);
  const slotY = laneY + layout.laneHeight * 0.34;

  return {
    x: layout.laneX + layout.gap + index * (layout.slotWidth + layout.gap) + layout.slotWidth / 2,
    y: slotY + layout.slotHeight / 2
  };
}

function getHeroPoint(layout: BattlefieldLayout, heroId: string): Point {
  if (heroId === "P2_hero") {
    return {
      x: layout.laneX - 78,
      y: layout.enemyY + layout.laneHeight / 2
    };
  }

  return {
    x: layout.laneX + layout.laneWidth + 78,
    y: layout.playerY + layout.laneHeight / 2
  };
}

function getOwnerFocusPoint(layout: BattlefieldLayout, ownerId: PlayerId): Point {
  const laneY = getLaneY(layout, ownerId);
  return {
    x: layout.laneX + layout.laneWidth / 2,
    y: laneY + layout.laneHeight * 0.54
  };
}

function findMinionOwner(state: GameState, minionId: string): PlayerId | null {
  if (state.players.P1.board.some((minion) => minion.instanceId === minionId)) return "P1";
  if (state.players.P2.board.some((minion) => minion.instanceId === minionId)) return "P2";
  return null;
}

function getMinionPoint(state: GameState, layout: BattlefieldLayout, minionId: string): Point | null {
  for (const ownerId of ["P1", "P2"] as const) {
    const index = state.players[ownerId].board.findIndex((minion) => minion.instanceId === minionId);
    if (index >= 0) return getSlotPoint(layout, ownerId, index);
  }

  return null;
}

function getEntityPoint(state: GameState, layout: BattlefieldLayout, id: string): Point | null {
  if (id === "P1_hero" || id === "P2_hero") return getHeroPoint(layout, id);
  return getMinionPoint(state, layout, id);
}

function buildDamageSnapshot(
  state: GameState,
  layout: BattlefieldLayout,
  resolvePoint: (id: string, fallback: Point) => Point = (_id, fallback) => fallback
): DamageSnapshot {
  const minions = new Map<string, { health: number; ownerId: PlayerId; point: Point }>();

  for (const ownerId of ["P1", "P2"] as const) {
    state.players[ownerId].board.forEach((minion, index) => {
      const fallbackPoint = getSlotPoint(layout, ownerId, index);
      minions.set(minion.instanceId, {
        health: minion.health,
        ownerId,
        point: resolvePoint(minion.instanceId, fallbackPoint)
      });
    });
  }

  return {
    heroes: {
      P1: state.players.P1.hp,
      P2: state.players.P2.hp
    },
    minions
  };
}

function effectColorForOwner(ownerId: PlayerId | null): number {
  return ownerId === "P2" ? 0x66b5ff : 0xe76443;
}

function createAttackTrail(id: string, from: Point, to: Point, color: number): RuntimeEffect {
  const root = new Container();
  const trail = new Graphics();
  const impact = new Graphics();
  root.addChild(trail, impact);

  return {
    id,
    elapsed: 0,
    duration: 380,
    root,
    update(progress: number): void {
      const eased = easeOutCubic(progress);
      const current = {
        x: lerp(from.x, to.x, eased),
        y: lerp(from.y, to.y, eased) - Math.sin(eased * Math.PI) * 66
      };
      const fade = 1 - Math.max(0, progress - 0.72) / 0.28;

      trail.clear();
      trail
        .moveTo(from.x, from.y)
        .lineTo(current.x, current.y)
        .stroke({ color, width: 7, alpha: 0.16 * fade })
        .moveTo(from.x, from.y)
        .lineTo(current.x, current.y)
        .stroke({ color: 0xffffff, width: 2.4, alpha: 0.5 * fade })
        .circle(current.x, current.y, 8 + Math.sin(progress * Math.PI) * 5)
        .fill({ color: 0xffffff, alpha: 0.32 * fade })
        .circle(current.x, current.y, 4)
        .fill({ color, alpha: 0.65 * fade });

      impact.clear();
      if (progress > 0.58) {
        const burstProgress = (progress - 0.58) / 0.42;
        impact
          .circle(to.x, to.y, 16 + burstProgress * 54)
          .stroke({ color, width: 4, alpha: 0.44 * (1 - burstProgress) })
          .circle(to.x, to.y, 7 + burstProgress * 18)
          .fill({ color: 0xffffff, alpha: 0.22 * (1 - burstProgress) });
      }
    }
  };
}

function createBurst(id: string, point: Point, color: number, duration = 520): RuntimeEffect {
  const root = new Container();
  const burst = new Graphics();
  root.addChild(burst);

  return {
    id,
    elapsed: 0,
    duration,
    root,
    update(progress: number): void {
      const fade = 1 - progress;
      burst.clear();
      burst
        .circle(point.x, point.y, 18 + progress * 88)
        .stroke({ color, width: 4, alpha: 0.32 * fade })
        .circle(point.x, point.y, 6 + progress * 24)
        .fill({ color: 0xffffff, alpha: 0.16 * fade });

      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8 + progress * 0.9;
        const distance = 20 + progress * 76;
        burst.circle(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance, 2.6 + fade * 2.2).fill({
          color,
          alpha: 0.28 * fade
        });
      }
    }
  };
}

function createSummonEffect(id: string, point: Point, color: number): RuntimeEffect {
  const root = new Container();
  const rings = new Graphics();
  root.addChild(rings);

  return {
    id,
    elapsed: 0,
    duration: 720,
    root,
    update(progress: number): void {
      const fade = 1 - progress;
      const pulse = Math.sin(progress * Math.PI);

      rings.clear();
      rings
        .circle(point.x, point.y, 20 + progress * 98)
        .stroke({ color, width: 5, alpha: 0.3 * fade })
        .circle(point.x, point.y, 10 + progress * 34)
        .fill({ color: 0xffffff, alpha: 0.12 * pulse });

      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12 - progress * 1.8;
        const distance = 18 + progress * 92;
        rings.circle(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance, 2.4 + pulse * 2.2).fill({
          color,
          alpha: 0.32 * fade
        });
      }
    }
  };
}

function createDamageNumber(id: string, point: Point, amount: number): RuntimeEffect {
  const root = new Container();
  const label = new Text({
    text: `-${amount}`,
    anchor: 0.5,
    style: {
      fontFamily: "Segoe UI, Microsoft YaHei UI, sans-serif",
      fontSize: 32,
      fontWeight: "800",
      fill: 0xfff0c2,
      stroke: { color: 0x4c150f, width: 5 }
    }
  });
  label.x = point.x;
  label.y = point.y;
  root.addChild(label);

  return {
    id,
    elapsed: 0,
    duration: 760,
    root,
    update(progress: number): void {
      const eased = easeOutCubic(progress);
      label.x = point.x + Math.sin(progress * Math.PI) * 10;
      label.y = point.y - eased * 72;
      label.alpha = progress < 0.68 ? 1 : 1 - (progress - 0.68) / 0.32;
      label.scale.set(1 + Math.sin(progress * Math.PI) * 0.2);
    }
  };
}

export function PixiBattlefieldHost({
  state,
  attackFx,
  cardFx
}: {
  state: GameState;
  attackFx: AttackFxState | null;
  cardFx: CardFxState | null;
}) {
  const effectsHostRef = useRef<HTMLDivElement | null>(null);
  const effectsAppRef = useRef<Application | null>(null);
  const effectsLayerRef = useRef<Container | null>(null);
  const stateRef = useRef(state);
  const effectsRef = useRef<RuntimeEffect[]>([]);
  const damageSnapshotRef = useRef<DamageSnapshot | null>(null);
  const lastAttackFxKeyRef = useRef<string | null>(null);
  const lastCardFxIdRef = useRef<string | null>(null);
  const effectSerialRef = useRef(0);

  function nextEffectId(prefix: string): string {
    effectSerialRef.current += 1;
    return `${prefix}_${effectSerialRef.current}`;
  }

  function addEffect(effect: RuntimeEffect): void {
    const layer = effectsLayerRef.current;
    if (!layer) return;

    effectsRef.current.push(effect);
    layer.addChild(effect.root);
  }

  function getCurrentLayout(): BattlefieldLayout | null {
    const app = effectsAppRef.current;
    if (!app) return null;
    return buildLayout(app.renderer.width, app.renderer.height);
  }

  function resolvePoint(id: string, fallback: Point): Point {
    return readDomEntityPoint(id, effectsHostRef.current, effectsAppRef.current) ?? fallback;
  }

  function resolveEntityPoint(id: string, layout: BattlefieldLayout): Point | null {
    const domPoint = readDomEntityPoint(id, effectsHostRef.current, effectsAppRef.current);
    if (domPoint) return domPoint;

    return getEntityPoint(stateRef.current, layout, id);
  }

  function refreshDamageSnapshot(): void {
    const layout = getCurrentLayout();
    if (!layout) return;
    damageSnapshotRef.current = buildDamageSnapshot(stateRef.current, layout, resolvePoint);
  }

  function syncDamageNumbers(layout: BattlefieldLayout): void {
    const previous = damageSnapshotRef.current;
    if (!previous) {
      damageSnapshotRef.current = buildDamageSnapshot(stateRef.current, layout, resolvePoint);
      return;
    }

    const next = buildDamageSnapshot(stateRef.current, layout, resolvePoint);

    for (const ownerId of ["P1", "P2"] as const) {
      const before = previous.heroes[ownerId];
      const after = next.heroes[ownerId];
      if (after < before) {
        const point = resolvePoint(`${ownerId}_hero`, getHeroPoint(layout, `${ownerId}_hero`));
        const amount = before - after;
        addEffect(createDamageNumber(nextEffectId("damage"), point, amount));
        addEffect(createBurst(nextEffectId("hit"), point, ownerId === "P1" ? 0x66b5ff : 0xe76443, 420));
      }
    }

    for (const [minionId, before] of previous.minions) {
      const after = next.minions.get(minionId);
      if (after && after.health < before.health) {
        const amount = before.health - after.health;
        addEffect(createDamageNumber(nextEffectId("damage"), after.point, amount));
        addEffect(createBurst(nextEffectId("hit"), after.point, effectColorForOwner(after.ownerId), 420));
      } else if (!after && before.health > 0) {
        addEffect(createDamageNumber(nextEffectId("damage"), before.point, before.health));
        addEffect(createBurst(nextEffectId("hit"), before.point, effectColorForOwner(before.ownerId), 520));
      }
    }

    damageSnapshotRef.current = next;
  }

  function syncAttackFx(layout: BattlefieldLayout): void {
    const key = attackFx ? `${attackFx.attackerId}:${attackFx.targetId}:${attackFx.targetType}` : null;
    if (!key) {
      lastAttackFxKeyRef.current = null;
      return;
    }
    if (lastAttackFxKeyRef.current === key) return;

    const from = resolveEntityPoint(attackFx.attackerId, layout);
    const to = resolveEntityPoint(attackFx.targetId, layout);
    if (!from || !to) return;

    const attackerOwner = findMinionOwner(stateRef.current, attackFx.attackerId);
    addEffect(createAttackTrail(nextEffectId("attack"), from, to, effectColorForOwner(attackerOwner)));
    lastAttackFxKeyRef.current = key;
  }

  function syncCardFx(layout: BattlefieldLayout): void {
    if (!cardFx) {
      lastCardFxIdRef.current = null;
      return;
    }
    if (lastCardFxIdRef.current === cardFx.id) return;

    const ownerColor = effectColorForOwner(cardFx.ownerId);
    const point = cardFx.targetId
      ? resolveEntityPoint(cardFx.targetId, layout) ?? getOwnerFocusPoint(layout, cardFx.ownerId)
      : getOwnerFocusPoint(layout, cardFx.ownerId);

    if (cardFx.kind === "summonMinion") {
      addEffect(createSummonEffect(nextEffectId("summon"), point, ownerColor));
    } else if (cardFx.kind === "placePersistent" || cardFx.kind === "placeTrap") {
      addEffect(createBurst(nextEffectId("place"), point, cardFx.kind === "placeTrap" ? 0xa965b5 : 0xc69229, 680));
    } else {
      const opponentId = cardFx.ownerId === "P1" ? "P2" : "P1";
      const sourcePoint = resolvePoint(`${cardFx.ownerId}_hero`, getOwnerFocusPoint(layout, cardFx.ownerId));
      const opponentPoint = resolvePoint(`${opponentId}_hero`, getOwnerFocusPoint(layout, opponentId));
      addEffect(createAttackTrail(nextEffectId("spell"), sourcePoint, opponentPoint, ownerColor));
      addEffect(createBurst(nextEffectId("spellburst"), opponentPoint, cardFx.kind === "trapTrigger" ? 0xa965b5 : 0x66b5ff, 560));
    }

    lastCardFxIdRef.current = cardFx.id;
  }

  function syncVisualState(): void {
    const layout = getCurrentLayout();
    if (!layout) return;

    syncDamageNumbers(layout);
    syncAttackFx(layout);
    syncCardFx(layout);
  }

  useEffect(() => {
    const effectsHost = effectsHostRef.current;
    if (!effectsHost) return;

    let disposed = false;

    const tick = (ticker: Ticker) => {
      const deltaMs = ticker.deltaMS;
      const activeEffects = effectsRef.current;

      for (let index = activeEffects.length - 1; index >= 0; index -= 1) {
        const effect = activeEffects[index];
        effect.elapsed += deltaMs;
        const progress = clamp(effect.elapsed / effect.duration, 0, 1);
        effect.update(progress);

        if (progress >= 1) {
          effect.root.parent?.removeChild(effect.root);
          effect.root.destroy({ children: true });
          activeEffects.splice(index, 1);
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      refreshDamageSnapshot();
    });
    resizeObserver.observe(effectsHost);

    async function createPixiApp(host: HTMLDivElement): Promise<Application | null> {
      const nextApp = new Application();
      await nextApp.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true
      });

      if (disposed) {
        nextApp.destroy();
        return null;
      }

      host.appendChild(nextApp.canvas);
      return nextApp;
    }

    async function mountPixi() {
      const effectsApp = await createPixiApp(effectsHost);
      if (!effectsApp || disposed) {
        effectsApp?.destroy();
        return;
      }

      effectsAppRef.current = effectsApp;

      const effectsLayer = new Container();
      effectsLayer.label = "battlefield-effects";
      effectsApp.stage.addChild(effectsLayer);
      effectsLayerRef.current = effectsLayer;

      effectsApp.ticker.add(tick);
      refreshDamageSnapshot();
      syncVisualState();
    }

    void mountPixi();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      const effectsApp = effectsAppRef.current;
      effectsApp?.ticker.remove(tick);
      for (const effect of effectsRef.current) {
        effect.root.destroy({ children: true });
      }
      effectsRef.current = [];
      effectsLayerRef.current = null;
      effectsApp?.destroy();
      effectsAppRef.current = null;
      effectsHost.replaceChildren();
    };
  }, []);

  useEffect(() => {
    stateRef.current = state;
    syncVisualState();
  });

  return (
    <div className="pixi-battlefield-host pixi-battlefield-effects" ref={effectsHostRef} aria-hidden="true" />
  );
}
