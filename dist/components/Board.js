import { getAdvantageBreakdown } from "../engine/rules.js";
import { renderHandCard, renderMinionCard, renderPersistentCard } from "./Card.js";
import { escapeHtml } from "./html.js";
import { renderMomentumPanel } from "./MomentumPanel.js";
import { renderPlayerHUD } from "./PlayerHUD.js";
import { renderGameOver, renderPendingChoice } from "./ResolutionPanel.js";
export function renderBoard(store, state) {
    const player = state.players.P1;
    const enemy = state.players.P2;
    const attackFx = store.uiState.attackFx;
    const isAttackAnimating = Boolean(attackFx);
    const targetSet = isAttackAnimating ? new Set() : store.buildTargetSet();
    const canPlayCards = state.currentPlayer === "P1" && state.phase === "mainTurn" && !state.winner && !isAttackAnimating;
    const canControlBattle = state.currentPlayer === "P1" && (state.phase === "mainTurn" || state.phase === "combat") && !isAttackAnimating;
    const canEndTurn = canControlBattle && !state.winner;
    const legalHeroTarget = targetSet.has("P2_hero");
    const playerMomentum = getAdvantageBreakdown(player, enemy);
    const enemyMomentum = getAdvantageBreakdown(enemy, player);
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
            impactTarget: attackFx?.targetType === "minion" && attackFx.targetId === minion.instanceId
        }))
            .join("")
        : `<p class="empty-text">敌方场上暂无使魔。</p>`;
    const playerBoard = player.board.length
        ? player.board
            .map((minion) => renderMinionCard(minion, {
            ownership: "player",
            selectedAttackerId: store.uiState.selectedAttackerId,
            attacking: attackFx?.attackerId === minion.instanceId,
            impactTarget: attackFx?.targetType === "minion" && attackFx.targetId === minion.instanceId
        }))
            .join("")
        : `<p class="empty-text">你的场上暂无使魔。</p>`;
    const playerPersistents = player.persistents.length
        ? player.persistents.map(renderPersistentCard).join("")
        : `<p class="empty-text">你没有持续物。</p>`;
    const playerTraps = player.traps.length
        ? player.traps.map(renderPersistentCard).join("")
        : `<p class="empty-text">你没有陷阱。</p>`;
    const enemyPersistents = enemy.persistents.length
        ? enemy.persistents.map(renderPersistentCard).join("")
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
    <div class="app-shell">
      <section class="hero">
        <div>
          <h1>Shin Doro 对局中</h1>
          <p>${escapeHtml(statusText)}</p>
        </div>
        <div class="hero-stats">
          <div class="pill"><strong>回合数</strong><br />${state.turn}</div>
          <div class="pill"><strong>当前行动方</strong><br />${state.currentPlayer === "P1" ? "玩家" : "AI"}</div>
          <div class="pill"><strong>阶段</strong><br />${escapeHtml(state.phase)}</div>
          <div class="pill"><strong>攻击选择</strong><br />${attackStatus}</div>
        </div>
      </section>

      <section class="board-shell">
        <div class="battle-layout">
          <div class="battle-main">
            ${renderPlayerHUD({
        player: enemy,
        character: store.getCharacter(enemy.character),
        ownership: "enemy",
        targetableHero: legalHeroTarget,
        impactTarget: attackFx?.targetType === "hero" && attackFx.targetId === "P2_hero"
    })}

            <section class="zone">
              <div class="zone-header">
                <h2 class="section-title">敌方战场</h2>
                <span class="small-note">持续物 ${enemy.persistents.length} / 陷阱 ${enemy.traps.length}</span>
              </div>
              <div class="persistent-row">${enemyPersistents}</div>
              <div class="minion-row" style="margin-top:12px;">${enemyBoard}</div>
            </section>

            <section class="zone">
              <div class="zone-header">
                <h2 class="section-title">你的战场</h2>
                <span class="small-note">选择可攻击使魔后，可以指定敌方英雄或守护目标进行攻击。</span>
              </div>
              <div class="persistent-row">${playerPersistents}</div>
              <div class="persistent-row" style="margin-top:12px;">${playerTraps}</div>
              <div class="minion-row" style="margin-top:12px;">${playerBoard}</div>
            </section>

            ${renderPlayerHUD({
        player,
        character: store.getCharacter(player.character),
        ownership: "player",
        targetableHero: false,
        impactTarget: attackFx?.targetType === "hero" && attackFx.targetId === "P1_hero"
    })}

            <section class="zone">
              <div class="zone-header">
                <h2 class="section-title">你的手牌</h2>
                <div class="game-toolbar">
                  <button class="ghost-btn" data-action="cancel-attacker" ${store.uiState.selectedAttackerId && !isAttackAnimating ? "" : "disabled"}>取消攻击选择</button>
                  <button class="primary-btn" data-action="end-turn" ${canEndTurn ? "" : "disabled"}>结束回合</button>
                </div>
              </div>
              <div class="hand-row">${handCards}</div>
            </section>
          </div>

          <aside class="sidebar">
            <div class="sidebar-card">
              <h2 class="section-title">槽位提示</h2>
              <p class="small-note">10 点槽位可发动普通大招，13 点可发动强化大招或 Overkill 版本。</p>
              <p class="small-note">敌方当前有 ${enemy.traps.length} 个陷阱，进攻前请留意反制风险。</p>
            </div>
            ${renderMomentumPanel({
        playerBreakdown: playerMomentum,
        enemyBreakdown: enemyMomentum,
        lastAdvantage: state.lastAdvantage
    })}
            <div class="log-card">
              <div class="flex-between">
                <h2 class="section-title">战斗日志</h2>
                <button class="ghost-btn" data-action="restart">重新开始</button>
              </div>
              <div class="log-list">
                ${state.actionLog.map((item) => `<div class="log-item">${escapeHtml(item.message)}</div>`).join("")}
              </div>
            </div>
          </aside>
        </div>
      </section>

      ${renderPendingChoice(state.pendingChoice)}
      ${renderGameOver(state)}
    </div>
  `;
}
