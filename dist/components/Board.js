import { renderHandCard, renderMinionCard, renderPersistentCard } from "./Card.js";
import { escapeHtml } from "./html.js";
import { renderPlayerHUD } from "./PlayerHUD.js";
import { renderGameOver, renderPendingChoice } from "./ResolutionPanel.js";
export function renderBoard(store, state) {
    const player = state.players.P1;
    const enemy = state.players.P2;
    const targetSet = store.buildTargetSet();
    const canPlayCards = state.currentPlayer === "P1" && state.phase === "mainTurn" && !state.winner;
    const canControlBattle = state.currentPlayer === "P1" && (state.phase === "mainTurn" || state.phase === "combat");
    const canEndTurn = canControlBattle && !state.winner;
    const legalHeroTarget = targetSet.has("P2_hero");
    const handCards = player.hand.length
        ? player.hand.map((card) => renderHandCard(card, !canPlayCards || card.currentCost > player.mana)).join("")
        : `<p class="empty-text">你的手牌区为空。</p>`;
    const enemyBoard = enemy.board.length
        ? enemy.board
            .map((minion) => renderMinionCard(minion, {
            ownership: "enemy",
            selectedAttackerId: store.uiState.selectedAttackerId,
            targetable: targetSet.has(minion.instanceId)
        }))
            .join("")
        : `<p class="empty-text">敌方场上没有使魔。</p>`;
    const playerBoard = player.board.length
        ? player.board
            .map((minion) => renderMinionCard(minion, {
            ownership: "player",
            selectedAttackerId: store.uiState.selectedAttackerId
        }))
            .join("")
        : `<p class="empty-text">你的场上没有使魔。</p>`;
    const playerPersistents = player.persistents.length
        ? player.persistents.map(renderPersistentCard).join("")
        : `<p class="empty-text">没有持续牌。</p>`;
    const playerTraps = player.traps.length
        ? player.traps.map(renderPersistentCard).join("")
        : `<p class="empty-text">没有陷阱牌。</p>`;
    const enemyPersistents = enemy.persistents.length
        ? enemy.persistents.map(renderPersistentCard).join("")
        : `<p class="empty-text">敌方没有持续牌。</p>`;
    const advantage = state.lastAdvantage
        ? `
      <div class="sidebar-card">
        <div class="flex-between">
          <h2 class="section-title">上回合势能结算</h2>
          <span class="pill">V = ${state.lastAdvantage.value >= 0 ? "+" : ""}${state.lastAdvantage.value}</span>
        </div>
        <p class="small-note">${state.lastAdvantage.summary.join(" / ")}</p>
        <p class="small-note">
          ${state.lastAdvantage.value > 0
            ? "上一回合结算后，玩家一侧获得了跳脸槽收益。"
            : state.lastAdvantage.value < 0
                ? "上一回合结算后，玩家一侧落入劣势并让对手获得神抽槽收益。"
                : "上一回合双方势能相等，没有额外槽位收益。"}
        </p>
      </div>
    `
        : `
      <div class="sidebar-card">
        <h2 class="section-title">势能说明</h2>
        <p class="small-note">回合结束时会根据手牌、血量、场面与特殊条件结算势能差，并据此增加跳脸槽或神抽槽。</p>
      </div>
    `;
    const statusText = state.winner
        ? state.winner === "P1"
            ? "你已经获胜。"
            : "AI 获得了胜利。"
        : state.currentPlayer === "P1"
            ? state.phase === "slotResolution"
                ? "正在等待你决定是否发动槽位效果。"
                : `当前是你的 ${state.phase}。`
            : `当前由 AI 行动，阶段为 ${state.phase}。`;
    return `
    <div class="app-shell">
      <section class="hero">
        <div>
          <h1>神どろ 对局中</h1>
          <p>${escapeHtml(statusText)}</p>
        </div>
        <div class="hero-stats">
          <div class="pill"><strong>回合数</strong><br />${state.turn}</div>
          <div class="pill"><strong>当前行动方</strong><br />${state.currentPlayer === "P1" ? "玩家" : "AI"}</div>
          <div class="pill"><strong>阶段</strong><br />${escapeHtml(state.phase)}</div>
          <div class="pill"><strong>攻击选择</strong><br />${store.uiState.selectedAttackerId ? "已选择使魔" : "未选择"}</div>
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
                <span class="small-note">持续牌 ${enemy.persistents.length} / 陷阱 ${enemy.traps.length}</span>
              </div>
              <div class="persistent-row">${enemyPersistents}</div>
              <div class="minion-row" style="margin-top:12px;">${enemyBoard}</div>
            </section>

            <section class="zone">
              <div class="zone-header">
                <h2 class="section-title">你的战场</h2>
                <span class="small-note">选择可攻击使魔后，再点敌方目标进行攻击。</span>
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
              <h2 class="section-title">槽位说明</h2>
              <p class="small-note">10 点槽位可以主动发动角色技能，13 点会强制触发 Overkill。神抽槽的 13 点效果会改为从备牌库选牌。</p>
              <p class="small-note">敌方当前陷阱数量为 ${enemy.traps.length}，攻击前请留意可能的触发反制。</p>
            </div>
            ${advantage}
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
