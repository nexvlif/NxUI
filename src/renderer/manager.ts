interface Window {
  nxuiManager: any;
  managerUI: any;
}

const iconBase = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
const iconTrash = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const iconRefresh = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;
const iconSettings = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

class ManagerUI {
  private memoryInterval: any = null;
  private tmInterval: any = null;

  constructor() {
    this.setupTabs();
    this.bindEvents();
    this.loadLocalWidgets();
    this.loadLogo();
  }

  async loadLogo() {
    try {
      const info = await window.nxuiManager.getAppInfo();
      const logoImg = document.getElementById('logo-img') as HTMLImageElement;
      const aboutLogoImg = document.getElementById('about-logo-img') as HTMLImageElement;
      const iconPath = '../../assets/icon.png';
      if (logoImg) logoImg.src = iconPath;
      if (aboutLogoImg) aboutLogoImg.src = iconPath;

      const accent = await window.nxuiManager.getAccentColor();
      this.applyMaterialYou(accent);

      window.nxuiManager.onAccentColorChanged((newColor: string) => {
        this.applyMaterialYou(newColor);
      });
    } catch { }
  }

  applyMaterialYou(hexColor: string) {
    const hex2rgb = (hex: string) => {
      let c = hex.substring(1);
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
    };
    const rgb2hsl = (r: number, g: number, b: number) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return [h * 360, s * 100, l * 100];
    };

    const [r, g, b] = hex2rgb(hexColor);
    const [h, s, l] = rgb2hsl(r, g, b);

    const root = document.documentElement;
    root.style.setProperty('--md-sys-color-primary', `hsl(${h}, ${s}%, 80%)`);
    root.style.setProperty('--md-sys-color-on-primary', `hsl(${h}, ${s}%, 20%)`);
    root.style.setProperty('--md-sys-color-primary-container', `hsl(${h}, ${s}%, 30%)`);
    root.style.setProperty('--md-sys-color-on-primary-container', `hsl(${h}, ${s}%, 90%)`);

    root.style.setProperty('--md-sys-color-surface', `hsl(${h}, 10%, 10%)`);
    root.style.setProperty('--md-sys-color-surface-container', `hsl(${h}, 10%, 15%)`);
    root.style.setProperty('--md-sys-color-on-surface', `hsl(${h}, 10%, 90%)`);
    root.style.setProperty('--md-sys-color-outline', `hsl(${h}, 10%, 30%)`);

