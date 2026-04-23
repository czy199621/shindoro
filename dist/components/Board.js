import { getAdvantageBreakdown } from "../engine/rules.js";
import { renderHandCard, renderMinionCard, renderPersistentCard } from "./Card.js";
import { renderEffectLayer } from "./EffectLayer.js";
import { escapeHtml } from "./html.js";
import { renderMomentumPanel } from "./MomentumPanel.js";
import { renderPlayerHUD } from "./PlayerHUD.js";
import { renderGameOver, renderPendingChoice } from "./ResolutionPanel.js";
export function renderBoard(store, state) {
    const player = state.players.P1;
    const enemy = state.players.P2;
    const attackFx = store.uiState.attackFx;
    const cardFx = store.uiState.cardFx;
    const isAttackAnimating = Boolean(attackFx);
    const targetSet = isAttackAnimating ? new Set() : store.buildTargetSet();
    const canPlayCards = state.currentPlayer === "P1" && state.phase === "mainTurn" && !state.winner && !isAttackAnimating;
    const canControlBattle = state.currentPlayer === "P1" && (state.phase === "mainTurn" || state.phase === "combat") && !isAttackAnimating;
    const canEndTurn = canControlBattle && !state.winner;
    const legalHeroTarget = targetSet.has("P2_hero");
    const playerMomentum = getAdvantageBreakdown(player, enemy);
    const enemyMomentum = getAdvantageBreakdown(enemy, player);
    const enemyBoardZoneClass = cardFx?.kind === "summonMinion" && cardFx.ownerId === "P2" ? "zone-fx summon" : "";
    const playerBoardZoneClass = cardFx?.kind === "summonMinion" && cardFx.ownerId === "P1" ? "zone-fx summon" : "";
    const enemyPersistentRowClass = cardFx?.kind === "placePersistent" && cardFx.ownerId === "P2" ? "row-fx persistent" : "";
    const playerPersistentRowClass = cardFx?.kind === "placePersistent" && cardFx.ownerId === "P1" ? "row-fx persistent" : "";
    const playerTrapRowClass = cardFx && cardFx.ownerId === "P1" && (cardFx.kind === "placeTrap" || cardFx.kind === "trapTrigger") ? "row-fx trap" : "";
    const enemyZoneMetaClass = cardFx && cardFx.ownerId === "P2" && (cardFx.kind === "placeTrap" || cardFx.kind === "trapTrigger") ? "zone-fx trap" : "";
    const handCards = player.hand.length
        ? player.hand.map((card) => renderHandCard(card, !canPlayCards || card.currentCost > player.mana)).join("")
        : `<p class="empty-text">你的手牌区为空。</p>`;
    const enemyBoard = enemy.board.length
        ? enemy.board
            .map((minion) => renderMinionCard(minion, {
            ownership: "enemy",
            selectedAttackerId: store.uiState.selectedAttackerId,
            targetable: targetSet.has(minion.instanceId),
            attacking: attackFx?.attackerId === minion.instanceId,
            impactTarget: attackFx?.targetType === "minion" && attackFx.targetId === minion.instanceId,
            summoning: cardFx?.kind === "summonMinion" && cardFx.targetId === minion.instanceId
        }))
            .join("")
        : `<p class="empty-text">敌方场上暂无使魔。</p>`;
    const playerBoard = player.board.length
        ? player.board
            .map((minion) => renderMinionCard(minion, {
            ownership: "player",
            selectedAttackerId: store.uiState.selectedAttackerId,
            attacking: attackFx?.attackerId === minion.instanceId,
            impactTarget: attackFx?.targetType === "minion" && attackFx.targetId === minion.instanceId,
            summoning: cardFx?.kind === "summonMinion" && cardFx.targetId === minion.instanceId
        }))
            .join("")
        : `<p class="empty-text">你的场上暂无使魔。</p>`;
    const playerPersistents = player.persistents.length
        ? player.persistents
            .map((card) => renderPersistentCard(card, {
            placing: cardFx?.kind === "placePersistent" && cardFx.targetId === card.instanceId,
            cardTone: "persistent"
        }))
            .join("")
        : `<p class="empty-text">你没有持续物。</p>`;
    const playerTraps = player.traps.length
        ? player.traps
            .map((card) => renderPersistentCard(card, {
            placing: cardFx?.kind === "placeTrap" && cardFx.targetId === card.instanceId,
            cardTone: "trap"
        }))
            .join("")
        : `<p class="empty-text">你没有陷阱。</p>`;
    const enemyPersistents = enemy.persistents.length
        ? enemy.persistents
            .map((card) => renderPersistentCard(card, {
            placing: cardFx?.kind === "placePersistent" && cardFx.targetId === card.instanceId,
            cardTone: "persistent"
        }))
            .join("")
        : `<p class="empty-text">敌方没有持续物。</p>`;
    const attackStatus = isAttackAnimating
        ? "攻击演出中"
        : store.uiState.selectedAttackerId
            ? "已选择使魔"
            : "未选择";
    const statusText = state.winner
        ? state.winner === "P1"
            ? "你已取得胜利。"
            : "AI 获得了胜利。"
        : isAttackAnimating
            ? "攻击特效结算中，命中动画会先于伤害结算播放。"
            : state.currentPlayer === "P1"
                ? state.phase === "slotResolution"
                    ? "请选择本回合要发动的槽位能力。"
                    : `当前由你行动，阶段：${state.phase}。`
                : `当前由 AI 行动，阶段：${state.phase}。`;
    return `
    <div class="app-shell game-shell">
      <section class="hero game-hero">
        <div class="hero-copy">
          <h1>Shin Doro 对局中</h1>
          <p>${escapeHtml(statusText)}</p>
        </div>
        <div class="hero-stats battle-hero-stats">
          <div class="pill"><strong>回合数</strong><br />${state.turn}</div>
          <div class="pill"><strong>当前行动方</strong><br />${state.currentPlayer === "P1" ? "玩家" : "AI"}</div>
          <div class="pill"><strong>阶段</strong><br />${escapeHtml(state.phase)}</div>
          <div class="pill"><strong>攻击选择</strong><br />${attackStatus}</div>
        </div>
        <div class="log-card hero-log-card">
          <div class="log-list">
            ${state.actionLog.map((item) => `<div class="log-item">${escapeHtml(item.message)}</div>`).join("")}
          </div>
        </div>
      </section>

      <section class="board-shell">
        ${renderEffectLayer(cardFx)}
        <div class="battle-layout">
          <div class="battle-main">
            <section class="battlefield-half enemy-half">
              ${renderPlayerHUD({
        player: enemy,
        character: store.getCharacter(enemy.character),
        ownership: "enemy",
        targetableHero: legalHeroTarget,
        impactTarget: attackFx?.targetType === "hero" && attackFx.targetId === "P2_hero"
    })}

              <section class="zone field-zone ${enemyBoardZoneClass} ${enemyZoneMetaClass}">
                <div class="zone-header">
                  <h2 class="section-title">敌方战场</h2>
                  <span class="small-note">持续物 ${enemy.persistents.length} / 陷阱 ${enemy.traps.length}</span>
                </div>
                <div class="zone-stack">
                  <div class="persistent-row zone-lane ${enemyPersistentRowClass}">${enemyPersistents}</div>
                  <div class="minion-row zone-lane">${enemyBoard}</div>
                </div>
              </section>
            </section>

            <section class="battlefield-half player-half">
              <section class="zone field-zone ${playerBoardZoneClass}">
                <div class="zone-header">
                  <h2 class="section-title">你的战场</h2>
                  <span class="small-note">先选择可攻击使魔，再指定敌方英雄或守护目标进行攻击。</span>
                </div>
                <div class="zone-stack zone-stack-player">
                  <div class="persistent-row zone-lane ${playerPersistentRowClass}">${playerPersistents}</div>
                  <div class="persistent-row zone-lane ${playerTrapRowClass}">${playerTraps}</div>
                  <div class="minion-row zone-lane">${playerBoard}</div>
                </div>
              </section>

              ${renderPlayerHUD({
        player,
        character: store.getCharacter(player.character),
        ownership: "player",
        targetableHero: false,
        impactTarget: attackFx?.targetType === "hero" && attackFx.targetId === "P1_hero"
    })}
            </section>

            <section class="zone hand-zone">
              <div class="zone-header">
                <h2 class="section-title">你的手牌</h2>
                <div class="game-toolbar">
                  <button class="ghost-btn" data-action="restart">重新开始</button>
                  <button class="ghost-btn" data-action="cancel-attacker" ${store.uiState.selectedAttackerId && !isAttackAnimating ? "" : "disabled"}>取消攻击选择</button>
                  <button class="primary-btn" data-action="end-turn" ${canEndTurn ? "" : "disabled"}>结束回合</button>
                </div>
              </div>
              <div class="hand-row">${handCards}</div>
            </section>
          </div>

          <aside class="sidebar">
            ${renderMomentumPanel({
        playerBreakdown: playerMomentum,
        enemyBreakdown: enemyMomentum,
        lastAdvantage: state.lastAdvantage
    })}
          </aside>
        </div>
      </section>

      ${renderPendingChoice(state.pendingChoice)}
      ${renderGameOver(state)}
    </div>
  `;
}
