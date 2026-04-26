import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { getCardDefinition } from "../../data/cards.js";
import { getAdvantageBreakdown } from "../../engine/rules.js";
import type { CardFxState, GameStore } from "../../store/useGameStore.js";
import type {
  AdvantageBreakdown,
  BuffTarget,
  DestroyTarget,
  DiscardTarget,
  Effect,
  EffectAction,
  GamePhase,
  GameState,
  LastAdvantage,
  PendingChoice,
  RuntimeCard,
  SlotType
} from "../../types.js";
import { HandCard, MinionCard, PersistentCard, type CardDetailInfo, type InspectPoint } from "./CardView.js";
import { PlayerHUD } from "./PlayerHUDView.js";

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}`;
}

const KEYWORD_LABELS: Record<string, string> = {
  rush: "冲锋",
  guard: "护卫",
  menace: "威慑",
  magicRes: "魔抗",
  stealth: "潜行",
  doubleStrike: "连击",
  lifesteal: "吸血",
  deadly: "必杀",
  regeneration: "回复",
  slotSeal: "封槽",
  sideboardFinisher: "大地",
  ignoreGuard: "破卫"
};

const TRIGGER_LABELS: Record<string, string> = {
  onPlay: "打出时",
  onDeath: "死亡时",
  onTurnStart: "回合开始",
  onTriggerMet: "条件触发",
  onAttacked: "被攻击时"
};

const PHASE_LABELS: Record<GamePhase, string> = {
  setup: "准备",
  mulligan: "换牌",
  turnStart: "回合开始",
  slotResolution: "槽位结算",
  draw: "抽牌",
  mainTurn: "主要行动",
  combat: "战斗",
  turnEnd: "回合结束",
  gameOver: "对局结束"
};

const SLOT_LABELS: Record<SlotType, string> = {
  jump: "跳跃槽",
  godDraw: "神抽槽"
};

const DAMAGE_TARGET_LABELS: Record<string, string> = {
  enemyHero: "敌方英雄",
  selfHero: "我方英雄",
  allEnemyMinions: "所有敌方随从",
  allFriendlyMinions: "所有我方随从",
  strongestEnemyMinion: "攻击最高的敌方随从",
  weakestEnemyMinion: "生命最低的敌方随从",
  triggeredMinion: "触发该效果的随从"
};

const PLAYER_TARGET_LABELS: Record<DiscardTarget | "self" | "opponent" | "all" | "enemy", string> = {
  self: "自己",
  opponent: "对手",
  all: "双方",
  enemy: "敌方"
};

const CONDITION_LABELS: Record<string, string> = {
  enemyCastsSpell: "敌方施放法术",
  enemySummonsMinion: "敌方召唤随从",
  enemyManaEquals: "敌方法力达到指定值"
};

function getPhaseLabel(phase: GamePhase): string {
  return PHASE_LABELS[phase] ?? phase;
}

function formatCardName(cardId: string): string {
  try {
    return getCardDefinition(cardId).name;
  } catch {
    return cardId;
  }
}

function formatTarget(target: string): string {
  return DAMAGE_TARGET_LABELS[target] ?? PLAYER_TARGET_LABELS[target as keyof typeof PLAYER_TARGET_LABELS] ?? target;
}

function formatSlot(slot: SlotType): string {
  return SLOT_LABELS[slot] ?? slot;
}

function formatMode(mode?: string): string {
  if (!mode) return "";
  const modeLabel: Record<string, string> = {
    last: "最后一张",
    random: "随机",
    highestCost: "费用最高"
  };
  return `（${modeLabel[mode] ?? mode}）`;
}

function formatBuffTarget(target: BuffTarget): string {
  const labels: Record<BuffTarget, string> = {
    allFriendlyMinions: "所有我方随从",
    allFriendlyMinionsExceptSource: "除自己外的我方随从",
    triggeredMinion: "触发该效果的随从"
  };
  return labels[target] ?? target;
}

function formatDestroyTarget(target: DestroyTarget): string {
  const labels: Record<DestroyTarget, string> = {
    strongestEnemyMinion: "攻击最高的敌方随从",
    weakestEnemyMinion: "生命最低的敌方随从"
  };
  return labels[target] ?? target;
}

function formatAction(action: EffectAction): string {
  switch (action.type) {
    case "damage":
      return `对${formatTarget(action.target)}造成 ${action.amount} 点伤害`;
    case "heal":
      return `治疗${formatTarget(action.target)} ${action.amount} 点生命`;
    case "draw":
      return `抽 ${action.count} 张牌`;
    case "summon":
      return `召唤 ${action.count ?? 1} 个 ${formatCardName(action.cardId)}`;
    case "buff": {
      const atk = action.atk ? `攻 ${formatSigned(action.atk)}` : "";
      const hp = action.hp ? `血 ${formatSigned(action.hp)}` : "";
      return `强化${formatBuffTarget(action.target)} ${[atk, hp].filter(Boolean).join(" / ")}`;
    }
    case "destroy":
      return `消灭${formatDestroyTarget(action.target)}`;
    case "addSlot":
      return `${formatSlot(action.slot)} ${formatSigned(action.amount)}`;
    case "discard":
      return `${formatTarget(action.target)}弃掉 ${action.count} 张牌${formatMode(action.mode)}`;
    case "discardWithEmptyHandDamage":
      return `对手弃掉 ${action.count} 张牌${formatMode(action.mode)}；手牌不足时造成 ${action.damageIfOne}/${action.damageIfZero} 点伤害`;
    case "setTopDeck":
      return `将 ${formatCardName(action.cardId)} 置于牌库顶`;
    case "discountNextDraw":
      return `下一张抽到的牌费用 -${action.amount}`;
    case "addCardToHand":
      return `加入 ${action.count ?? 1} 张 ${formatCardName(action.cardId)} 到手牌`;
    case "gainMana": {
      const later = action.amountIfTurnAtLeast
        ? `；第 ${action.amountIfTurnAtLeast.turn} 回合后改为 ${action.amountIfTurnAtLeast.amount} 点`
        : "";
      return `获得 ${action.amount} 点法力${later}`;
    }
    case "reduceMana":
      return `${formatTarget(action.target)}减少 ${action.amount} 点法力`;
    case "setIgnoreGuard":
      return action.enabled === false ? "取消无视护卫" : "本回合无视护卫";
    case "applyOpponentNextTurnManaPenalty":
      return `对手下回合法力 -${action.amount}`;
    case "applyOpponentNextTurnManaMultiplier":
      return `对手下回合法力变为 ${action.multiplier} 倍`;
    case "millDeck":
      return `${formatTarget(action.target)}磨掉 ${action.count} 张牌`;
    case "millDeckUntilRemaining": {
      const limit = action.onlyIfAbove ? `，牌库高于 ${action.onlyIfAbove} 张时` : "";
      const max = action.maxCount ? `，最多 ${action.maxCount} 张` : "";
      return `${formatTarget(action.target)}把牌库磨到剩 ${action.remaining} 张${limit}${max}`;
    }
    case "grantAdjacentGuard":
      return "相邻友方获得护卫";
    case "buffSelfIfHeroHpBelow":
      return `英雄血量低于 ${action.threshold} 时自我强化`;
    case "setMillOnDamageTaken":
      return `受到伤害时磨掉 ${action.amount} 张牌`;
    case "exilePriorityEnemyMinionAndDamageHero":
      return action.damageHeroBy === "attackAndHealth" ? "除外关键敌方随从，并按攻血合计伤害英雄" : "除外关键敌方随从，并按生命值伤害英雄";
    case "grantExtraTurn":
      return action.loseIfNoWin
        ? `获得额外回合；若额外回合未取胜则失败，法力为 ${action.extraTurnMana ?? 0}`
        : "获得额外回合";
    case "purgeAllMagicAndOtherMinions":
      return action.healPerRemoved ? `清除所有魔法与其他随从，每清除 1 个治疗 ${action.healPerRemoved}` : "清除所有魔法与其他随从";
    case "swapHeroHp":
      return "交换双方英雄生命";
    case "destroyAllMinions":
      return "消灭双方所有随从";
    case "destroyAllEnemyMinions":
      return "消灭所有敌方随从";
    case "destroyPersistents":
      return `破坏${formatTarget(action.target)}持续物`;
    case "destroyEnemyTraps":
      return "破坏敌方所有盖伏陷阱";
  }
}

function formatEffect(effect: Effect): string {
  const trigger = TRIGGER_LABELS[effect.trigger] ?? effect.trigger;
  const condition = effect.condition
    ? ` / 条件：${CONDITION_LABELS[effect.condition.type] ?? effect.condition.type}${
        effect.condition.mana !== undefined ? ` ${effect.condition.mana}` : ""
      }`
    : "";
  return `${trigger}${condition}：${formatAction(effect.action)}`;
}

function isPlayableFromHand(card: RuntimeCard, state: GameState, player: GameState["players"]["P1"]): boolean {
  if (state.currentPlayer !== "P1" || state.phase !== "mainTurn" || state.winner || state.pendingChoice) return false;
  if (player.mana < card.currentCost) return false;
  if (card.type === "minion" && player.board.length >= 7) return false;

  const minTurn = card.playRestrictions?.minTurn;
  if (minTurn !== undefined && state.turn < minTurn) return false;

  return true;
}

function getHandCardDisabledReason(
  card: RuntimeCard,
  state: GameState,
  player: GameState["players"]["P1"],
  isAttackAnimating: boolean
): string | null {
  if (state.winner) return "对局已结束";
  if (isAttackAnimating) return "攻击结算中";
  if (state.pendingChoice) return "请先完成弹窗选择";
  if (state.currentPlayer !== "P1") return "等待 AI 行动";
  if (state.phase !== "mainTurn") return `${getPhaseLabel(state.phase)}阶段暂不能出牌`;

  const minTurn = card.playRestrictions?.minTurn;
  if (minTurn !== undefined && state.turn < minTurn) return `第 ${minTurn} 回合后可用`;
  if (card.type === "minion" && player.board.length >= 7) return "战场已满";
  if (player.mana < card.currentCost) return `费用不足，还差 ${card.currentCost - player.mana}`;

  return null;
}

function getActionHint(
  state: GameState,
  player: GameState["players"]["P1"],
  selectedAttackerId: string | null,
  isAttackAnimating: boolean
): { title: string; detail: string; tone: "ready" | "wait" | "choice" | "done" } {
  if (state.winner) {
    return {
      title: state.winner === "P1" ? "胜利达成" : "对局结束",
      detail: "可以重新开始，再试一套角色、天赋或卡组节奏。",
      tone: "done"
    };
  }

  if (state.pendingChoice) {
    return {
      title: "先处理选择",
      detail: "屏幕中央有一个待选择效果，确认后对局会继续。",
      tone: "choice"
    };
  }

  if (isAttackAnimating) {
    return {
      title: "正在结算攻击",
      detail: "伤害会跟随动画完成，稍等一下即可继续操作。",
      tone: "wait"
    };
  }

  if (state.currentPlayer !== "P1") {
    return {
      title: "等待 AI 行动",
      detail: "AI 正在思考并出牌，轮到你时手牌会恢复可操作状态。",
      tone: "wait"
    };
  }

  if (selectedAttackerId) {
    return {
      title: "选择攻击目标",
      detail: "请选择一个合法目标完成攻击。",
      tone: "choice"
    };
  }

  const readyAttackers = player.board.filter((minion) => minion.canAttack).length;
  const playableCards = player.hand.filter((card) => isPlayableFromHand(card, state, player)).length;

  if (state.phase === "mainTurn") {
    if (playableCards && readyAttackers) {
      return {
        title: "可以出牌或攻击",
        detail: `你有 ${playableCards} 张手牌可打出，另有 ${readyAttackers} 个随从可以攻击。`,
        tone: "ready"
      };
    }
    if (playableCards) {
      return {
        title: "可以出牌",
        detail: `当前有 ${playableCards} 张手牌费用足够，打出后再观察战场变化。`,
        tone: "ready"
      };
    }
    if (readyAttackers) {
      return {
        title: "可以攻击",
        detail: `当前有 ${readyAttackers} 个随从可以行动，也可以直接结束回合保留节奏。`,
        tone: "ready"
      };
    }
    return {
      title: "可以结束回合",
      detail: "现在没有可用手牌或可攻击随从，结束回合会进入结算。",
      tone: "wait"
    };
  }

  if (state.phase === "combat") {
    return readyAttackers
      ? {
          title: "战斗阶段",
          detail: `还有 ${readyAttackers} 个随从可以攻击。`,
          tone: "ready"
        }
      : {
          title: "战斗已无可动随从",
          detail: "可以结束回合，让槽位和回合效果继续结算。",
          tone: "wait"
        };
  }

  return {
    title: getPhaseLabel(state.phase),
    detail: "当前阶段会自动推进，稍等片刻就会回到可操作时机。",
    tone: "wait"
  };
}

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
      return "召唤随从";
    case "placePersistent":
      return "放置持续物";
    case "placeTrap":
      return "设置陷阱";
    case "spellCast":
      return "施放法术";
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
      return `${ownerLabel} 埋下了 ${fx.cardName}`;
    case "spellCast":
      return `${ownerLabel} 使用了 ${fx.cardName}`;
    case "trapTrigger":
      return `${ownerLabel} 的 ${fx.cardName} 被触发`;
  }
}

function EffectLayer({ fx }: { fx: CardFxState | null }) {
  if (!fx) return null;

  return (
    <div className="effect-layer" aria-live="polite">
      <div className={classNames("effect-banner", getEffectTone(fx.kind), fx.ownerId === "P1" ? "player" : "enemy")}>
        <div className="effect-banner-mark" aria-hidden="true" />
        <div className="effect-banner-copy">
          <span className="effect-banner-title">{getEffectTitle(fx.kind)}</span>
          <strong className="effect-banner-name">{fx.cardName}</strong>
          <span className="effect-banner-detail">{getEffectDescription(fx)}</span>
        </div>
      </div>
    </div>
  );
}

function CardDetailTooltip({ detail }: { detail: { info: CardDetailInfo; point: InspectPoint } | null }) {
  if (!detail || typeof document === "undefined") return null;

  const tooltipWidth = 340;
  const tooltipHeight = 430;
  const margin = 14;
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 720 : window.innerHeight;
  const left = Math.max(margin, Math.min(detail.point.x + 18, viewportWidth - tooltipWidth - margin));
  const top = Math.max(margin, Math.min(detail.point.y + 18, viewportHeight - tooltipHeight - margin));
  const info = detail.info;
  const hasStats = info.attack !== undefined || info.health !== undefined || info.threat !== undefined;
  const costText =
    info.currentCost !== undefined
      ? info.baseCost !== undefined && info.currentCost !== info.baseCost
        ? `${info.currentCost} (${info.baseCost})`
        : `${info.currentCost}`
      : info.cost !== undefined
        ? `${info.cost}`
        : "-";

  return createPortal(
    <aside className="card-detail-tooltip" style={{ left, top }} role="tooltip">
      <div className="card-detail-header">
        <div>
          <div className="card-detail-title">{info.name}</div>
          <div className="card-detail-type">{info.type}</div>
        </div>
        <div className="card-detail-cost">{costText}</div>
      </div>

      {info.tags?.length ? (
        <div className="card-detail-keywords">
          {info.tags.map((tag) => (
            <span key={tag} className="keyword-badge">
              {KEYWORD_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      ) : null}

      {hasStats ? (
        <div className="card-detail-stats">
          {info.attack !== undefined ? <span>攻 {info.attack}</span> : null}
          {info.health !== undefined ? <span>血 {info.maxHealth !== undefined ? `${info.health}/${info.maxHealth}` : info.health}</span> : null}
          {info.threat !== undefined ? <span>威胁 {info.threat}</span> : null}
        </div>
      ) : null}

      <p className="card-detail-description">{info.description}</p>

      {info.effects?.length ? (
        <div className="card-detail-effects">
          <strong>效果</strong>
          {info.effects.map((effect, index) => (
            <p key={`${effect.trigger}_${index}`}>{formatEffect(effect)}</p>
          ))}
        </div>
      ) : null}

      {info.flavor ? <p className="card-detail-flavor">{info.flavor}</p> : null}
      {info.status ? <div className="card-detail-status">{info.status}</div> : null}
    </aside>,
    document.body
  );
}

function MomentumRow({ label, value, extraClass = "" }: { label: string; value: number; extraClass?: string }) {
  return (
    <div className={classNames("momentum-row", extraClass)}>
      <span className="momentum-label">{label}</span>
      <strong className="momentum-value">{formatSigned(value)}</strong>
    </div>
  );
}

function MomentumSide({
  title,
  breakdown,
  tone
}: {
  title: string;
  breakdown: AdvantageBreakdown;
  tone: "player" | "enemy";
}) {
  const detailText = breakdown.details.length ? breakdown.details.join(" / ") : "暂无特殊修正";

  return (
    <section className={classNames("momentum-side", tone)}>
      <div className="flex-between">
        <div>
          <h3 className="momentum-side-title">{title}</h3>
          <p className="small-note">当前总势能 {formatSigned(breakdown.total)}</p>
        </div>
        <span className={classNames("pill momentum-total", tone)}>{formatSigned(breakdown.total)}</span>
      </div>
      <div className="momentum-rows">
        <MomentumRow label="手牌分" value={breakdown.handScore} />
        <MomentumRow label="血量分" value={breakdown.hpScore} />
        <MomentumRow label="威胁分" value={breakdown.threatScore} />
        <MomentumRow label="特殊分" value={breakdown.specialScore} />
        <MomentumRow label="总势能" value={breakdown.total} extraClass="total" />
      </div>
      <p className="small-note momentum-detail">特殊明细：{detailText}</p>
    </section>
  );
}

function LastSettlement({ lastAdvantage }: { lastAdvantage: LastAdvantage | null }) {
  if (!lastAdvantage) return null;

  const breakdown = lastAdvantage.p1Breakdown;
  const summary = [
    `手牌 ${formatSigned(breakdown.handScore)}`,
    `血量 ${formatSigned(breakdown.hpScore)}`,
    `威胁 ${formatSigned(breakdown.threatScore)}`,
    `特殊 ${formatSigned(breakdown.specialScore)}`
  ].join(" / ");

  return (
    <div className="momentum-settlement">
      <div className="flex-between">
        <span className="small-note">上次结算</span>
        <span className="pill momentum-settlement-pill">
          V = {formatSigned(lastAdvantage.value)} / 槽位新增 {lastAdvantage.gain}
        </span>
      </div>
      <p className="small-note">{summary}</p>
    </div>
  );
}

function MomentumPanel({
  playerBreakdown,
  enemyBreakdown,
  lastAdvantage
}: {
  playerBreakdown: AdvantageBreakdown;
  enemyBreakdown: AdvantageBreakdown;
  lastAdvantage: LastAdvantage | null;
}) {
  const currentValue = playerBreakdown.total;
  const toneClass = currentValue > 0 ? "player" : currentValue < 0 ? "enemy" : "neutral";
  const outlook =
    currentValue > 0
      ? "当前玩家势能更高，回合结算时更容易获得跳跃槽。"
      : currentValue < 0
        ? "当前 AI 势能更高，回合结算时玩家更容易获得神抽槽补偿。"
        : "双方势能接近，结算会保持相对中性。";

  return (
    <div className="sidebar-card momentum-panel">
      <div className="flex-between momentum-header">
        <div>
          <h2 className="section-title">势能面板</h2>
        </div>
        <span className={classNames("pill momentum-pill", toneClass)}>当前 V {formatSigned(currentValue)}</span>
      </div>
      <div className="momentum-grid">
        <MomentumSide title="玩家" breakdown={playerBreakdown} tone="player" />
        <MomentumSide title="AI" breakdown={enemyBreakdown} tone="enemy" />
      </div>
      <p className="small-note momentum-outlook">{outlook}</p>
      <LastSettlement lastAdvantage={lastAdvantage} />
    </div>
  );
}

function BattleLogPanel({ state }: { state: GameState }) {
  return (
    <section className="log-card battle-log-panel">
      <div className="flex-between battle-log-header">
        <h2 className="section-title">战斗日志</h2>
        <span className="small-note">回合 {state.turn}</span>
      </div>
      <div className="log-list">
        {state.actionLog.map((item) => (
          <div key={item.id} className="log-item">
            {item.message}
          </div>
        ))}
      </div>
    </section>
  );
}

function FieldCounts({ persistents, traps }: { persistents: number; traps: number }) {
  return (
    <div className="field-counts" aria-label={`持续物 ${persistents} 张，盖伏 ${traps} 张`}>
      <span className="field-count-badge persistent">持续 {persistents}</span>
      <span className={classNames("field-count-badge trap", traps > 0 && "active")}>盖伏 {traps}</span>
    </div>
  );
}

function PendingChoiceModal({
  choice,
  onUse,
  onSkip,
  onPickCard
}: {
  choice: PendingChoice | null;
  onUse: () => void;
  onSkip: () => void;
  onPickCard: (cardId: string) => void;
}) {
  if (!choice) return null;

  if (choice.type === "optionalJump") {
    return (
      <div className="modal-backdrop">
        <div className="modal-card">
          <h3>{choice.title}</h3>
          <p>{choice.description}</p>
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onUse}>
              使用
            </button>
            <button type="button" className="ghost-btn" onClick={onSkip}>
              跳过
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (choice.type === "optionalGodDraw" || choice.type === "ultimateGodDraw") {
    return (
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="flex-between">
            <h3>{choice.title}</h3>
            {choice.type === "optionalGodDraw" ? (
              <button type="button" className="ghost-btn" onClick={onSkip}>
                跳过
              </button>
            ) : null}
          </div>
          <p className="small-note">{choice.description ?? "请选择一张卡。"}</p>
          <div className="deck-choice-grid">
            {choice.choices.length ? (
              choice.choices.map((entry) => {
                const definition = getCardDefinition(entry.cardId);
                return (
                  <button
                    key={entry.cardId}
                    type="button"
                    className="option-card"
                    onClick={() => onPickCard(entry.cardId)}
                  >
                    <h4>{definition.name}</h4>
                    <p>{definition.description}</p>
                    <p>
                      <strong>费用：</strong>
                      {definition.cost}
                    </p>
                    <p>剩余数量：{entry.count}</p>
                  </button>
                );
              })
            ) : (
              <p className="empty-text">当前没有可选择的卡。</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function GameOverModal({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  if (!state.winner) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>{state.winner === "P1" ? "你赢得了胜利" : "AI 赢得了胜利"}</h3>
        <p className="small-note">可以重新开始一局，继续验证新的角色、天赋与卡组平衡。</p>
        <div className="modal-actions">
          <button type="button" className="primary-btn" onClick={onRestart}>
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReactBattleBoard({
  store,
  state,
  onChange
}: {
  store: GameStore;
  state: GameState;
  onChange: () => void;
}) {
  const [cardDetail, setCardDetail] = useState<{ info: CardDetailInfo; point: InspectPoint } | null>(null);
  const player = state.players.P1;
  const enemy = state.players.P2;
  const attackFx = store.uiState.attackFx;
  const cardFx = store.uiState.cardFx;
  const isAttackAnimating = Boolean(attackFx);
  const targetSet = isAttackAnimating ? new Set<string>() : store.buildTargetSet();
  const canPlayCards =
    state.currentPlayer === "P1" && state.phase === "mainTurn" && !state.winner && !state.pendingChoice && !isAttackAnimating;
  const canControlBattle =
    state.currentPlayer === "P1" && (state.phase === "mainTurn" || state.phase === "combat") && !state.winner && !isAttackAnimating;
  const canEndTurn = canControlBattle && !state.pendingChoice;
  const legalHeroTarget = targetSet.has("P2_hero");
  const playerMomentum = getAdvantageBreakdown(player, enemy);
  const enemyMomentum = getAdvantageBreakdown(enemy, player);
  const enemyBoardZoneClass = cardFx?.kind === "summonMinion" && cardFx.ownerId === "P2" ? "zone-fx summon" : "";
  const playerBoardZoneClass = cardFx?.kind === "summonMinion" && cardFx.ownerId === "P1" ? "zone-fx summon" : "";
  const enemyPersistentRowClass = cardFx?.kind === "placePersistent" && cardFx.ownerId === "P2" ? "row-fx persistent" : "";
  const playerPersistentRowClass = cardFx?.kind === "placePersistent" && cardFx.ownerId === "P1" ? "row-fx persistent" : "";
  const playerTrapRowClass =
    cardFx && cardFx.ownerId === "P1" && (cardFx.kind === "placeTrap" || cardFx.kind === "trapTrigger") ? "row-fx trap" : "";
  const enemyZoneMetaClass =
    cardFx && cardFx.ownerId === "P2" && (cardFx.kind === "placeTrap" || cardFx.kind === "trapTrigger") ? "zone-fx trap" : "";
  const attackStatus = isAttackAnimating ? "攻击演出中" : store.uiState.selectedAttackerId ? "已选择随从" : "未选择";
  const phaseLabel = getPhaseLabel(state.phase);
  const actionHint = getActionHint(state, player, store.uiState.selectedAttackerId, isAttackAnimating);
  const statusText = state.winner
    ? state.winner === "P1"
      ? "你已经赢得胜利。"
      : "AI 已经赢得胜利。"
    : isAttackAnimating
      ? "攻击特效播放中，伤害会在动画中结算。"
      : state.currentPlayer === "P1"
        ? `当前由你行动，阶段：${phaseLabel}。`
        : `当前由 AI 行动，阶段：${phaseLabel}。`;

  const showCardDetail = useCallback((info: CardDetailInfo, point: InspectPoint): void => {
    setCardDetail({ info, point });
  }, []);

  const clearCardDetail = useCallback((): void => {
    setCardDetail(null);
  }, []);

  function restart(): void {
    store.restart();
    clearCardDetail();
    onChange();
  }

  function playCard(runtimeId: string): void {
    clearCardDetail();
    if (store.playCard(runtimeId)) {
      onChange();
    }
  }

  function selectAttacker(minionId: string): void {
    if (!canControlBattle) return;
    clearCardDetail();
    store.toggleAttacker(minionId);
    onChange();
  }

  function attackMinion(minionId: string): void {
    if (!targetSet.has(minionId)) return;
    clearCardDetail();
    if (store.attackMinion(minionId, onChange)) {
      onChange();
    }
  }

  function attackHero(heroId: string): void {
    if (!targetSet.has(heroId)) return;
    clearCardDetail();
    if (store.attackHero(heroId, onChange)) {
      onChange();
    }
  }

  function cancelAttacker(): void {
    clearCardDetail();
    store.cancelAttacker();
    onChange();
  }

  function endTurn(): void {
    if (!canEndTurn) return;
    clearCardDetail();
    if (store.endTurn()) {
      onChange();
    }
  }

  function resolvePendingUse(cardId?: string): void {
    clearCardDetail();
    store.resolvePendingChoice({ action: "use", cardId: cardId ?? null });
    onChange();
  }

  function resolvePendingSkip(): void {
    clearCardDetail();
    store.resolvePendingChoice({ action: "skip" });
    onChange();
  }

  return (
    <div className="app-shell game-shell">
      <section className="hero game-hero">
        <div className="hero-copy">
          <h1>Shin Doro 对局中</h1>
          <p>{statusText}</p>
        </div>
        <div className="hero-stats battle-hero-stats">
          <div className="pill">
            <strong>回合数</strong>
            <br />
            {state.turn}
          </div>
          <div className="pill">
            <strong>当前行动方</strong>
            <br />
            {state.currentPlayer === "P1" ? "玩家" : "AI"}
          </div>
          <div className="pill">
            <strong>阶段</strong>
            <br />
            {phaseLabel}
          </div>
          <div className="pill">
            <strong>攻击选择</strong>
            <br />
            {attackStatus}
          </div>
        </div>
        <div className={classNames("action-hint", actionHint.tone)} aria-live="polite">
          <span className="action-hint-label">当前建议</span>
          <strong>{actionHint.title}</strong>
          <p>{actionHint.detail}</p>
        </div>
      </section>

      <section className="board-shell">
        <EffectLayer fx={cardFx} />
        <div className="battle-layout">
          <div className="battle-main">
            <section className="battlefield-half enemy-half">
              <PlayerHUD
                player={enemy}
                character={store.getCharacter(enemy.character)}
                ownership="enemy"
                targetableHero={legalHeroTarget}
                pixiEntityId="P2_hero"
                onAttackHero={() => attackHero("P2_hero")}
              />

              <section className={classNames("zone field-zone", enemyBoardZoneClass, enemyZoneMetaClass)}>
                <div className="zone-header">
                  <h2 className="section-title">敌方战场</h2>
                  <FieldCounts persistents={enemy.persistents.length} traps={enemy.traps.length} />
                </div>
                <div className="zone-stack">
                  <div className={classNames("persistent-row zone-lane", enemyPersistentRowClass)}>
                    {enemy.persistents.length ? (
                      enemy.persistents.map((card) => (
                        <PersistentCard
                          key={card.instanceId}
                          card={card}
                          pixiEntityId={card.instanceId}
                          cardTone="persistent"
                          onInspect={showCardDetail}
                          onClearInspect={clearCardDetail}
                        />
                      ))
                    ) : (
                      <p className="empty-text">敌方暂无持续物，当前不会有额外场地效果。</p>
                    )}
                  </div>
                  <div className="minion-row zone-lane">
                    {enemy.board.length ? (
                      enemy.board.map((minion) => (
                        <MinionCard
                          key={minion.instanceId}
                          minion={minion}
                          ownership="enemy"
                          selectedAttackerId={store.uiState.selectedAttackerId}
                          targetable={targetSet.has(minion.instanceId)}
                          pixiEntityId={minion.instanceId}
                          onInspect={showCardDetail}
                          onClearInspect={clearCardDetail}
                          onClick={attackMinion}
                        />
                      ))
                    ) : (
                      <p className="empty-text">敌方暂无随从，可以留意是否能直接进攻英雄。</p>
                    )}
                  </div>
                </div>
              </section>
            </section>

            <section className="battlefield-half player-half">
              <section className={classNames("zone field-zone", playerBoardZoneClass)}>
                <div className="zone-header">
                  <h2 className="section-title">你的战场</h2>
                  <FieldCounts persistents={player.persistents.length} traps={player.traps.length} />
                </div>
                <div className="zone-stack zone-stack-player">
                  <div className={classNames("persistent-row zone-lane", playerPersistentRowClass)}>
                    {player.persistents.length ? (
                      player.persistents.map((card) => (
                        <PersistentCard
                          key={card.instanceId}
                          card={card}
                          pixiEntityId={card.instanceId}
                          cardTone="persistent"
                          onInspect={showCardDetail}
                          onClearInspect={clearCardDetail}
                        />
                      ))
                    ) : (
                      <p className="empty-text">你暂无持续物；打出持续物后会在这里显示。</p>
                    )}
                  </div>
                  <div className={classNames("persistent-row zone-lane", playerTrapRowClass)}>
                    {player.traps.length ? (
                      player.traps.map((card) => (
                        <PersistentCard
                          key={card.instanceId}
                          card={card}
                          pixiEntityId={card.instanceId}
                          cardTone="trap"
                          onInspect={showCardDetail}
                          onClearInspect={clearCardDetail}
                        />
                      ))
                    ) : (
                      <p className="empty-text">你暂无盖伏陷阱；陷阱会在满足条件时自动触发。</p>
                    )}
                  </div>
                  <div className="minion-row zone-lane">
                    {player.board.length ? (
                      player.board.map((minion) => (
                        <MinionCard
                          key={minion.instanceId}
                          minion={minion}
                          ownership="player"
                          selectedAttackerId={store.uiState.selectedAttackerId}
                          pixiEntityId={minion.instanceId}
                          onInspect={showCardDetail}
                          onClearInspect={clearCardDetail}
                          onClick={selectAttacker}
                        />
                      ))
                    ) : (
                      <p className="empty-text">你的战场暂无随从；先打出随从建立进攻点。</p>
                    )}
                  </div>
                </div>
              </section>

              <PlayerHUD
                player={player}
                character={store.getCharacter(player.character)}
                ownership="player"
                targetableHero={false}
                pixiEntityId="P1_hero"
              />
            </section>

            <section className="zone hand-zone">
              <div className="zone-header">
                <h2 className="section-title">你的手牌</h2>
                <div className="game-toolbar">
                  <button type="button" className="ghost-btn" onClick={restart}>
                    重新开始
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    disabled={!store.uiState.selectedAttackerId || isAttackAnimating}
                    onClick={cancelAttacker}
                  >
                    取消攻击选择
                  </button>
                  <button type="button" className="primary-btn" disabled={!canEndTurn} onClick={endTurn}>
                    结束回合
                  </button>
                </div>
              </div>
              <div className="hand-row">
                {player.hand.length ? (
                  player.hand.map((card) => {
                    const disabledReason = getHandCardDisabledReason(card, state, player, isAttackAnimating);
                    return (
                      <HandCard
                        key={card.runtimeId}
                        card={card}
                        disabled={!canPlayCards || Boolean(disabledReason)}
                        disabledReason={disabledReason ?? undefined}
                        onInspect={showCardDetail}
                        onClearInspect={clearCardDetail}
                        onPlay={playCard}
                      />
                    );
                  })
                ) : (
                  <p className="empty-text">你的手牌为空；进入抽牌阶段后会补充。</p>
                )}
              </div>
            </section>
          </div>

          <aside className="sidebar">
            <MomentumPanel playerBreakdown={playerMomentum} enemyBreakdown={enemyMomentum} lastAdvantage={state.lastAdvantage} />
            <BattleLogPanel state={state} />
          </aside>
        </div>
      </section>

      <CardDetailTooltip detail={cardDetail} />
      <PendingChoiceModal
        choice={state.pendingChoice}
        onUse={() => resolvePendingUse()}
        onSkip={resolvePendingSkip}
        onPickCard={(cardId) => resolvePendingUse(cardId)}
      />
      <GameOverModal state={state} onRestart={restart} />
    </div>
  );
}