    root.style.setProperty('--accent', `hsl(${h}, ${s}%, 70%)`);
    root.style.setProperty('--accent-dim', `hsl(${h}, ${s}%, 15%)`);
  }

  setupTabs() {
    document.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');

        if (this.tmInterval) {
          clearInterval(this.tmInterval);
          this.tmInterval = null;
        }

        const targetTab = (btn as HTMLElement).dataset.tab;
        if (targetTab) {
          document.getElementById(targetTab)?.classList.add('active');
          if (targetTab === 'tab-store') this.loadStoreWidgets();
          if (targetTab === 'tab-settings') this.loadSettings();
          if (targetTab === 'tab-local') this.loadLocalWidgets();
          if (targetTab === 'tab-taskmanager') this.loadTaskManager();
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
    const toggleFocusMode = document.getElementById("focusmode-toggle") as HTMLInputElement;
    const btnHideAll = document.getElementById("btn-hide-all");
    const btnSaveProfile = document.getElementById("btn-save-profile");
    const btnCloseSettings = document.getElementById("btn-close-settings");
    const modalBackdrop = document.querySelector(".settings-modal-backdrop");
    const btnTmRefresh = document.getElementById("btn-tm-refresh");

    btnLocalRefresh?.addEventListener("click", () => this.loadLocalWidgets());
    btnOpenFolder?.addEventListener("click", () => window.nxuiManager.openWidgetsFolder());
    btnStoreRefresh?.addEventListener("click", () => this.loadStoreWidgets());

    selectTheme?.addEventListener("change", () => this.setTheme(selectTheme.value));
    toggleAutoStart?.addEventListener("change", () => this.setAutoStart(toggleAutoStart.checked));
    toggleFocusMode?.addEventListener("change", () => this.setFocusMode(toggleFocusMode.checked));
    btnHideAll?.addEventListener("click", () => window.nxuiManager.hideAllWidgets());
    btnSaveProfile?.addEventListener("click", () => this.saveProfile());
    btnCloseSettings?.addEventListener("click", () => this.closeSettingsModal());
    modalBackdrop?.addEventListener("click", () => this.closeSettingsModal());
    btnTmRefresh?.addEventListener("click", () => this.refreshTaskManager());
  }

  async loadLocalWidgets() {
    const container = document.getElementById('local-list');
    if (!container) return;

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }

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
              <div class="card-meta">
                v${w.version} · ${w.author}
                <span class="memory-badge" id="mem-${w.id}">— MB</span>
              </div>
            </div>
          </div>
          <div class="card-desc">${w.description || 'A local NxUI widget.'}</div>
          <div class="card-opacity">
            <label>Opacity</label>
            <input type="range" class="opacity-slider" min="10" max="100" value="${Math.round((w.opacity || 1) * 100)}"
              oninput="managerUI.setOpacity('${w.id}', this.value, this.parentElement.querySelector('.opacity-value'))">
            <span class="opacity-value">${Math.round((w.opacity || 1) * 100)}%</span>
          </div>
          <div class="card-actions">
            <button class="action-btn settings-btn" title="Widget Settings" onclick="managerUI.openWidgetSettings('${w.id}', '${w.name}')">${iconSettings}</button>
            <button class="action-btn" title="Reload widget" onclick="managerUI.reloadWidget('${w.id}')">${iconRefresh}</button>
            <button class="action-btn danger" title="Uninstall" onclick="managerUI.uninstallWidget('${w.id}')">${iconTrash}</button>
            <label class="toggle" title="Toggle">
              <input type="checkbox" ${w.enabled ? 'checked' : ''} onchange="managerUI.toggleWidget('${w.id}', this.checked)">
              <div class="toggle-slider"></div>
            </label>
          </div>
        </div>
      `).join('');

      this.updateMemoryBadges(widgets);
      this.memoryInterval = setInterval(() => this.updateMemoryBadges(widgets), 5000);
    } catch (err: any) {
      container.innerHTML = `<span style="color:var(--danger)">Error: ${err.message}</span>`;
    }
  }

  async updateMemoryBadges(widgets: any[]) {
    for (const w of widgets) {
      try {
        const data = await window.nxuiManager.getWidgetMemory(w.id);
        const el = document.getElementById(`mem-${w.id}`);
        if (el) {
          el.textContent = `${data.memory || '—'} MB`;
        }
      } catch { }
    }
  }

  async loadTaskManager() {
    await this.refreshTaskManager();
    this.tmInterval = setInterval(() => this.refreshTaskManager(), 3000);
  }

  async refreshTaskManager() {
    try {
      const data = await window.nxuiManager.getTaskManager();

      const setText = (id: string, text: string) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      };

      const maxTarget = 80;
      const memPercent = Math.min(100, Math.round((data.totalMemory / maxTarget) * 100));

      setText('tm-total-mem', `${data.totalMemory} MB`);
      setText('tm-main-mem', `${data.mainProcess.rss} MB`);
      setText('tm-widget-mem', `${data.totalWidgetMemory} MB`);

      const formatUptime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
      };
      setText('tm-uptime', formatUptime(data.uptime));

      const bar = document.getElementById('tm-total-bar');
      if (bar) {
        bar.style.width = memPercent + '%';
        bar.className = `tm-stat-bar${memPercent > 90 ? ' warning' : ''}`;
      }

      setText('tm-heap-used', `${data.mainProcess.heapUsed} MB`);
      setText('tm-heap-total', `${data.mainProcess.heapTotal} MB`);
      setText('tm-external', `${data.mainProcess.external} MB`);
      setText('tm-pid', `${data.pid}`);

      const widgetList = document.getElementById('tm-widget-list');
      if (widgetList) {
        if (data.widgets.length === 0) {
          widgetList.innerHTML = '<div style="color:var(--text-mut); font-size:12px; padding:8px;">No widgets loaded.</div>';
        } else {
          const maxWidgetMem = Math.max(...data.widgets.map((w: any) => w.memory), 1);
          widgetList.innerHTML = data.widgets.map((w: any) => `
            <div class="tm-widget-row">
              <span class="tm-widget-name">${w.name}</span>
              <span class="tm-widget-status ${w.enabled ? 'active' : 'inactive'}">${w.enabled ? 'ACTIVE' : 'OFF'}</span>
              <div class="tm-widget-bar">
                <div class="tm-widget-bar-fill" style="width:${Math.round((w.memory / maxWidgetMem) * 100)}%"></div>
              </div>
              <span class="tm-widget-mem">${w.memory} MB</span>
            </div>
          `).join('');
        }
      }
    } catch (err: any) {
      console.error('[TaskManager] Refresh failed:', err);
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

    const focusMode = await window.nxuiManager.getFocusMode();
    const toggleFocusMode = document.getElementById('focusmode-toggle') as HTMLInputElement;
    if (toggleFocusMode) {
      toggleFocusMode.checked = focusMode;
    }

    await this.loadProfiles();
    await this.loadAbout();
  }

  async loadProfiles() {
    const container = document.getElementById('profiles-list');
    if (!container) return;

    const profiles = await window.nxuiManager.getProfiles();
    const names = Object.keys(profiles);

    if (names.length === 0) {
      container.innerHTML = '<div style="color:var(--text-mut); font-size:12px; padding:8px 0;">No saved profiles yet.</div>';
      return;
    }

    container.innerHTML = names.map(name => `
      <div class="profile-item">
        <span class="profile-name">${name}</span>
        <div class="profile-actions">
          <button class="profile-btn load" onclick="managerUI.loadProfile('${name}')">Load</button>
          <button class="profile-btn delete" onclick="managerUI.deleteProfile('${name}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  async loadAbout() {
    try {
      const info = await window.nxuiManager.getAppInfo();
      const versionPill = document.getElementById('version-pill');
      if (versionPill) versionPill.textContent = `v${info.version}`;

      const aboutVersion = document.getElementById('about-version');
      if (aboutVersion) aboutVersion.textContent = `v${info.version}`;

      const setEl = (id: string, text: string) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      };

      setEl('about-electron', `v${info.electronVersion}`);
      setEl('about-node', `v${info.nodeVersion}`);
      setEl('about-chrome', `v${info.chromeVersion}`);
      setEl('about-platform', `${info.platform} (${info.arch})`);
    } catch { }
  }

  async saveProfile() {
    const input = document.getElementById('profile-name-input') as HTMLInputElement;
    const name = input?.value.trim();
    if (!name) return;

    await window.nxuiManager.saveProfile(name);
    input.value = '';
    await this.loadProfiles();
  }

  async loadProfile(name: string) {
    await window.nxuiManager.loadProfile(name);
    this.loadLocalWidgets();
  }

  async deleteProfile(name: string) {
    if (confirm(`Delete profile "${name}"?`)) {
      await window.nxuiManager.deleteProfile(name);
      await this.loadProfiles();
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

  setOpacity(id: string, value: string, display: HTMLElement) {
    const opacity = parseInt(value) / 100;
    display.textContent = value + '%';
    window.nxuiManager.setWidgetOpacity(id, opacity);
  }

  async openWidgetSettings(id: string, name: string) {
    const modal = document.getElementById('widget-settings-modal');
    const title = document.getElementById('settings-modal-title');
    const body = document.getElementById('settings-modal-body');
    if (!modal || !title || !body) return;

    title.textContent = `${name} Settings`;

    try {
      const data = await window.nxuiManager.getWidgetSettings(id);
      const { schema, values } = data;

      if (!schema || schema.length === 0) {
        body.innerHTML = '<div class="modal-empty">This widget has no configurable settings.</div>';
      } else {
        body.innerHTML = schema.map((s: any) => {
          const currentValue = values[s.key] !== undefined ? values[s.key] : s.default;

          if (s.type === 'range') {
            return `
              <div class="modal-setting-row">
                <div class="modal-setting-label">${s.label}</div>
                ${s.description ? `<div class="modal-setting-desc">${s.description}</div>` : ''}
                <input type="range" min="${s.min || 0}" max="${s.max || 100}" step="${s.step || 1}" value="${currentValue}"
                  oninput="managerUI.setSettingValue('${id}', '${s.key}', parseFloat(this.value))">
              </div>`;
          }

          if (s.type === 'toggle') {
            return `
              <div class="modal-setting-row" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div class="modal-setting-label">${s.label}</div>
                  ${s.description ? `<div class="modal-setting-desc">${s.description}</div>` : ''}
                </div>
                <label class="toggle">
                  <input type="checkbox" ${currentValue ? 'checked' : ''}
                    onchange="managerUI.setSettingValue('${id}', '${s.key}', this.checked)">
                  <div class="toggle-slider"></div>
                </label>
              </div>`;
          }

          if (s.type === 'select') {
            const options = (s.options || []).map((o: any) =>
              `<option value="${o.value}" ${currentValue === o.value ? 'selected' : ''}>${o.label}</option>`
            ).join('');
            return `
              <div class="modal-setting-row">
                <div class="modal-setting-label">${s.label}</div>
                ${s.description ? `<div class="modal-setting-desc">${s.description}</div>` : ''}
                <select onchange="managerUI.setSettingValue('${id}', '${s.key}', this.value)">${options}</select>
              </div>`;
          }

          if (s.type === 'color') {
            return `
              <div class="modal-setting-row">
                <div class="modal-setting-label">${s.label}</div>
                ${s.description ? `<div class="modal-setting-desc">${s.description}</div>` : ''}
                <input type="color" value="${currentValue}"
                  onchange="managerUI.setSettingValue('${id}', '${s.key}', this.value)">
              </div>`;
          }

          return `
            <div class="modal-setting-row">
              <div class="modal-setting-label">${s.label}</div>
              ${s.description ? `<div class="modal-setting-desc">${s.description}</div>` : ''}
              <input type="text" value="${currentValue}"
                onchange="managerUI.setSettingValue('${id}', '${s.key}', this.value)">
            </div>`;
        }).join('');
      }
    } catch (err: any) {
      body.innerHTML = `<div class="modal-empty" style="color:var(--danger)">Error: ${err.message}</div>`;
    }

    modal.classList.remove('hidden');
  }

  closeSettingsModal() {
    document.getElementById('widget-settings-modal')?.classList.add('hidden');
  }

  async setSettingValue(id: string, key: string, value: any) {
    await window.nxuiManager.setWidgetSetting(id, key, value);
  }

  async setTheme(val: string) { await window.nxuiManager.setTheme(val); }
  async setAutoStart(val: boolean) { await window.nxuiManager.setAutoStart(val); }
  async setFocusMode(val: boolean) { await window.nxuiManager.setFocusMode(val); }
}

const managerUI = new ManagerUI();
(window as any).managerUI = managerUI;
