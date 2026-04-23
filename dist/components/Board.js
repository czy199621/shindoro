import { renderHandCard, renderMinionCard, renderPersistentCard } from "./Card.js";
import { escapeHtml } from "./html.js";
import { renderPlayerHUD } from "./PlayerHUD.js";
import { renderGameOver, renderPendingChoice } from "./ResolutionPanel.js";
export function renderBoard(store, state) {
    const player = state.players.P1;
    const enemy = state.players.P2;
    const targetSet = store.buildTargetSet();
    const isPlayerTurn = state.currentPlayer === "P1" && state.phase === "mainTurn";
    const canEndTurn = isPlayerTurn && !state.winner;
    const legalHeroTarget = targetSet.has("P2_hero");
    const handCards = player.hand.length
        ? player.hand.map((card) => renderHandCard(card, !isPlayerTurn || card.currentCost > player.mana)).join("")
        : `<p class="empty-text">你没有手牌。</p>`;
    const enemyBoard = enemy.board.length
        ? enemy.board
            .map((minion) => renderMinionCard(minion, {
            ownership: "enemy",
            selectedAttackerId: store.uiState.selectedAttackerId,
            targetable: targetSet.has(minion.instanceId)
        }))
            .join("")
        : `<p class="empty-text">敌方战场为空。</p>`;
    const playerBoard = player.board.length
        ? player.board
            .map((minion) => renderMinionCard(minion, {
            ownership: "player",
            selectedAttackerId: store.uiState.selectedAttackerId
        }))
            .join("")
        : `<p class="empty-text">你的战场为空。</p>`;
    const playerPersistents = player.persistents.length
        ? player.persistents.map(renderPersistentCard).join("")
        : `<p class="empty-text">暂无持续魔法。</p>`;
    const playerTraps = player.traps.length
        ? player.traps.map(renderPersistentCard).join("")
        : `<p class="empty-text">暂无伏击陷阱。</p>`;
    const enemyPersistents = enemy.persistents.length
        ? enemy.persistents.map(renderPersistentCard).join("")
        : `<p class="empty-text">敌方无持续魔法。</p>`;
    const advantage = state.lastAdvantage
        ? `
      <div class="sidebar-card">
        <div class="flex-between">
          <h2 class="section-title">上一回合势能</h2>
          <span class="pill">V = ${state.lastAdvantage.value >= 0 ? "+" : ""}${state.lastAdvantage.value}</span>
        </div>
        <p class="small-note">${state.lastAdvantage.summary.join(" / ")}</p>
        <p class="small-note">
          ${state.lastAdvantage.value > 0
            ? "你在上次结算中是优势方。"
            : state.lastAdvantage.value < 0
                ? "你在上次结算中是劣势方。"
                : "上次结算为均势。"}
        </p>
      </div>
    `
        : `
      <div class="sidebar-card">
        <h2 class="section-title">势能面板</h2>
        <p class="small-note">首个回合尚未完成结算。回合结束后会在这里显示 V 值拆解。</p>
      </div>
    `;
    const statusText = state.winner
        ? state.winner === "P1"
            ? "你赢了"
            : "AI 赢了"
        : state.currentPlayer === "P1"
            ? state.phase === "slotResolution"
                ? "等待你处理槽位选择"
                : "轮到你行动"
            : "AI 思考中";
    return `
    <div class="app-shell">
      <section class="hero">
        <div>
          <h1>神どろ 对局中</h1>
          <p>
            当前状态：${escapeHtml(statusText)}。你可以出牌、指挥使魔攻击，并观察每回合末的势能与双槽变化。
          </p>
        </div>
        <div class="hero-stats">
          <div class="pill"><strong>回合数</strong><br />${state.turn}</div>
          <div class="pill"><strong>当前行动方</strong><br />${state.currentPlayer === "P1" ? "玩家" : "AI"}</div>
          <div class="pill"><strong>阶段</strong><br />${escapeHtml(state.phase)}</div>
          <div class="pill"><strong>选中攻击者</strong><br />${store.uiState.selectedAttackerId ? "已选中" : "无"}</div>
        </div>
      </section>

      <section class="board-shell">
        <div class="battle-layout">
          <div class="battle-main">
            ${renderPlayerHUD({
        player: enemy,
        character: store.getCharacter(enemy.character),
        ownership: "enemy",
        targetableHero: legalHeroTarget
    })}

            <section class="zone">
              <div class="zone-header">
                <h2 class="section-title">敌方战场</h2>
                <span class="small-note">持续 ${enemy.persistents.length} / 陷阱 ${enemy.traps.length}</span>
              </div>
              <div class="persistent-row">${enemyPersistents}</div>
              <div class="minion-row" style="margin-top:12px;">${enemyBoard}</div>
            </section>

            <section class="zone">
              <div class="zone-header">
                <h2 class="section-title">你的战场</h2>
                <span class="small-note">点击已准备好的使魔，再点目标即可攻击</span>
              </div>
              <div class="persistent-row">${playerPersistents}</div>
              <div class="persistent-row" style="margin-top:12px;">${playerTraps}</div>
              <div class="minion-row" style="margin-top:12px;">${playerBoard}</div>
            </section>

            ${renderPlayerHUD({
        player,
        character: store.getCharacter(player.character),
        ownership: "player",
        targetableHero: false
    })}

            <section class="zone">
              <div class="zone-header">
                <h2 class="section-title">你的手牌</h2>
                <div class="game-toolbar">
                  <button class="ghost-btn" data-action="cancel-attacker" ${store.uiState.selectedAttackerId ? "" : "disabled"}>取消攻击选择</button>
                  <button class="primary-btn" data-action="end-turn" ${canEndTurn ? "" : "disabled"}>结束回合</button>
                </div>
              </div>
              <div class="hand-row">${handCards}</div>
            </section>
          </div>

          <aside class="sidebar">
            <div class="sidebar-card">
              <h2 class="section-title">当前提示</h2>
              <p class="small-note">10 点槽位只会在回合开始阶段出现选择。13 点槽位会自动强制触发。</p>
              <p class="small-note">敌方陷阱数量：${enemy.traps.length}。你自己的陷阱会直接展示在下方战场区。</p>
            </div>
            ${advantage}
            <div class="log-card">
              <div class="flex-between">
                <h2 class="section-title">战斗日志</h2>
                <button class="ghost-btn" data-action="restart">重新开局</button>
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
