import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { getCardDefinition } from "../../data/cards.js";
import { getAdvantageBreakdown } from "../../engine/rules.js";
import type { CardFxState, GameStore } from "../../store/useGameStore.js";
import type { AdvantageBreakdown, Effect, EffectAction, GameState, LastAdvantage, PendingChoice } from "../../types.js";
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
  magicRes: "魔抗"
};

const TRIGGER_LABELS: Record<string, string> = {
  onPlay: "打出时",
  onDeath: "死亡时",
  onTurnStart: "回合开始",
  onTriggerMet: "条件触发",
  onAttacked: "被攻击时"
};

function formatAction(action: EffectAction): string {
  switch (action.type) {
    case "damage":
      return `造成 ${action.amount} 点伤害：${action.target}`;
    case "heal":
      return `治疗 ${action.amount} 点生命：${action.target}`;
    case "draw":
      return `抽 ${action.count} 张牌`;
    case "summon":
      return `召唤 ${action.count ?? 1} 个 ${action.cardId}`;
    case "buff": {
      const atk = action.atk ? `攻 ${formatSigned(action.atk)}` : "";
      const hp = action.hp ? `血 ${formatSigned(action.hp)}` : "";
      return `强化 ${action.target} ${[atk, hp].filter(Boolean).join(" / ")}`;
    }
    case "destroy":
      return `消灭 ${action.target}`;
    case "addSlot":
      return `${action.slot} 槽 ${formatSigned(action.amount)}`;
    case "discard":
      return `${action.target} 弃 ${action.count} 张牌`;
    case "setTopDeck":
      return `将 ${action.cardId} 置于牌库顶`;
    case "discountNextDraw":
      return `下一张抽到的牌费用 -${action.amount}`;
    case "addCardToHand":
      return `加入 ${action.count ?? 1} 张 ${action.cardId} 到手牌`;
    case "gainMana":
      return `获得 ${action.amount} 点法力`;
    case "setIgnoreGuard":
      return action.enabled === false ? "取消无视护卫" : "本回合无视护卫";
    case "applyOpponentNextTurnManaPenalty":
      return `对手下回合法力 -${action.amount}`;
    case "millDeck":
      return `${action.target} 磨掉 ${action.count} 张牌`;
    case "grantAdjacentGuard":
      return "相邻友方获得护卫";
    case "buffSelfIfHeroHpBelow":
      return `英雄血量低于 ${action.threshold} 时自我强化`;
    case "setMillOnDamageTaken":
      return `受到伤害时磨掉 ${action.amount} 张牌`;
    case "exilePriorityEnemyMinionAndDamageHero":
      return `除外优先敌方随从，并按 ${action.damageHeroBy} 伤害英雄`;
  }
}

function formatEffect(effect: Effect): string {
  const trigger = TRIGGER_LABELS[effect.trigger] ?? effect.trigger;
  const condition = effect.condition ? ` / 条件：${effect.condition.type}` : "";
  return `${trigger}${condition}：${formatAction(effect.action)}`;
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
        <h2 className="section-title">Battle Log</h2>
        <span className="small-note">Turn {state.turn}</span>
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
  const canPlayCards = state.currentPlayer === "P1" && state.phase === "mainTurn" && !state.winner && !isAttackAnimating;
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
  const statusText = state.winner
    ? state.winner === "P1"
      ? "你已经赢得胜利。"
      : "AI 已经赢得胜利。"
    : isAttackAnimating
      ? "攻击特效播放中，伤害会在动画中结算。"
      : state.currentPlayer === "P1"
        ? `当前由你行动，阶段：${state.phase}。`
        : `当前由 AI 行动，阶段：${state.phase}。`;

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
            {state.phase}
          </div>
          <div className="pill">
            <strong>攻击选择</strong>
            <br />
            {attackStatus}
          </div>
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
                  <span className="small-note">
                    持续物 {enemy.persistents.length} / 陷阱 {enemy.traps.length}
                  </span>
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
                      <p className="empty-text">敌方没有持续物。</p>
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
                      <p className="empty-text">敌方战场没有随从。</p>
                    )}
                  </div>
                </div>
              </section>
            </section>

            <section className="battlefield-half player-half">
              <section className={classNames("zone field-zone", playerBoardZoneClass)}>
                <div className="zone-header">
                  <h2 className="section-title">你的战场</h2>
                  <span className="small-note">先选择可攻击随从，再指定敌方随从或英雄作为目标。</span>
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
                      <p className="empty-text">你没有持续物。</p>
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
                      <p className="empty-text">你没有陷阱。</p>
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
                      <p className="empty-text">你的战场没有随从。</p>
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
                  player.hand.map((card) => (
                    <HandCard
                      key={card.runtimeId}
                      card={card}
                      disabled={!canPlayCards || card.currentCost > player.mana}
                      onInspect={showCardDetail}
                      onClearInspect={clearCardDetail}
                      onPlay={playCard}
                    />
                  ))
                ) : (
                  <p className="empty-text">你的手牌为空。</p>
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
