/** 產生側邊欄 Webview HTML（CSP + nonce）。畫面資料由 postMessage 注入後於腳本內渲染。 */
export function getSidebarWebviewHtml(nonce: string, cspSource: string): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}; img-src ${cspSource} https: data:;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>凡思課堂安裝</title>
  <style>
    :root {
      --vans-accent: #3d9a5f;
      --vans-accent-hover: #2f7d4c;
      --vans-accent-muted: color-mix(in srgb, var(--vans-accent) 18%, transparent);
      --ok: var(--vscode-testing-iconPassed, #3d9a5f);
      --err: var(--vscode-testing-iconFailed, #e11d48);
      --warn: var(--vscode-editorWarning-foreground, #d97706);
      --radius: 10px;
      --pad: 12px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 10px 10px 20px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      line-height: 1.45;
    }
    header.hero {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 14px;
      padding: 12px;
      border-radius: var(--radius);
      background: linear-gradient(135deg, var(--vans-accent-muted), transparent 70%);
      border: 1px solid var(--vscode-sideBarSectionHeader-border, transparent);
    }
    header.hero img {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      flex-shrink: 0;
    }
    header.hero h1 {
      margin: 0;
      font-size: 14px;
      font-weight: 650;
      letter-spacing: 0.02em;
    }
    header.hero p {
      margin: 2px 0 0;
      opacity: 0.8;
      font-size: 11px;
    }
    section.lane {
      margin-bottom: 14px;
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, #4444));
      border-radius: var(--radius);
      background: var(--vscode-editor-background);
      overflow: hidden;
    }
    .lane-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px var(--pad);
      background: var(--vscode-sideBarSectionHeader-background, transparent);
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, transparent);
    }
    .lane-head h2 {
      margin: 0;
      font-size: 12px;
      font-weight: 650;
      text-transform: none;
    }
    .lane-body { padding: 10px var(--pad) 12px; }
    .badge {
      display: inline-block;
      margin-bottom: 10px;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      background: var(--vans-accent-muted);
      color: var(--vscode-foreground);
    }
    .badge.bad {
      background: color-mix(in srgb, var(--warn) 16%, transparent);
    }
    .tip, .empty {
      margin: 0 0 10px;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 11px;
      background: var(--vscode-inputValidation-infoBackground, rgba(127,127,127,.12));
      border-left: 3px solid var(--vans-accent);
    }
    .empty { border-left-color: var(--warn); }
    .card {
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--vscode-widget-border, rgba(127,127,127,.25));
      background: var(--vscode-sideBar-background);
      margin-bottom: 8px;
    }
    .card:last-child { margin-bottom: 0; }
    .card.disabled { opacity: 0.72; }
    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .card-title {
      margin: 0;
      font-size: 12.5px;
      font-weight: 600;
    }
    .card-desc, .card-detail {
      margin: 4px 0 0;
      font-size: 11px;
      opacity: 0.85;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10.5px;
      padding: 2px 7px;
      border-radius: 999px;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .status.ready, .status.succeeded { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 35%, transparent); }
    .status.missing, .status.failed { color: var(--err); border-color: color-mix(in srgb, var(--err) 35%, transparent); }
    .status.needs-reopen-terminal, .status.unverified, .status.warn {
      color: var(--warn);
      border-color: color-mix(in srgb, var(--warn) 35%, transparent);
    }
    .status.installing, .status.running {
      color: var(--vans-accent);
      border-color: color-mix(in srgb, var(--vans-accent) 40%, transparent);
    }
    .status.idle { opacity: 0.75; }
    .row-actions { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
    button {
      font: inherit;
      cursor: pointer;
      border-radius: 6px;
      border: 1px solid transparent;
      padding: 5px 10px;
      font-size: 11.5px;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button.primary {
      background: var(--vans-accent);
      color: #fff;
    }
    button.primary:hover:not(:disabled) { background: var(--vans-accent-hover); }
    button.secondary {
      background: transparent;
      color: var(--vscode-foreground);
      border-color: var(--vscode-button-secondaryBackground, rgba(127,127,127,.35));
    }
    button.secondary:hover:not(:disabled) {
      background: var(--vscode-toolbar-hoverBackground, rgba(127,127,127,.12));
    }
    .source {
      margin: 0 0 8px;
      font-size: 11px;
      opacity: 0.75;
    }
  </style>
</head>
<body>
  <div id="app"><p class="empty">載入中…</p></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const app = document.getElementById('app');

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || msg.type !== 'state') return;
      render(msg.payload);
    });

    function el(tag, props, ...children) {
      const node = document.createElement(tag);
      if (props) {
        for (const [k, v] of Object.entries(props)) {
          if (k === 'className') node.className = v;
          else if (k === 'text') node.textContent = v;
          else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
          else if (v != null) node.setAttribute(k, String(v));
        }
      }
      for (const child of children) {
        if (child == null || child === false) continue;
        node.append(child.nodeType ? child : document.createTextNode(String(child)));
      }
      return node;
    }

    function statusClass(status) {
      return 'status ' + String(status || 'idle');
    }

    function render(vm) {
      app.replaceChildren();
      const hero = el('header', { className: 'hero' },
        el('img', { src: vm.iconUri || '', alt: '', width: '40', height: '40' }),
        el('div', null,
          el('h1', { text: vm.title }),
          el('p', { text: vm.workspaceLabel }),
        ),
      );
      app.append(hero);

      // Environment
      const envHead = el('div', { className: 'lane-head' },
        el('h2', { text: '環境工具' }),
        el('button', {
          className: 'secondary',
          type: 'button',
          text: '重新檢查',
          onclick: () => vscode.postMessage({ type: 'recheck' }),
        }),
      );
      const envBody = el('div', { className: 'lane-body' });
      envBody.append(
        el('div', {
          className: 'badge' + (vm.environment.toolchainReady ? '' : ' bad'),
          text: vm.environment.badge,
        }),
      );
      if (vm.environment.tip) {
        envBody.append(el('p', { className: 'tip', text: vm.environment.tip }));
      }
      for (const tool of vm.environment.tools) {
        const card = el('div', { className: 'card' });
        card.append(
          el('div', { className: 'card-top' },
            el('p', { className: 'card-title', text: tool.label }),
            el('span', { className: statusClass(tool.status), text: statusTextEnv(tool) }),
          ),
          el('p', { className: 'card-detail', text: tool.detail }),
        );
        const actions = el('div', { className: 'row-actions' });
        const btn = el('button', {
          className: 'primary',
          type: 'button',
          text: tool.actionLabel,
          onclick: () => vscode.postMessage({ type: 'installEnv', toolId: tool.id }),
        });
        btn.disabled = !tool.canRun;
        actions.append(btn);
        card.append(actions);
        envBody.append(card);
      }
      app.append(el('section', { className: 'lane' }, envHead, envBody));

      // Course
      const courseHead = el('div', { className: 'lane-head' },
        el('h2', { text: '本課安裝' }),
      );
      const courseBody = el('div', { className: 'lane-body' });
      courseBody.append(el('p', { className: 'source', text: vm.course.sourceLabel }));
      if (vm.course.emptyMessage) {
        courseBody.append(el('p', { className: 'empty', text: vm.course.emptyMessage }));
      }
      for (const action of vm.course.actions) {
        const disabled = !action.canRun;
        const card = el('div', { className: 'card' + (action.disabledReason ? ' disabled' : '') });
        card.append(
          el('div', { className: 'card-top' },
            el('p', { className: 'card-title', text: action.title }),
            el('span', {
              className: statusClass(action.disabledReason ? 'warn' : action.status),
              text: action.disabledReason ? '已禁用' : action.statusLabel,
            }),
          ),
        );
        if (action.description) {
          card.append(el('p', { className: 'card-desc', text: action.description }));
        }
        if (action.disabledReason) {
          card.append(el('p', { className: 'card-detail', text: action.disabledReason }));
        } else if (action.detail) {
          card.append(el('p', { className: 'card-detail', text: action.detail }));
        }
        const actions = el('div', { className: 'row-actions' });
        const btn = el('button', {
          className: 'primary',
          type: 'button',
          text: action.actionLabel,
          onclick: () => vscode.postMessage({ type: 'runAction', actionId: action.id }),
        });
        btn.disabled = disabled;
        actions.append(btn);
        card.append(actions);
        courseBody.append(card);
      }
      app.append(el('section', { className: 'lane' }, courseHead, courseBody));
    }

    function statusTextEnv(tool) {
      switch (tool.status) {
        case 'ready': return '就緒';
        case 'missing': return '未安裝';
        case 'needs-reopen-terminal': return '請重開終端';
        case 'failed': return '失敗';
        case 'installing': return '安裝中';
        default: return tool.status;
      }
    }

    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}
