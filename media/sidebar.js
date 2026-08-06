//@ts-check
(function () {
  const vscode = acquireVsCodeApi();
  const app = document.getElementById("app");
  if (!app) {
    return;
  }

  /** Session 內記住收合；webview 腳本重載後回到展開。 */
  const laneCollapsed = {
    router: false,
    environment: false,
    course: false,
  };

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

  /**
   * @param {"router" | "environment" | "course"} laneId
   * @param {string} title
   * @param {HTMLElement | null} trailing
   */
  function laneHeader(laneId, title, trailing) {
    const collapsed = laneCollapsed[laneId];
    const toggle = el(
      "button",
      {
        className: "lane-head-main",
        type: "button",
        "aria-expanded": collapsed ? "false" : "true",
        onclick: () => {
          laneCollapsed[laneId] = !laneCollapsed[laneId];
          const section = app.querySelector(
            'section.lane[data-lane="' + laneId + '"]',
          );
          if (!(section instanceof HTMLElement)) {
            return;
          }
          section.classList.toggle("collapsed", laneCollapsed[laneId]);
          const chevron = section.querySelector(".lane-chevron");
          if (chevron) {
            chevron.textContent = laneCollapsed[laneId] ? "▶" : "▼";
          }
          const btn = section.querySelector(".lane-head-main");
          if (btn instanceof HTMLElement) {
            btn.setAttribute(
              "aria-expanded",
              laneCollapsed[laneId] ? "false" : "true",
            );
          }
        },
      },
      el("span", {
        className: "lane-chevron",
        text: collapsed ? "▶" : "▼",
        "aria-hidden": "true",
      }),
      el("h2", { text: title }),
    );
    const head = el("div", { className: "lane-head" }, toggle);
    if (trailing) {
      head.appendChild(trailing);
    }
    return head;
  }

  function render(vm) {
    clear(app);

    const hero = el(
      "header",
      { className: "hero" },
      el(
        "div",
        { className: "logo-badge" },
        el("img", {
          src: vm.iconUri || "",
          alt: "",
          width: "40",
          height: "40",
        }),
      ),
      el(
        "div",
        null,
        el("h1", { className: "gradient-text", text: vm.title }),
        el("p", { text: vm.workspaceLabel }),
      ),
    );
    app.appendChild(hero);

    const router = vm.router || {
      status: "idle",
      statusLabel: "尚未設定",
      inviteCode: "",
      detail: "",
      showPasteUi: false,
      canOpenSignIn: false,
      canRedeem: false,
      signInLabel: "連線登入",
      redeemLabel: "貼上並完成連線",
    };
    const routerHead = laneHeader("router", "課堂連線", null);
    const routerBody = el("div", { className: "lane-body" });
    routerBody.appendChild(
      el("span", {
        className: statusClass(router.status),
        text: router.statusLabel,
      }),
    );
    if (router.classLabel) {
      routerBody.appendChild(
        el("p", { className: "card-detail", text: router.classLabel }),
      );
    }
    routerBody.appendChild(
      el("p", { className: "card-detail", text: router.detail || "" }),
    );
    const inviteField = el(
      "div",
      { className: "field" },
      el("label", { text: "邀請碼", for: "invite-code" }),
      el("input", {
        id: "invite-code",
        type: "text",
        value: router.inviteCode || "",
        placeholder: "老師提供的邀請碼",
        autocomplete: "off",
        oninput: (ev) => {
          const value = ev.target && ev.target.value != null ? String(ev.target.value) : "";
          vscode.postMessage({ type: "setInviteCode", inviteCode: value });
        },
      }),
    );
    routerBody.appendChild(inviteField);
    const showPasteUi = !!router.showPasteUi;
    if (showPasteUi) {
      const pasteField = el(
        "div",
        { className: "field" },
        el("label", { text: "一次性貼碼（深連結失敗時）", for: "handoff-paste" }),
        el("textarea", {
          id: "handoff-paste",
          placeholder: "從瀏覽器複製貼碼到這裡",
        }),
      );
      routerBody.appendChild(pasteField);
    }
    const routerActions = el("div", { className: "row-actions" });
    const signInBtn = el("button", {
      className: "primary",
      type: "button",
      text: router.signInLabel || "連線登入",
      onclick: () => vscode.postMessage({ type: "routerSignIn" }),
    });
    signInBtn.disabled = !router.canOpenSignIn;
    routerActions.appendChild(signInBtn);
    if (showPasteUi) {
      const redeemBtn = el("button", {
        className: "secondary",
        type: "button",
        text: router.redeemLabel || "貼上並完成連線",
        onclick: () => {
          const paste = document.getElementById("handoff-paste");
          const pasteValue =
            paste instanceof HTMLTextAreaElement ? paste.value.trim() : "";
          if (pasteValue) {
            vscode.postMessage({ type: "routerHandoffPaste", raw: pasteValue });
          } else {
            vscode.postMessage({ type: "routerRedeem" });
          }
        },
      });
      redeemBtn.disabled = !router.canRedeem;
      routerActions.appendChild(redeemBtn);
    }
    if (router.canClear) {
      const clearBtn = el("button", {
        className: "secondary",
        type: "button",
        text: router.clearLabel || "清除課堂連線",
        onclick: () => vscode.postMessage({ type: "routerClear" }),
      });
      routerActions.appendChild(clearBtn);
    }
    routerBody.appendChild(routerActions);
    app.appendChild(
      el(
        "section",
        {
          className: "lane" + (laneCollapsed.router ? " collapsed" : ""),
          "data-lane": "router",
        },
        routerHead,
        routerBody,
      ),
    );

    const recheck = el("button", {
      className: "secondary",
      type: "button",
      text: "重新檢查",
      onclick: () => vscode.postMessage({ type: "recheck" }),
    });
    const envHead = laneHeader("environment", "環境工具", recheck);
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
    app.appendChild(
      el(
        "section",
        {
          className: "lane" + (laneCollapsed.environment ? " collapsed" : ""),
          "data-lane": "environment",
        },
        envHead,
        envBody,
      ),
    );

    const retryRemote =
      vm.course.canRetryRemote
        ? el("button", {
            className: "secondary",
            type: "button",
            text:
              vm.course.catalogSource === "session" ? "重新載入" : "再試遠端",
            onclick: () => vscode.postMessage({ type: "retryRemoteCatalog" }),
          })
        : null;
    const courseHead = laneHeader("course", "本課安裝", retryRemote);
    const courseBody = el("div", { className: "lane-body" });
    if (vm.course.tip) {
      courseBody.appendChild(el("p", { className: "tip", text: vm.course.tip }));
    }
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
          el(
            "div",
            { className: "card-title-row" },
            el("span", {
              className: "kind-tag",
              text: action.kindLabel,
            }),
            el("p", { className: "card-title", text: action.title }),
          ),
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
      el(
        "section",
        {
          className: "lane" + (laneCollapsed.course ? " collapsed" : ""),
          "data-lane": "course",
        },
        courseHead,
        courseBody,
      ),
    );
  }

  vscode.postMessage({ type: "ready" });
})();
