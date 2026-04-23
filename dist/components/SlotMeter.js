import { escapeHtml } from "./html.js";
export function renderSlotMeter(label, current, colorClass, description) {
    const percentage = Math.min((current / 13) * 100, 100);
    return `
    <div class="slot-card">
      <div class="flex-between">
        <strong>${escapeHtml(label)}</strong>
        <span class="small-note">${current}/13</span>
      </div>
      <div class="slot-bar" aria-hidden="true">
        <div class="slot-fill ${colorClass}" style="width:${percentage}%"></div>
      </div>
      <p class="small-note">${escapeHtml(description)}</p>
    </div>
  `;
}
