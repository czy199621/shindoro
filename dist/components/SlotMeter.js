import { escapeHtml } from "./html.js";
export function renderSlotMeter(label, current, colorClass) {
    const percentage = Math.min((current / 13) * 100, 100);
    return `
    <div class="slot-card">
      <div class="slot-card-header">
        <strong class="slot-card-label">${escapeHtml(label)}</strong>
        <span class="small-note slot-card-count">${current}/13</span>
      </div>
      <div class="slot-bar" aria-hidden="true">
        <div class="slot-fill ${colorClass}" style="width:${percentage}%"></div>
      </div>
    </div>
  `;
}
