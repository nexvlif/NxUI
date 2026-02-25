interface Window {
  nxuiManager: any;
  managerUI: any;
}

const iconBase = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
const iconTrash = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const iconRefresh = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;

class ManagerUI {
  constructor() {
    this.setupTabs();
    this.bindEvents();
    this.loadLocalWidgets();
  }

  setupTabs() {
    document.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');

        const targetTab = (btn as HTMLElement).dataset.tab;
        if (targetTab) {
          document.getElementById(targetTab)?.classList.add('active');
          if (targetTab === 'tab-store') this.loadStoreWidgets();
          if (targetTab === 'tab-settings') this.loadSettings();
          if (targetTab === 'tab-local') this.loadLocalWidgets();
        }
      });
    });
  }

  bindEvents() {
    const btnLocalRefresh = document.getElementById("btn-local-refresh");
    const btnOpenFolder = document.getElementById("btn-open-folder");
    const btnStoreRefresh = document.getElementById("btn-store-refresh");
    const selectTheme = document.getElementById("theme-select") as HTMLSelectElement;
    const toggleAutoStart = document.getElementById("autostart-toggle") as HTMLInputElement;

    btnLocalRefresh?.addEventListener("click", () => this.loadLocalWidgets());
    btnOpenFolder?.addEventListener("click", () => window.nxuiManager.openWidgetsFolder());
    btnStoreRefresh?.addEventListener("click", () => this.loadStoreWidgets());

    selectTheme?.addEventListener("change", () => this.setTheme(selectTheme.value));
    toggleAutoStart?.addEventListener("change", () => this.setAutoStart(toggleAutoStart.checked));
  }

  async loadLocalWidgets() {
    const container = document.getElementById('local-list');
    if (!container) return;

    try {
      const widgets = await window.nxuiManager.getWidgetsList();
      if (widgets.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; color:var(--text-sec); padding:40px; text-align:center;">No widgets found. Let's create one or browse the Store!</div>`;
        return;
      }

      container.innerHTML = widgets.map((w: any) => `
        <div class="card ${w.enabled ? '' : 'disabled'}">
          <div class="card-head">
            <div class="card-icon">${iconBase}</div>
            <div>
              <div class="card-title">${w.name}</div>
              <div class="card-meta">v${w.version} · ${w.author}</div>
            </div>
          </div>
          <div class="card-desc">${w.description || 'A local NxUI widget.'}</div>
          <div class="card-actions">
            <button class="action-btn" title="Reload widget" onclick="managerUI.reloadWidget('${w.id}')">${iconRefresh}</button>
            <button class="action-btn danger" title="Uninstall" onclick="managerUI.uninstallWidget('${w.id}')">${iconTrash}</button>
            <label class="toggle" title="Toggle">
              <input type="checkbox" ${w.enabled ? 'checked' : ''} onchange="managerUI.toggleWidget('${w.id}', this.checked)">
              <div class="toggle-slider"></div>
            </label>
          </div>
        </div>
      `).join('');
    } catch (err: any) {
      container.innerHTML = `<span style="color:var(--danger)">Error: ${err.message}</span>`;
    }
  }

  async loadStoreWidgets() {
    const container = document.getElementById('store-list');
    if (!container) return;

    container.innerHTML = "<div style='grid-column:1/-1; color:var(--text-sec); padding:40px; text-align:center;'>Fetching registry...</div>";
    try {
      const widgets = await window.nxuiManager.getStoreWidgets();
      container.innerHTML = widgets.map((w: any) => `
        <div class="card">
          <div class="card-head">
            <div class="card-icon" style="background:linear-gradient(135deg, #ff0080, #7928ca)">☁️</div>
            <div>
              <div class="card-title">${w.name}</div>
              <div class="card-meta">v${w.version} · ${w.author}</div>
            </div>
          </div>
          <div class="card-desc">${w.description}</div>
          <div class="card-actions" style="justify-content:flex-end;">
            <button class="action-btn success" onclick="managerUI.installWidget('${w.id}', '${w.downloadUrl}')">
              ⬇ Install Widget
            </button>
          </div>
        </div>
      `).join('');
    } catch (err: any) {
      container.innerHTML = `<span style="color:var(--danger)">Error fetching store: ${err.message}</span>`;
    }
  }

  async loadSettings() {
    const select = document.getElementById('theme-select') as HTMLSelectElement;
    if (select) {
      const data = await window.nxuiManager.getThemes();
      select.innerHTML = data.themes.map((t: any) => `<option value="${t.id}" ${t.id === data.active ? 'selected' : ''}>Theme: ${t.name}</option>`).join('');
    }
    const autoStart = await window.nxuiManager.getAutoStart();
    const toggleAutoStart = document.getElementById('autostart-toggle') as HTMLInputElement;
    if (toggleAutoStart) {
      toggleAutoStart.checked = autoStart;
    }
  }

  async toggleWidget(id: string, enabled: boolean) {
    await window.nxuiManager.toggleWidget(id, enabled);
    this.loadLocalWidgets();
  }

  async reloadWidget(id: string) {
    await window.nxuiManager.reloadWidget(id);
  }

  async uninstallWidget(id: string) {
    if (confirm('Uninstall this widget permanently?')) {
      await window.nxuiManager.uninstallWidget(id);
      this.loadLocalWidgets();
    }
  }

  async installWidget(id: string, url: string) {
    const container = document.getElementById('store-list');
    if (container) container.innerHTML = `<div style='grid-column:1/-1; color:var(--accent); padding:40px; text-align:center;'>Installing ${id}, please wait...</div>`;

    await window.nxuiManager.installStoreWidget(id, url);
    (document.querySelector('[data-tab="tab-local"]') as HTMLElement)?.click();
  }

  async setTheme(val: string) { await window.nxuiManager.setTheme(val); }
  async setAutoStart(val: boolean) { await window.nxuiManager.setAutoStart(val); }
}

const managerUI = new ManagerUI();
(window as any).managerUI = managerUI;
