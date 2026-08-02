//@ts-check
(function () {
  const vscode = acquireVsCodeApi();
  const app = document.getElementById("app");
  if (!app) {
    return;
  }

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || msg.type !== "state") {
      return;
    }
    try {
      render(msg.payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      clear(app);
      app.appendChild(
        el("p", { className: "empty", text: "畫面更新失敗：" + message }),
      );
    }
  });

  function clear(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (k === "className") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k.startsWith("on") && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v != null) node.setAttribute(k, String(v));
      }
    }
    for (const child of children) {
      if (child == null || child === false) continue;
      node.appendChild(
        child.nodeType ? child : document.createTextNode(String(child)),
      );
    }
    return node;
  }

  function statusClass(status) {
    return "status " + String(status || "idle");
  }

  function statusTextEnv(tool) {
    switch (tool.status) {
      case "ready":
        return "就緒";
      case "missing":
        return "未安裝";
      case "needs-reopen-terminal":
        return "請重開終端";
      case "failed":
        return "失敗";
      case "installing":
        return "安裝中";
      default:
        return tool.status;
    }
  }

  function render(vm) {
    clear(app);

    const hero = el(
      "header",
      { className: "hero" },
      el("img", {
        src: vm.iconUri || "",
        alt: "",
        width: "40",
        height: "40",
      }),
      el(
        "div",
        null,
        el("h1", { text: vm.title }),
        el("p", { text: vm.workspaceLabel }),
      ),
    );
    app.appendChild(hero);

    const envHead = el(
      "div",
      { className: "lane-head" },
      el("h2", { text: "環境工具" }),
      el("button", {
        className: "secondary",
        type: "button",
        text: "重新檢查",
        onclick: () => vscode.postMessage({ type: "recheck" }),
      }),
    );
    const envBody = el("div", { className: "lane-body" });
    envBody.appendChild(
      el("div", {
        className: "badge" + (vm.environment.toolchainReady ? "" : " bad"),
        text: vm.environment.badge,
      }),
    );
    if (vm.environment.tip) {
      envBody.appendChild(el("p", { className: "tip", text: vm.environment.tip }));
    }
    for (const tool of vm.environment.tools) {
      const card = el("div", { className: "card" });
      card.appendChild(
        el(
          "div",
          { className: "card-top" },
          el("p", { className: "card-title", text: tool.label }),
          el("span", {
            className: statusClass(tool.status),
            text: statusTextEnv(tool),
          }),
        ),
      );
      card.appendChild(el("p", { className: "card-detail", text: tool.detail }));
      const actions = el("div", { className: "row-actions" });
      const btn = el("button", {
        className: "primary",
        type: "button",
        text: tool.actionLabel,
        onclick: () =>
          vscode.postMessage({ type: "installEnv", toolId: tool.id }),
      });
      btn.disabled = !tool.canRun;
      actions.appendChild(btn);
      card.appendChild(actions);
      envBody.appendChild(card);
    }
    app.appendChild(el("section", { className: "lane" }, envHead, envBody));

    const courseHead = el(
      "div",
      { className: "lane-head" },
      el("h2", { text: "本課安裝" }),
    );
    const courseBody = el("div", { className: "lane-body" });
    courseBody.appendChild(
      el("p", { className: "source", text: vm.course.sourceLabel }),
    );
    if (vm.course.emptyMessage) {
      courseBody.appendChild(
        el("p", { className: "empty", text: vm.course.emptyMessage }),
      );
    }
    for (const action of vm.course.actions) {
      const disabled = !action.canRun;
      const card = el("div", {
        className: "card" + (action.disabledReason ? " disabled" : ""),
      });
      card.appendChild(
        el(
          "div",
          { className: "card-top" },
          el("p", { className: "card-title", text: action.title }),
          el("span", {
            className: statusClass(
              action.disabledReason ? "warn" : action.status,
            ),
            text: action.disabledReason ? "已禁用" : action.statusLabel,
          }),
        ),
      );
      if (action.description) {
        card.appendChild(
          el("p", { className: "card-desc", text: action.description }),
        );
      }
      if (action.disabledReason) {
        card.appendChild(
          el("p", { className: "card-detail", text: action.disabledReason }),
        );
      } else if (action.detail) {
        card.appendChild(
          el("p", { className: "card-detail", text: action.detail }),
        );
      }
      const actions = el("div", { className: "row-actions" });
      const btn = el("button", {
        className: "primary",
        type: "button",
        text: action.actionLabel,
        onclick: () =>
          vscode.postMessage({ type: "runAction", actionId: action.id }),
      });
      btn.disabled = disabled;
      actions.appendChild(btn);
      card.appendChild(actions);
      courseBody.appendChild(card);
    }
    app.appendChild(
      el("section", { className: "lane" }, courseHead, courseBody),
    );
  }

  vscode.postMessage({ type: "ready" });
})();
