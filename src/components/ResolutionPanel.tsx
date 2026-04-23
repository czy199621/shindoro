import { getCardDefinition } from "../data/cards.js";
import type { GameState, PendingChoice } from "../types.js";
import { escapeHtml } from "./html.js";

export function renderPendingChoice(choice: PendingChoice | null): string {
  if (!choice) return "";

  if (choice.type === "optionalJump") {
    return `
      <div class="modal-backdrop">
        <div class="modal-card">
          <h3>${escapeHtml(choice.title)}</h3>
          <p>${escapeHtml(choice.description)}</p>
          <div class="modal-actions">
            <button class="secondary-btn" data-action="pending-use-jump">发动</button>
            <button class="ghost-btn" data-action="pending-skip">跳过</button>
          </div>
        </div>
      </div>
    `;
  }

  if (choice.type === "optionalGodDraw" || choice.type === "ultimateGodDraw") {
    return `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="flex-between">
            <h3>${escapeHtml(choice.title)}</h3>
            ${choice.type === "optionalGodDraw" ? `<button class="ghost-btn" data-action="pending-skip">跳过</button>` : ""}
          </div>
          <p class="small-note">${escapeHtml(choice.description ?? "请选择一张牌。")}</p>
          <div class="deck-choice-grid">
            ${choice.choices.length
              ? choice.choices
                  .map((entry) => {
                    const definition = getCardDefinition(entry.cardId);
                    return `
                      <button class="option-card" data-action="pending-pick-card" data-card-id="${escapeHtml(entry.cardId)}">
                        <h4>${escapeHtml(definition.name)}</h4>
                        <p>${escapeHtml(definition.description)}</p>
                        <p><strong>费用：</strong>${definition.cost}</p>
                        <p>剩余数量：${entry.count}</p>
                      </button>
                    `;
                  })
                  .join("")
              : `<p class="empty-text">当前没有可选的牌。</p>`}
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

export function renderGameOver(state: GameState): string {
  if (!state.winner) return "";
  return `
    <div class="modal-backdrop">
      <div class="modal-card">
        <h3>${state.winner === "P1" ? "你获得了胜利" : "AI 获得了胜利"}</h3>
        <p class="small-note">可以直接重新开始一局，继续验证新的角色、天赋和阶段流程。</p>
        <div class="modal-actions">
          <button class="primary-btn" data-action="restart">重新开始</button>
        </div>
      </div>
    </div>
  `;
}
