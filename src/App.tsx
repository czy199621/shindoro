import { Suspense, lazy, useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { CHARACTERS } from "./data/characters.js";
import { getCharacterArt, toCssUrl } from "./data/characterArt.js";
import { TALENTS } from "./data/talents.js";
import { ReactBattleBoard } from "./components/react/ReactBattleBoard.js";
import { escapeHtml } from "./components/html.js";
import { createGameStore, type GameStore } from "./store/useGameStore.js";
import type { CharacterDefinition } from "./types.js";

const PixiBattlefieldHost = lazy(() =>
  import("./game-view/pixi/PixiBattlefieldHost.js").then((module) => ({
    default: module.PixiBattlefieldHost
  }))
);

function renderCharacterCardArt(character: CharacterDefinition): string {
  const art = getCharacterArt(character);
  const style = `--character-card-art: ${toCssUrl(art.card)};`;

  return `
    <span class="character-card-art" role="img" aria-label="${escapeHtml(art.alt)}" style="${escapeHtml(style)}">
      <span class="character-card-art-shine" aria-hidden="true"></span>
    </span>
  `;
}

function renderCharacterOption({
  character,
  selected,
  action,
  mode
}: {
  character: CharacterDefinition;
  selected: boolean;
  action: "select-player-character" | "select-ai-character";
  mode: "player" | "ai";
}): string {
  const playerDetails =
    mode === "player"
      ? `
        <p><strong>天赋点：</strong>${character.talentPoints}</p>
        <p><strong>被动：</strong>${escapeHtml(character.passive.description)}</p>
      `
      : `<p><strong>被动：</strong>${escapeHtml(character.passive.description)}</p>`;

  return `
    <button class="option-card character-option-card ${selected ? "selected" : ""}" data-action="${action}" data-character-id="${escapeHtml(character.id)}">
      ${renderCharacterCardArt(character)}
      <div class="character-option-copy">
        <h3>${escapeHtml(character.name)}</h3>
        <p>${escapeHtml(character.title)}</p>
        ${mode === "player" ? `<p>${escapeHtml(character.description)}</p>` : ""}
        ${playerDetails}
      </div>
    </button>
  `;
}

function renderSetupScreen(store: GameStore): string {
  const playerCharacter = store.getSelectedCharacter();
  const remaining = store.getRemainingTalentPoints();
  const selectedTalents = store.uiState.setup.selectedTalentIds
    .map((talentId) => store.getTalent(talentId)?.name ?? talentId)
    .join(" / ");

  return `
    <div class="app-shell">
      <section class="hero">
        <div>
          <div class="moe-mode-badge">Moe Arcana</div>
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
        <div class="moe-ribbon" aria-hidden="true">
          <span>Kira</span>
          <span>Moe</span>
          <span>Magic</span>
        </div>
      </section>

      <div class="setup-grid">
        <section class="setup-panel">
          <div class="flex-between">
            <h2>1. 选择玩家角色</h2>
            <span class="small-note">不同角色拥有不同天赋点、被动和 10 / 13 点爆发</span>
          </div>
          <div class="character-grid">
            ${CHARACTERS.map(
              (character) =>
                renderCharacterOption({
                  character,
                  selected: store.uiState.setup.playerCharacterId === character.id,
                  action: "select-player-character",
                  mode: "player"
                })
            ).join("")}
          </div>

          <div class="flex-between" style="margin-top:18px;">
            <h2>2. 选择 AI 角色</h2>
            <span class="small-note">AI 会按后手预算使用该角色的预设天赋</span>
          </div>
          <div class="character-grid">
            ${CHARACTERS.map(
              (character) =>
                renderCharacterOption({
                  character,
                  selected: store.uiState.setup.aiCharacterId === character.id,
                  action: "select-ai-character",
                  mode: "ai"
                })
            ).join("")}
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

function onSetupAction(store: GameStore, target: HTMLElement): boolean {
  const action = target.dataset.action ?? "";

  if (action === "select-player-character") {
    const characterId = target.dataset.characterId;
    if (!characterId) return true;
    store.selectPlayerCharacter(characterId);
    return true;
  }

  if (action === "select-ai-character") {
    const characterId = target.dataset.characterId;
    if (!characterId) return true;
    store.selectAiCharacter(characterId);
    return true;
  }

  if (action === "add-talent") {
    const talentId = target.dataset.talentId;
    if (!talentId) return true;
    store.addTalent(talentId);
    return true;
  }

  if (action === "remove-talent") {
    const talentId = target.dataset.talentId;
    if (!talentId) return true;
    store.removeTalent(talentId);
    return true;
  }

  if (action === "start-game") {
    store.startGame();
    return true;
  }

  return false;
}

export function GameApp() {
  const storeRef = useRef<GameStore | null>(null);
  const [, setRenderVersion] = useState(0);

  if (!storeRef.current) {
    storeRef.current = createGameStore();
  }

  const store = storeRef.current;
  const forceRender = useCallback(() => {
    setRenderVersion((version) => version + 1);
  }, []);

  const state = store.getState();
  const markup = state.screen === "setup" ? renderSetupScreen(store) : "";

  useEffect(() => {
    store.scheduleAiTurn(forceRender);
  });

  useEffect(() => {
    return () => {
      store.dispose();
    };
  }, [store]);

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-action]");
      if (!target || !event.currentTarget.contains(target)) return;

      const handled = onSetupAction(store, target);

      if (handled) {
        forceRender();
      }
    },
    [forceRender, store]
  );

  if (state.screen === "game" || state.screen === "mulligan") {
    return (
      <>
        <Suspense fallback={null}>
          <PixiBattlefieldHost state={state} attackFx={store.uiState.attackFx} cardFx={store.uiState.cardFx} />
        </Suspense>
        <ReactBattleBoard store={store} state={state} onChange={forceRender} />
      </>
    );
  }

  return (
    <div className="legacy-app-root" onClick={handleClick} dangerouslySetInnerHTML={{ __html: markup }} />
  );
}

