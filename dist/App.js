import { CHARACTERS } from "./data/characters.js";
import { TALENTS } from "./data/talents.js";
import { renderMulliganCard } from "./components/Card.js";
import { renderBoard } from "./components/Board.js";
import { escapeHtml } from "./components/html.js";
import { createGameStore } from "./store/useGameStore.js";
function renderSetupScreen(store) {
    const playerCharacter = store.getSelectedCharacter();
    const remaining = store.getRemainingTalentPoints();
    const selectedTalents = store.uiState.setup.selectedTalentIds
        .map((talentId) => store.getTalent(talentId)?.name ?? talentId)
        .join(" / ");
    return `
    <div class="app-shell">
      <section class="hero">
        <div>
          <h1>神どろ Prototype v1.2</h1>
          <p>
            当前实装已经切到 v1.2 规则骨架：6 名角色、50 张主卡组、备牌库和先后手动态天赋价格都在这里完成配置。
            这版仍然保持玩家对 AI 的数字原型节奏，便于继续迭代角色技能、关键词和日志表现。
          </p>
        </div>
        <div class="hero-stats">
          <div class="pill"><strong>对局模式</strong><br />玩家 vs AI</div>
          <div class="pill"><strong>规则主源</strong><br />design/game_rule.md</div>
          <div class="pill"><strong>当前目标</strong><br />v1.2 规则骨架</div>
          <div class="pill"><strong>实现方式</strong><br />TypeScript + 原生 DOM</div>
        </div>
      </section>

      <div class="setup-grid">
        <section class="setup-panel">
          <div class="flex-between">
            <h2>1. 选择玩家角色</h2>
            <span class="small-note">不同角色拥有不同天赋点、被动和 10 / 13 点爆发</span>
          </div>
          <div class="character-grid">
            ${CHARACTERS.map((character) => `
                <button class="option-card ${store.uiState.setup.playerCharacterId === character.id ? "selected" : ""}" data-action="select-player-character" data-character-id="${escapeHtml(character.id)}">
                  <h3>${escapeHtml(character.name)}</h3>
                  <p>${escapeHtml(character.title)}</p>
                  <p>${escapeHtml(character.description)}</p>
                  <p><strong>天赋点：</strong>${character.talentPoints}</p>
                  <p><strong>被动：</strong>${escapeHtml(character.passive.description)}</p>
                </button>
              `).join("")}
          </div>

          <div class="flex-between" style="margin-top:18px;">
            <h2>2. 选择 AI 角色</h2>
            <span class="small-note">AI 会按后手预算使用该角色的预设天赋</span>
          </div>
          <div class="character-grid">
            ${CHARACTERS.map((character) => `
                <button class="option-card ${store.uiState.setup.aiCharacterId === character.id ? "selected" : ""}" data-action="select-ai-character" data-character-id="${escapeHtml(character.id)}">
                  <h3>${escapeHtml(character.name)}</h3>
                  <p>${escapeHtml(character.title)}</p>
                  <p><strong>被动：</strong>${escapeHtml(character.passive.description)}</p>
                </button>
              `).join("")}
          </div>
        </section>

        <section class="setup-panel">
          <div class="flex-between">
            <h2>3. 购买开局天赋</h2>
            <div class="pill">剩余点数 ${remaining}</div>
          </div>
          <p class="small-note">
            当前角色是 ${escapeHtml(playerCharacter.name)}，可用天赋点为 ${playerCharacter.talentPoints}。
            玩家默认按先手价格结算，标记为 “-” 的后手 / 先手价格代表该天赋不能由对应座次购买。
          </p>
          <div class="talent-grid">
            ${TALENTS.map((talent) => {
        const count = store.getTalentCount(talent.id);
        const activeCost = store.getTalentCost(talent);
        const disabled = !store.canAddTalent(talent);
        return `
                <div class="option-card ${count > 0 ? "selected" : ""}">
                  <h4>${escapeHtml(talent.name)}</h4>
                  <p>${escapeHtml(talent.description)}</p>
                  <p><strong>当前费用：</strong>${activeCost ?? "不可购买"} 点</p>
                  <p><strong>先手 / 后手：</strong>${talent.pricing.first ?? "-"} / ${talent.pricing.second ?? "-"}</p>
                  <p><strong>已购次数：</strong>${count}/${talent.repeatLimit}</p>
                  <div class="row">
                    <button class="secondary-btn" data-action="add-talent" data-talent-id="${escapeHtml(talent.id)}" ${disabled ? "disabled" : ""}>购买</button>
                    <button class="ghost-btn" data-action="remove-talent" data-talent-id="${escapeHtml(talent.id)}" ${count === 0 ? "disabled" : ""}>移除</button>
                  </div>
                </div>
              `;
    }).join("")}
          </div>

          <div class="setup-toolbar">
            <div class="small-note">
              已选天赋：${selectedTalents || "暂无"}
            </div>
            <button class="primary-btn" data-action="start-game" ${remaining < 0 ? "disabled" : ""}>开始对局</button>
          </div>
        </section>
      </div>
    </div>
  `;
}
function renderMulliganScreen(store, state) {
    const player = state.players.P1;
    return `
    <div class="app-shell">
      <section class="hero">
        <div>
          <h1>起手换牌</h1>
          <p>
            选择你想换掉的起手牌。AI 会自动完成自己的 Mulligan，确认后就会进入你的第一个回合。
          </p>
        </div>
        <div class="hero-stats">
          <div class="pill"><strong>玩家角色</strong><br />${escapeHtml(store.getCharacter(player.character).name)}</div>
          <div class="pill"><strong>生命值</strong><br />${player.hp}/${player.maxHp}</div>
          <div class="pill"><strong>手牌上限</strong><br />${player.handLimit}</div>
          <div class="pill"><strong>当前手牌</strong><br />${player.hand.length}</div>
        </div>
      </section>

      <section class="setup-panel" style="margin-top:18px;">
        <div class="flex-between">
          <h2>选择要换掉的牌</h2>
          <span class="small-note">已标记 ${store.uiState.mulliganSelection.size} 张</span>
        </div>
        <div class="mulligan-grid">
          ${player.hand.map((card) => renderMulliganCard(card, store.uiState.mulliganSelection.has(card.runtimeId))).join("")}
        </div>
        <div class="setup-toolbar">
          <button class="ghost-btn" data-action="clear-mulligan">清空选择</button>
          <button class="primary-btn" data-action="confirm-mulligan">确认换牌并开战</button>
        </div>
      </section>
    </div>
  `;
}
function onSetupAction(store, target) {
    const action = target.dataset.action ?? "";
    if (action === "select-player-character") {
        const characterId = target.dataset.characterId;
        if (!characterId)
            return true;
        store.selectPlayerCharacter(characterId);
        return true;
    }
    if (action === "select-ai-character") {
        const characterId = target.dataset.characterId;
        if (!characterId)
            return true;
        store.selectAiCharacter(characterId);
        return true;
    }
    if (action === "add-talent") {
        const talentId = target.dataset.talentId;
        if (!talentId)
            return true;
        store.addTalent(talentId);
        return true;
    }
    if (action === "remove-talent") {
        const talentId = target.dataset.talentId;
        if (!talentId)
            return true;
        store.removeTalent(talentId);
        return true;
    }
    if (action === "start-game") {
        store.startGame();
        return true;
    }
    return false;
}
function onMulliganAction(store, target) {
    const action = target.dataset.action ?? "";
    if (action === "toggle-mulligan") {
        const runtimeId = target.dataset.runtimeId;
        if (!runtimeId)
            return true;
        store.toggleMulliganCard(runtimeId);
        return true;
    }
    if (action === "clear-mulligan") {
        store.clearMulliganSelection();
        return true;
    }
    if (action === "confirm-mulligan") {
        store.confirmMulligan();
        return true;
    }
    return false;
}
function onBattleAction(store, target, onChange) {
    const state = store.getState();
    const action = target.dataset.action ?? "";
    if (action === "restart") {
        store.restart();
        return true;
    }
    if (store.uiState.attackFx) {
        return false;
    }
    if (state.pendingChoice) {
        if (action === "pending-use-jump") {
            store.resolvePendingChoice({ action: "use" });
            return true;
        }
        if (action === "pending-skip") {
            store.resolvePendingChoice({ action: "skip" });
            return true;
        }
        if (action === "pending-pick-card") {
            store.resolvePendingChoice({ action: "use", cardId: target.dataset.cardId ?? null });
            return true;
        }
    }
    if (action === "cancel-attacker") {
        store.cancelAttacker();
        return true;
    }
    if (action === "play-card") {
        const runtimeId = target.dataset.runtimeId;
        if (!runtimeId)
            return true;
        store.playCard(runtimeId);
        return true;
    }
    if (action === "select-attacker") {
        const minionId = target.dataset.minionId;
        if (!minionId)
            return true;
        store.toggleAttacker(minionId);
        return true;
    }
    if (action === "attack-target") {
        const minionId = target.dataset.minionId;
        if (!minionId)
            return true;
        return store.attackMinion(minionId, onChange);
    }
    if (action === "attack-hero") {
        const heroId = target.dataset.heroId;
        if (!heroId)
            return true;
        return store.attackHero(heroId, onChange);
    }
    if (action === "end-turn") {
        store.endTurn();
        return true;
    }
    return false;
}
export function mountApp(app) {
    const store = createGameStore();
    const render = () => {
        const state = store.getState();
        if (state.screen === "setup") {
            app.innerHTML = renderSetupScreen(store);
        }
        else if (state.screen === "mulligan") {
            app.innerHTML = renderMulliganScreen(store, state);
        }
        else {
            app.innerHTML = renderBoard(store, state);
        }
        store.scheduleAiTurn(render);
    };
    app.addEventListener("click", (event) => {
        const target = event.target?.closest("[data-action]");
        if (!target)
            return;
        const state = store.getState();
        const handled = state.screen === "setup"
            ? onSetupAction(store, target)
            : state.screen === "mulligan"
                ? onMulliganAction(store, target)
                : onBattleAction(store, target, render);
        if (handled) {
            render();
        }
    });
    window.addEventListener("beforeunload", () => {
        store.dispose();
    });
    render();
}
