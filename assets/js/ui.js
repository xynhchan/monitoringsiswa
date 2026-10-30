/* ==========================================================================
   TumbuhBaik — shared UI helpers: icons, avatars, badges, modal, toast, chart
   ========================================================================== */
(function () {
  'use strict';

  const TB = (window.TB = window.TB || {});
  const esc = TB.utils.escapeHTML;

  const ICONS = {
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1.5"/><rect width="7" height="5" x="14" y="3" rx="1.5"/><rect width="7" height="9" x="14" y="12" rx="1.5"/><rect width="7" height="5" x="3" y="16" rx="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    graduation: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.18-9.17 4.16a2 2 0 0 1-1.66 0L2 12.18"/><path d="m22 16.18-9.17 4.16a2 2 0 0 1-1.66 0L2 16.18"/>',
    school: '<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M18 5v17"/><path d="m4 6 8-4 8 4"/><path d="M6 5v17"/><path d="M2 22h20"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    shieldAlert: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    arrowUpRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
    alertCircle: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    trend: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    trendingDown: '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>',
    award: '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
    gavel: '<path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 7-7"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    heartHandshake: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/><path d="m18 15-2-2"/><path d="m15 18-2-2"/>',
    filter: '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    key: '<path d="m15.5 7.5 3 3L22 7l-3-3"/><path d="m2 22 7.5-7.5"/><circle cx="10" cy="8" r="6"/><path d="M8 10 5 13"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    youtube: '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    externalLink: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>'
  };

  function icon(name, className, size) {
    const path = ICONS[name] || ICONS.info;
    return '<svg class="icon ' + (className || '') + '" width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }

  function avatar(name, size, extraClass) {
    const cls = 'avatar avatar--' + (size || 'md') + ' avatar-c' + TB.utils.colorIndex(name) + (extraClass ? ' ' + extraClass : '');
    return '<span class="' + cls + '" aria-hidden="true">' + esc(TB.utils.getInitials(name)) + '</span>';
  }

  function badge(text, tone, options) {
    const opts = options || {};
    return '<span class="badge-soft badge-soft--' + (tone || 'neutral') + (opts.className ? ' ' + opts.className : '') + '">' +
      (opts.icon ? icon(opts.icon, '', 13) : '') +
      (opts.dot ? '<span class="dot"></span>' : '') +
      '<span>' + esc(text) + '</span></span>';
  }

  function emptyState(iconName, title, text, actionHTML) {
    return '<div class="empty-state">' +
      '<span class="empty-state__icon">' + icon(iconName || 'search', '', 26) + '</span>' +
      '<h3>' + esc(title) + '</h3>' +
      '<p>' + esc(text) + '</p>' +
      (actionHTML || '') +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Modal                                                               */
  /* ------------------------------------------------------------------ */

  let activeModal = null;
  let lastFocused = null;
  let keydownHandler = null;

  function closeModal() {
    if (!activeModal) return;
    const modal = activeModal;
    activeModal = null;
    modal.root.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    if (keydownHandler) document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
    const returnFocus = lastFocused;
    lastFocused = null;
    window.setTimeout(function () {
      if (modal.root && modal.root.parentNode) modal.root.parentNode.removeChild(modal.root);
    }, 220);
    if (returnFocus && typeof returnFocus.focus === 'function' && document.body.contains(returnFocus)) {
      window.setTimeout(function () {
        if (document.body.contains(returnFocus)) returnFocus.focus();
      }, 50);
    }
  }

  function openModal(options) {
    closeModal();
    lastFocused = document.activeElement;
    const config = options || {};
    const root = document.createElement('div');
    root.className = 'tb-modal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', config.title || 'Dialog');
    root.innerHTML =
      '<div class="tb-modal__backdrop" data-modal-close></div>' +
      '<div class="tb-modal__dialog ' + (config.size ? 'tb-modal__dialog--' + config.size : '') + '">' +
        '<header class="tb-modal__header">' +
          '<div>' +
            (config.eyebrow ? '<span class="eyebrow eyebrow--small">' + esc(config.eyebrow) + '</span>' : '') +
            '<h2>' + esc(config.title || '') + '</h2>' +
            (config.subtitle ? '<p>' + esc(config.subtitle) + '</p>' : '') +
          '</div>' +
          '<button type="button" class="icon-button" data-modal-close aria-label="Tutup dialog">' + icon('close', '', 20) + '</button>' +
        '</header>' +
        '<div class="tb-modal__body">' + (config.content || '') + '</div>' +
        (config.footer ? '<footer class="tb-modal__footer">' + config.footer + '</footer>' : '') +
      '</div>';

    document.body.appendChild(root);
    document.body.classList.add('modal-open');
    activeModal = { root: root, options: config };

    root.addEventListener('click', function (event) {
      if (event.target.closest('[data-modal-close]')) {
        closeModal();
      }
    });

    keydownHandler = function (event) {
      if (event.key === 'Escape') closeModal();
      if (event.key === 'Tab') {
        const focusable = root.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', keydownHandler);

    window.requestAnimationFrame(function () {
      root.classList.add('is-open');
      const focusTarget = root.querySelector('[autofocus]') || root.querySelector('input:not([type="hidden"]), select, textarea, button');
      if (focusTarget) window.setTimeout(function () { focusTarget.focus(); }, 80);
    });

    if (typeof config.onMount === 'function') config.onMount(root);
    return { root: root, close: closeModal };
  }

  function confirmDialog(options) {
    const config = options || {};
    let confirmed = false;
    const modal = openModal({
      eyebrow: config.eyebrow || 'Konfirmasi',
      title: config.title || 'Lanjutkan tindakan ini?',
      subtitle: config.subtitle || '',
      size: 'sm',
      content: '<div class="confirm-copy' + (config.danger ? ' confirm-copy--danger' : '') + '">' +
        '<span class="confirm-copy__icon">' + icon(config.icon || (config.danger ? 'alert' : 'info'), '', 24) + '</span>' +
        '<p>' + config.message + '</p>' +
      '</div>',
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="button" class="btn ' + (config.danger ? 'btn-danger-brand' : 'btn-brand') + '" id="tb-confirm-action">' + esc(config.confirmText || 'Ya, lanjutkan') + '</button>'
    });
    modal.root.querySelector('#tb-confirm-action').addEventListener('click', function () {
      confirmed = true;
      if (typeof config.onConfirm === 'function') config.onConfirm();
      closeModal();
    });
    return { close: closeModal, get confirmed() { return confirmed; } };
  }

  /* ------------------------------------------------------------------ */
  /* Toast                                                               */
  /* ------------------------------------------------------------------ */

  function ensureToastStack() {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(message, type, title) {
    const stack = ensureToastStack();
    const tone = type || 'success';
    const item = document.createElement('div');
    item.className = 'app-toast app-toast--' + tone;
    const iconName = tone === 'error' ? 'alertCircle' : tone === 'info' ? 'info' : tone === 'warning' ? 'alert' : 'checkCircle';
    item.innerHTML =
      '<span class="app-toast__icon">' + icon(iconName, '', 18) + '</span>' +
      '<div class="app-toast__copy">' +
        (title ? '<strong>' + esc(title) + '</strong>' : '') +
        '<span>' + esc(message) + '</span>' +
      '</div>' +
      '<button type="button" class="app-toast__close" aria-label="Tutup notifikasi">' + icon('close', '', 15) + '</button>';
    stack.appendChild(item);
    window.requestAnimationFrame(function () { item.classList.add('is-visible'); });
    const remove = function () {
      item.classList.remove('is-visible');
      window.setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, 260);
    };
    item.querySelector('.app-toast__close').addEventListener('click', remove);
    window.setTimeout(remove, 4200);
  }

  /* ------------------------------------------------------------------ */
  /* Charts                                                              */
  /* ------------------------------------------------------------------ */

  function smoothPath(points) {
    if (!points.length) return '';
    if (points.length === 1) return 'M' + points[0].x + ' ' + points[0].y;
    let path = 'M' + points[0].x + ' ' + points[0].y;
    for (let i = 0; i < points.length - 1; i += 1) {
      const current = points[i];
      const next = points[i + 1];
      const mid = (current.x + next.x) / 2;
      path += ' C' + mid + ' ' + current.y + ', ' + mid + ' ' + next.y + ', ' + next.x + ' ' + next.y;
    }
    return path;
  }

  function lineChart(config) {
    const cfg = config || {};
    const labels = cfg.labels || [];
    const values = (cfg.values || []).map(function (value) { return Number(value) || 0; });
    const color = cfg.color || '#1F8A79';
    const width = 760;
    const height = cfg.height || 270;
    const padLeft = 38;
    const padRight = 20;
    const padTop = 28;
    const padBottom = 40;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;
    const maxValue = Math.max(4, Math.ceil(Math.max.apply(null, values) / 4) * 4);
    const step = labels.length > 1 ? plotW / (labels.length - 1) : plotW;
    const points = values.map(function (value, index) {
      return {
        x: padLeft + (labels.length > 1 ? step * index : plotW / 2),
        y: padTop + plotH - (value / maxValue) * plotH,
        value: value,
        label: labels[index]
      };
    });
    const path = smoothPath(points);
    const area = path + ' L' + (points[points.length - 1] ? points[points.length - 1].x : padLeft + plotW) + ' ' + (padTop + plotH) + ' L' + (points[0] ? points[0].x : padLeft) + ' ' + (padTop + plotH) + ' Z';
    const gradientID = 'area-' + Math.random().toString(36).slice(2, 8);
    let grid = '';
    for (let i = 0; i <= 4; i += 1) {
      const y = padTop + (plotH / 4) * i;
      grid += '<line x1="' + padLeft + '" y1="' + y + '" x2="' + (width - padRight) + '" y2="' + y + '" stroke="#E8F0ED" stroke-width="1" />';
      grid += '<text x="6" y="' + (y + 4) + '" fill="#93A6A0" font-size="10.5" font-family="inherit">' + Math.round(maxValue - (maxValue / 4) * i) + '</text>';
    }
    let xLabels = '';
    points.forEach(function (point) {
      xLabels += '<text x="' + point.x + '" y="' + (height - 12) + '" text-anchor="middle" fill="#7D918B" font-size="11" font-family="inherit">' + esc(point.label) + '</text>';
      xLabels += '<line x1="' + point.x + '" y1="' + (padTop + plotH) + '" x2="' + point.x + '" y2="' + (padTop + plotH + 5) + '" stroke="#D4E4DF" stroke-width="1" />';
    });
    let dots = '';
    points.forEach(function (point) {
      dots += '<g class="chart-dot">' +
        '<circle cx="' + point.x + '" cy="' + point.y + '" r="9" fill="transparent"><title>' + esc(point.label) + ': ' + point.value + '</title></circle>' +
        '<circle cx="' + point.x + '" cy="' + point.y + '" r="4.5" fill="#fff" stroke="' + color + '" stroke-width="2.5">' +
          '<title>' + esc(point.label) + ': ' + point.value + '</title>' +
        '</circle>' +
      '</g>';
    });
    return '<div class="chart-wrap"><svg viewBox="0 0 ' + width + ' ' + height + '" class="line-chart" role="img" aria-label="Grafik ' + esc(cfg.title || 'data') + '">' +
      '<defs><linearGradient id="' + gradientID + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity=".24"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#' + gradientID + ')" />' +
      '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="chart-line" />' +
      dots + xLabels +
    '</svg></div>';
  }

  function sparkline(values, color) {
    const numbers = (values || []).map(function (v) { return Number(v) || 0; });
    const width = 84;
    const height = 30;
    const max = Math.max.apply(null, numbers.concat([1]));
    const min = Math.min.apply(null, numbers.concat([0]));
    const range = max - min || 1;
    const points = numbers.map(function (value, index) {
      return {
        x: (width / Math.max(1, numbers.length - 1)) * index,
        y: height - 3 - ((value - min) / range) * (height - 8)
      };
    });
    return '<svg class="sparkline" viewBox="0 0 ' + width + ' ' + height + '" aria-hidden="true"><path d="' + smoothPath(points) + '" fill="none" stroke="' + (color || '#1F8A79') + '" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function progressRing(percent, options) {
    const cfg = options || {};
    const value = Math.max(0, Math.min(100, Number(percent) || 0));
    const radius = cfg.radius || 42;
    const stroke = cfg.stroke || 8;
    const size = (radius + stroke) * 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    return '<div class="progress-ring" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg viewBox="0 0 ' + size + ' ' + size + '">' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + radius + '" fill="none" stroke="' + (cfg.track || '#E4F1EC') + '" stroke-width="' + stroke + '"/>' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + radius + '" fill="none" stroke="' + (cfg.color || '#1F8A79') + '" stroke-width="' + stroke + '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '</svg>' +
      '<div class="progress-ring__label">' + (cfg.label != null ? cfg.label : value) + '</div>' +
    '</div>';
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return false; });
    }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      return Promise.resolve(true);
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  TB.ui = {
    icon: icon,
    avatar: avatar,
    badge: badge,
    emptyState: emptyState,
    modal: openModal,
    closeModal: closeModal,
    confirm: confirmDialog,
    toast: toast,
    lineChart: lineChart,
    sparkline: sparkline,
    progressRing: progressRing,
    copyText: copyText
  };
})();
