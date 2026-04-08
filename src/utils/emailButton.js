export function renderFinanceEmailButton(href, label) {
  return `
    <div style="margin-top:28px;text-align:center;">
      <a href="${href}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:linear-gradient(135deg, #ffffff, #cbd5e1);color:#0f172a;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 12px 24px rgba(255,255,255,0.15);">
        ${label}
      </a>
    </div>
  `
}
