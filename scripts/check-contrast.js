/* Run in Obsidian DevTools with its app.css and the release theme.css.
 * An isolated iframe avoids snippets/plugins and leaves the user's UI unchanged.
 * State classes mirror native hover/focus selectors for deterministic coverage.
 */
(async function checkContrast(baseCss, themeCss) {
  const cases = [
    ["search-expanded", '<div class="search-result"><div class="tree-item-self search-result-file-title">Text</div></div>'],
    ["search-collapsed", '<div class="search-result is-collapsed"><div class="tree-item-self search-result-file-title">Text</div></div>'],
    ["search-hover", '<div class="search-result"><div class="tree-item-self search-result-file-title np-test-hover">Text</div></div>'],
    ["search-highlight", '<div class="search-result"><div class="tree-item-self search-result-file-title"><span class="search-result-file-matched-text">Text</span></div></div>'],
    ["search-context", '<div class="search-result-file-matches"><div class="search-result-file-match">Text</div></div>'],
    ["search-context-hover", '<div class="search-result-file-matches"><div class="search-result-file-match np-test-hover">Text</div></div>'],
    ["search-context-mobile-tap", '<div class="search-result-file-matches"><div class="search-result-file-match mobile-tap">Text</div></div>'],
    ["file-active", '<div class="tree-item-self nav-file-title is-active">Text</div>'],
    ["file-active-hover", '<div class="tree-item-self nav-file-title is-active np-test-hover">Text</div>'],
    ["file-renaming", '<div class="tree-item-self is-being-renamed np-test-focus-within">Text</div>'],
    ["file-tag-active", '<div class="tree-item-self is-active"><span class="nav-file-tag">MD</span></div>'],
    ["file-count-active", '<div class="tree-item-self is-active"><span class="tree-item-flair">12</span></div>'],
    ["file-dragged", '<div class="tree-item-self is-being-dragged">Text</div>'],
    ["pdf-outline-active", '<div class="pdf-outline-view"><div class="tree-item-self mod-active">Text</div></div>'],
    ["file-tree-badge", '<div class="file-tree"><div class="tree-item-self"><span class="tree-item-flair">Text</span></div></div>'],
    ["suggestion-selected", '<div class="suggestion-item is-selected">Text</div>'],
    ["menu-hover", '<div class="menu"><div class="menu-item np-test-hover"><div class="menu-item-title">Text</div></div></div>'],
    ["recent-vault-hover", '<div class="recent-vaults-list-item np-test-hover">Text</div>'],
    ["sync-avatar", '<div class="sync-history-list-item-header"><div class="sync-history-list-item-avatar">AB</div></div>'],
    ["sync-version-muted", '<div class="sync-history-list-item"><div class="version-group-container"><div class="version-group-item is-active"><span class="u-muted">Text</span></div></div></div>'],
    ["button-default", '<button>Text</button>'],
    ["button-accent", '<button class="mod-cta">Text</button>'],
    ["button-accent-hover", '<button class="mod-cta np-test-hover">Text</button>'],
    ["button-warning", '<button class="mod-warning">Text</button>'],
    ["button-destructive", '<button class="mod-destructive mod-cta">Text</button>'],
    ["hotkey-conflict", '<span class="setting-hotkey has-conflict">Text</span>'],
    ["message-error", '<div class="message mod-error">Text</div>'],
    ["message-success", '<div class="message mod-success">Text</div>'],
    ["tag-active", '<div class="tag-pane-tag is-active">Text</div>'],
    ["settings-sidebar-active", '<div class="modal-sidebar-list-item is-active">Text</div>'],
    ["flair-accent", '<span class="flair mod-pop">Text</span>'],
    ["tooltip", '<div class="tooltip">Text</div>'],
    ["tooltip-error", '<div class="tooltip mod-error">Text</div>'],
    ["prose-highlight", '<div class="markdown-rendered"><p><mark>Text</mark></p></div>'],
    ["code-comment", '<div class="markdown-rendered"><pre><code><span class="token comment">Text</span></code></pre></div>'],
    ...["function", "keyword", "string", "number", "operator"].map(token => [`code-${token}`, `<div class="markdown-rendered"><pre><code><span class="token ${token}">Text</span></code></pre></div>`]),
    ["quote", '<div class="markdown-rendered"><blockquote><p>Text</p></blockquote></div>'],
    ["table-header", '<div class="markdown-rendered"><table><thead><tr><th>Text</th></tr></thead></table></div>'],
    ["table-alternate", '<div class="markdown-rendered"><table><tbody><tr><td>Text</td></tr><tr><td>Text</td></tr></tbody></table></div>'],
    ["external-link", '<div class="markdown-rendered"><p><a class="external-link">Text</a></p></div>'],
    ["inline-code", '<div class="markdown-rendered"><p><code>Text</code></p></div>'],
    ["text-error", '<span style="color:var(--text-error)">Text</span>'],
    ["text-success", '<span style="color:var(--text-success)">Text</span>'],
    ["text-muted", '<span class="u-muted">Text</span>'],
    ["text-faint", '<span style="color:var(--text-faint)">Text</span>']
  ];
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;left:-10000px;width:800px;height:600px";
  const loaded = new Promise(resolve => frame.addEventListener("load", resolve, { once: true }));
  document.body.append(frame);
  await loaded;
  const doc = frame.contentDocument;
  const style = doc.createElement("style");
  const states = css => css.replaceAll(":hover", ".np-test-hover")
    .replaceAll(":focus-within", ".np-test-focus-within");
  style.textContent = states(baseCss) + "\n" + states(themeCss) +
    "\n* { animation: none !important; transition: none !important; }";
  doc.head.append(style);
  const rgb = value => {
    const pixel = doc.createElement("canvas").getContext("2d");
    pixel.fillStyle = value;
    pixel.fillRect(0, 0, 1, 1);
    return [...pixel.getImageData(0, 0, 1, 1).data].map((v, i) => i === 3 ? v / 255 : v);
  };
  const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
  const luminance = color => color.reduce((sum, v, i) => {
    const s = v / 255;
    return sum + (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
  }, 0);
  const rows = [];
  try {
    for (const mode of ["light", "dark"]) {
      doc.body.className = `theme-${mode} mod-macos`;
      doc.body.style.backgroundColor = "var(--background-primary)";
      await new Promise(resolve => setTimeout(resolve, 30));
      for (const [name, html] of cases) {
        const root = doc.createElement("div");
        root.innerHTML = html;
        doc.body.append(root);
        const el = [...root.querySelectorAll("*")].at(-1);
        const layers = [];
        for (let e = el; e; e = e.parentElement) layers.unshift(e);
        let bg = [255, 255, 255];
        let opacity = 1;
        for (const e of layers) {
          const cs = doc.defaultView.getComputedStyle(e);
          bg = over(rgb(cs.backgroundColor), bg);
          opacity *= Number(cs.opacity);
        }
        const color = doc.defaultView.getComputedStyle(el).color;
        const fg = rgb(color);
        fg[3] *= opacity;
        const a = luminance(over(fg, bg)), b = luminance(bg);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        rows.push({ mode, name, color, background: bg, ratio: Number(ratio.toFixed(2)), pass: ratio >= 4.5 });
        root.remove();
      }
    }
    return { threshold: 4.5, states: "isolated native CSS with mirrored hover/focus classes", rows, failures: rows.filter(r => !r.pass) };
  } finally {
    frame.remove();
  }
})
