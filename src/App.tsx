import { Suspense, lazy, useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { CHARACTERS } from "./data/characters.js";
import { getCharacterArt, toCssUrl } from "./data/characterArt.js";
import { TALENTS } from "./data/talents.js";
import { ReactBattleBoard } from "./components/react/ReactBattleBoard.js";
import { escapeHtml } from "./components/html.js";
import { createGameStore, type GameStore, type ToastState } from "./store/useGameStore.js";
import type { CardDefinition, CardType, CharacterDefinition, DeckValidationResult, SavedDeck, StarterDeckPreset } from "./types.js";

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

function getCardTypeLabel(type: CardType): string {
  const labels: Record<CardType, string> = {
    minion: "使魔",
    spell: "魔法",
    trap: "陷阱",
    persistent: "持续"
  };
  return labels[type] ?? type;
}

function renderDeckValidation(result: DeckValidationResult): string {
  const statusClass = result.valid ? "valid" : "invalid";
  const statusText = result.valid ? "合法" : "不合法";
  const warnings = result.warnings.length
    ? `<div class="deck-validation-list warning">${result.warnings.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div>`
    : "";
  const errors = result.errors.length
    ? `<div class="deck-validation-list error">${result.errors.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div>`
    : "";

  return `
    <div class="deck-validation ${statusClass}">
      <strong>${statusText}</strong>
      <span>${result.cardCount}/50</span>
      ${errors}
      ${warnings}
    </div>
  `;
}

function renderSavedDeckButton(deck: SavedDeck, selected: boolean): string {
  return `
    <button class="saved-deck-button ${selected ? "selected" : ""}" data-action="select-deck" data-deck-id="${escapeHtml(deck.id)}">
      <strong>${escapeHtml(deck.name)}</strong>
      <span>${deck.mainDeck.length}/50</span>
    </button>
  `;
}

function renderDifficulty(difficulty: StarterDeckPreset["difficulty"]): string {
  return `${"★".repeat(difficulty)}${"☆".repeat(3 - difficulty)}`;
}

function renderStarterDeckButton(store: GameStore, preset: StarterDeckPreset, selected: boolean): string {
  const tags = preset.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const keyCards = preset.keyCards.map((cardId) => escapeHtml(store.getCardName(cardId))).join(" / ");
  const talents = preset.recommendedTalents.map((talentId) => escapeHtml(store.getTalentName(talentId))).join(" / ");

  return `
    <button class="starter-deck-card ${selected ? "selected" : ""}" data-action="select-starter-deck" data-preset-id="${escapeHtml(preset.id)}">
      <span class="starter-deck-topline">
        <strong>${escapeHtml(preset.name)}</strong>
        <span>${preset.mainDeck.length}/50</span>
      </span>
      <span class="starter-deck-meta">
        <span>难度 ${renderDifficulty(preset.difficulty)}</span>
        <span>${escapeHtml(preset.speed)}</span>
      </span>
      <span class="starter-deck-tags">${tags}</span>
      <span class="starter-deck-description">${escapeHtml(preset.description)}</span>
      <span class="starter-deck-detail"><b>关键卡</b>${keyCards}</span>
      <span class="starter-deck-detail"><b>推荐天赋</b>${talents}</span>
    </button>
  `;
}

function renderDeckCardSummary(card: CardDefinition, count: number): string {
  return `
    <div class="deck-card-summary">
      <button class="deck-card-name" data-action="inspect-deck-card" data-card-id="${escapeHtml(card.id)}">
        <strong>${escapeHtml(card.name)}</strong>
        <span>${escapeHtml(card.id)}</span>
      </button>
      <span>${getCardTypeLabel(card.type)} / ${card.cost}费</span>
      <strong>x${count}</strong>
      <button class="ghost-btn compact" data-action="remove-deck-card" data-card-id="${escapeHtml(card.id)}">移除</button>
    </div>
  `;
}

function renderDeckPoolCard(card: CardDefinition, currentCount: number): string {
  const tags = card.tags?.length ? card.tags.join(" / ") : "无关键词";
  return `
    <div class="deck-pool-card">
      <button class="deck-card-name" data-action="inspect-deck-card" data-card-id="${escapeHtml(card.id)}">
        <strong>${escapeHtml(card.name)}</strong>
        <span>${getCardTypeLabel(card.type)} / ${card.cost}费 / 已有 ${currentCount}</span>
      </button>
      <p>${escapeHtml(tags)}</p>
      <button class="secondary-btn compact" data-action="add-deck-card" data-card-id="${escapeHtml(card.id)}">加入</button>
    </div>
  `;
}

function renderCardDetail(card: CardDefinition | null): string {
  if (!card) {
    return `<div class="deck-card-detail"><p class="small-note">选择一张卡查看详情。</p></div>`;
  }

  const stats =
    card.type === "minion"
      ? `<p><strong>身材：</strong>${card.attack ?? 0} / ${card.health ?? 0} / 威胁 ${card.threat ?? "-"}</p>`
      : "";
  const tags = card.tags?.length ? `<p><strong>标签：</strong>${card.tags.map(escapeHtml).join(" / ")}</p>` : "";

  return `
    <div class="deck-card-detail">
      <span class="deck-detail-type">${getCardTypeLabel(card.type)} / ${card.cost}费</span>
      <h3>${escapeHtml(card.name)}</h3>
      <p class="small-note">${escapeHtml(card.id)}</p>
      ${stats}
      ${tags}
      <p>${escapeHtml(card.description)}</p>
      <button class="secondary-btn" data-action="add-deck-card" data-card-id="${escapeHtml(card.id)}">加入当前卡组</button>
    </div>
  `;
}

function renderDeckBuilder(store: GameStore): string {
  const validation = store.getActiveDeckValidation();
  const activeCard = store.getActiveDeckCard();
  const poolCards = store.getDeckBuilderCards();
  const duplicateCounts = validation.duplicateCounts;
  const deckCards = store.getDeckCardCounts();
  const selectedSavedDeck = store.getSelectedSavedDeck();
  const filterOptions: Array<{ value: string; label: string }> = [
    { value: "all", label: "全部" },
    { value: "minion", label: "使魔" },
    { value: "spell", label: "魔法" },
    { value: "trap", label: "陷阱" },
    { value: "persistent", label: "持续" },
    { value: "cost_1", label: "1费" },
    { value: "cost_2", label: "2费" },
    { value: "cost_3", label: "3费" },
    { value: "cost_4", label: "4费" },
    { value: "cost_5", label: "5费" },
    { value: "cost_6", label: "6费" },
    { value: "cost_7_plus", label: "7费以上" },
    { value: "guard", label: "护卫" },
    { value: "rush", label: "疾风" },
    { value: "battlecry", label: "战吼" },
    { value: "deathrattle", label: "亡语" }
  ];

  return `
    <div class="deck-builder">
      <div class="deck-builder-top">
        <div>
          <h3>${escapeHtml(store.getActiveDeckName())}</h3>
          <p class="small-note">当前角色：${escapeHtml(store.getSelectedCharacter().name)} / 本机保存键：shindoro.savedDecks.v1</p>
        </div>
        <div class="row">
          <button class="ghost-btn" data-action="toggle-deck-builder">返回设置</button>
          <button class="secondary-btn" data-action="rename-deck" ${selectedSavedDeck ? "" : "disabled"}>重命名</button>
          <button class="secondary-btn" data-action="duplicate-deck">复制</button>
          <button class="ghost-btn" data-action="delete-deck" ${selectedSavedDeck ? "" : "disabled"}>删除</button>
          <button class="primary-btn" data-action="save-deck" ${store.uiState.setup.deckSaving ? "disabled" : ""}>${store.uiState.setup.deckSaving ? "保存中…" : "保存"}</button>
        </div>
      </div>

      <div class="deck-filter-row">
        ${filterOptions
          .map(
            (option) =>
              `<button class="deck-filter-chip ${store.uiState.setup.deckFilter === option.value ? "selected" : ""}" data-action="deck-filter" data-filter="${option.value}">${option.label}</button>`
          )
          .join("")}
        <button class="deck-filter-chip search" data-action="deck-search">搜索${store.uiState.setup.deckSearch ? `：${escapeHtml(store.uiState.setup.deckSearch)}` : ""}</button>
        <button class="deck-filter-chip" data-action="deck-search-clear">清空搜索</button>
      </div>

      <div class="deck-builder-grid">
        <section class="deck-pool-panel">
          <h4>卡牌池</h4>
          <div class="deck-pool-list">
            ${poolCards.map((card) => renderDeckPoolCard(card, duplicateCounts[card.id] ?? 0)).join("")}
          </div>
        </section>

        <section class="deck-detail-panel">
          ${renderCardDetail(activeCard)}
        </section>

        <section class="deck-current-panel">
          <div class="flex-between">
            <h4>当前卡组</h4>
            <span>${validation.cardCount}/50</span>
          </div>
          ${renderDeckValidation(validation)}
          <div class="deck-current-list">
            ${deckCards.map(({ card, count }) => renderDeckCardSummary(card, count)).join("")}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderDeckBuilderScreen(store: GameStore): string {
  return `
    <div class="app-shell deck-builder-screen">
      <section class="deck-builder-shell">
        <div class="deck-builder-screen-head">
          <div>
            <span class="moe-mode-badge">Deck Lab</span>
            <h1>卡组构筑</h1>
            <p>${escapeHtml(store.getSelectedCharacter().name)} / ${escapeHtml(store.getActiveDeckName())}</p>
          </div>
          <div class="deck-builder-screen-status">
            ${renderDeckValidation(store.getActiveDeckValidation())}
          </div>
        </div>
        ${renderDeckBuilder(store)}
      </section>
    </div>
  `;
}

function renderDeckSelection(store: GameStore): string {
  const selectedDeck = store.getSelectedSavedDeck();
  const savedDecks = store.getSavedDecks();
  const selectedPreset = store.getSelectedStarterDeckPreset();
  const presets = store.getStarterDeckPresets();
  const validation = store.getActiveDeckValidation();

  return `
    <div class="deck-setup">
      <div class="flex-between">
        <h2>2. 选择卡组</h2>
        <span class="small-note">选择合法卡组后才能开始对局</span>
      </div>
      <div class="deck-choice-layout">
        <section class="deck-choice-main">
          <div class="deck-choice-section-title">
            <strong>开局预设卡组</strong>
            <span>每名角色 3 套</span>
          </div>
          <div class="starter-deck-grid">
            ${presets.map((preset) => renderStarterDeckButton(store, preset, !selectedDeck && selectedPreset.id === preset.id)).join("")}
          </div>

          <div class="deck-choice-section-title">
            <strong>本机自定义卡组</strong>
            <span>${savedDecks.length} 套</span>
          </div>
          ${
            savedDecks.length
              ? savedDecks.map((deck) => renderSavedDeckButton(deck, selectedDeck?.id === deck.id)).join("")
              : `<p class="small-note">该角色还没有自定义卡组。你可以使用开局预设，或从当前预设创建一套本机卡组。</p>`
          }
        </section>
        <aside class="deck-choice-status">
          <h3>${escapeHtml(store.getActiveDeckName())}</h3>
          ${renderDeckValidation(validation)}
          <div class="row">
            <button class="secondary-btn" data-action="create-deck-from-default">从当前预设创建</button>
            <button class="secondary-btn" data-action="toggle-deck-builder">进入构筑器</button>
          </div>
          ${store.uiState.setup.deckMessage ? `<p class="deck-message">${escapeHtml(store.uiState.setup.deckMessage)}</p>` : ""}
        </aside>
      </div>
    </div>
  `;
}

function renderSetupScreen(store: GameStore): string {
  const playerCharacter = store.getSelectedCharacter();
  const remaining = store.getRemainingTalentPoints();
  const deckValidation = store.getActiveDeckValidation();
  const selectedTalents = store.uiState.setup.selectedTalentIds
    .map((talentId) => store.getTalent(talentId)?.name ?? talentId)
    .join(" / ");

  return `
    <div class="app-shell">
      <section class="hero">
        <div>
          <div class="moe-mode-badge">Moe Arcana</div>
          <h1>神どろ Prototype v1.3</h1>
          <p>
            当前实装已经切到 v1.3 规则骨架：7 名角色、50 张主卡组、公共备牌库、先后手动态天赋价格和本地卡组保存都在这里完成配置。
            这版仍然保持玩家对 AI 的数字原型节奏，便于继续迭代角色技能、关键词和卡组构筑体验。
          </p>
        </div>
        <div class="hero-stats">
          <div class="pill"><strong>对局模式</strong><br />玩家 vs AI</div>
          <div class="pill"><strong>规则主源</strong><br />design/game_rule.md</div>
          <div class="pill"><strong>当前目标</strong><br />v1.3 + 构筑器</div>
          <div class="pill"><strong>实现方式</strong><br />Vite + React + TypeScript</div>
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
            <h2>AI 角色</h2>
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
          ${renderDeckSelection(store)}

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
            <button class="primary-btn" data-action="start-game" ${remaining < 0 || !deckValidation.valid ? "disabled" : ""}>开始对局</button>
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

  if (action === "select-deck") {
    store.selectDeck(target.dataset.deckId ?? "default");
    return true;
  }

  if (action === "select-starter-deck") {
    const presetId = target.dataset.presetId;
    if (presetId) store.selectStarterDeckPreset(presetId);
    return true;
  }

  if (action === "toggle-deck-builder") {
    store.toggleDeckBuilder();
    return true;
  }

  if (action === "create-deck-from-default") {
    store.createDeckFromDefault();
    return true;
  }

  if (action === "duplicate-deck") {
    store.duplicateActiveDeck();
    return true;
  }

  if (action === "delete-deck") {
    if (window.confirm("确定删除当前自定义卡组吗？开局预设不会被删除。")) {
      store.deleteSelectedDeck();
    }
    return true;
  }

  if (action === "rename-deck") {
    const name = window.prompt("输入新的卡组名称", store.getActiveDeckName());
    if (name !== null) {
      store.renameSelectedDeck(name);
    }
    return true;
  }

  if (action === "save-deck") {
    store.saveDecks();
    return true;
  }

  if (action === "deck-filter") {
    const filter = target.dataset.filter as Parameters<GameStore["setDeckFilter"]>[0] | undefined;
    if (filter) store.setDeckFilter(filter);
    return true;
  }

  if (action === "deck-search") {
    const query = window.prompt("输入要搜索的卡名、ID 或说明文字", store.uiState.setup.deckSearch);
    if (query !== null) {
      store.setDeckSearch(query);
    }
    return true;
  }

  if (action === "deck-search-clear") {
    store.setDeckSearch("");
    return true;
  }

  if (action === "inspect-deck-card") {
    const cardId = target.dataset.cardId;
    if (cardId) store.inspectDeckCard(cardId);
    return true;
  }

  if (action === "add-deck-card") {
    const cardId = target.dataset.cardId;
    if (cardId) store.addCardToDeck(cardId);
    return true;
  }

  if (action === "remove-deck-card") {
    const cardId = target.dataset.cardId;
    if (cardId) store.removeCardFromDeck(cardId);
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

function ToastLayer({ toasts }: { toasts: ToastState[] }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-layer" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
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
  const markup =
    state.screen === "setup"
      ? store.uiState.setup.deckBuilderOpen
        ? renderDeckBuilderScreen(store)
        : renderSetupScreen(store)
      : "";

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
        <ToastLayer toasts={store.uiState.toasts} />
      </>
    );
  }

  return (
    <>
      <div className="legacy-app-root" onClick={handleClick} dangerouslySetInnerHTML={{ __html: markup }} />
      <ToastLayer toasts={store.uiState.toasts} />
    </>
  );
}

