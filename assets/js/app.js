/* ==========================================================================
   TumbuhBaik — dashboard core
   Shell, routing, scoped data helpers, search and account utilities.
   Page renderers live in app-pages.js.
   ========================================================================== */
(function () {
  'use strict';

  const TB = window.TB;
  const esc = TB.utils.escapeHTML;

  const App = (window.App = window.App || {});
  App.renderers = App.renderers || {};
  App.state = {
    route: 'dashboard',
    params: {},
    filters: {
      siswa: { q: '', kelas: 'all', status: 'all' },
      pelanggaran: { q: '', kelas: 'all', jenis: 'all', status: 'all' },
      teguran: { q: '' },
      nilai: { q: '', kelas: 'all' },
      artikel: { q: '' },
      aset: { q: '' },
      pj: { q: '' }
    },
    focusFilter: null,
    chartPeriod: 6,
    lastHash: ''
  };

  const ROLE_LABEL = {
    admin: 'Admin Web',
    guru: 'Guru',
    pj: 'PJ Kesiswaan',
    orangtua: 'Orang Tua'
  };

  const PAGE_META = {
    dashboard: { eyebrow: 'Ringkasan', title: 'Dashboard', parentTitle: 'Ringkasan Ananda' },
    siswa: { eyebrow: 'Data kesiswaan', title: 'Data Siswa', parentTitle: 'Data Siswa' },
    guru: { eyebrow: 'Data kesiswaan', title: 'Data Guru' },
    kelas: { eyebrow: 'Data kesiswaan', title: 'Data Kelas' },
    pelanggaran: { eyebrow: 'Monitoring perilaku', title: 'Pelanggaran', parentTitle: 'Pelanggaran Anak' },
    jenis: { eyebrow: 'Referensi kesiswaan', title: 'Jenis Pelanggaran' },
    teguran: { eyebrow: 'Tindak lanjut', title: 'Teguran & Sanksi', parentTitle: 'Teguran Anak' },
    nilai: { eyebrow: 'Perkembangan siswa', title: 'Nilai & Poin', parentTitle: 'Nilai Anak' },
    artikel: { eyebrow: 'Informasi sekolah', title: 'Artikel & Kabar' },
    aset: { eyebrow: 'Pengaturan situs', title: 'Web Assets' },
    pj: { eyebrow: 'Manajemen akses', title: 'Akun PJ' },
    profil: { eyebrow: 'Akun saya', title: 'Profil' }
  };

  const NAV = {
    admin: [
      {
        label: 'Menu utama',
        items: [
          { route: 'dashboard', label: 'Ringkasan', icon: 'dashboard' },
          { route: 'siswa', label: 'Data Siswa', icon: 'users' },
          { route: 'pelanggaran', label: 'Pelanggaran', icon: 'alert', badge: true },
          { route: 'teguran', label: 'Teguran', icon: 'clipboard' },
          { route: 'nilai', label: 'Nilai & Poin', icon: 'award' }
        ]
      },
      {
        label: 'Manajemen',
        items: [
          { route: 'kelas', label: 'Kelas', icon: 'layers' },
          { route: 'guru', label: 'Guru', icon: 'graduation' },
          { route: 'jenis', label: 'Jenis Pelanggaran', icon: 'alertCircle' },
          { route: 'artikel', label: 'Artikel', icon: 'file' },
          { route: 'aset', label: 'Web Assets', icon: 'image' },
          { route: 'pj', label: 'Akun PJ', icon: 'userCheck' }
        ]
      },
      {
        label: 'Akun',
        items: [
          { route: 'profil', label: 'Profil', icon: 'settings' }
        ]
      }
    ],
    guru: [
      {
        label: 'Ruang guru',
        items: [
          { route: 'dashboard', label: 'Ringkasan', icon: 'dashboard' },
          { route: 'siswa', label: 'Siswa Binaan', icon: 'users' },
          { route: 'pelanggaran', label: 'Catat Pelanggaran', icon: 'alert', badge: true },
          { route: 'teguran', label: 'Teguran', icon: 'clipboard' },
          { route: 'nilai', label: 'Nilai & Poin', icon: 'award' }
        ]
      },
      {
        label: 'Referensi',
        items: [
          { route: 'artikel', label: 'Artikel', icon: 'file' }
        ]
      },
      {
        label: 'Akun',
        items: [
          { route: 'profil', label: 'Profil', icon: 'settings' }
        ]
      }
    ],
    pj: [
      {
        label: 'Kesiswaan',
        items: [
          { route: 'dashboard', label: 'Ringkasan', icon: 'dashboard' },
          { route: 'pelanggaran', label: 'Pelanggaran', icon: 'alert', badge: true },
          { route: 'teguran', label: 'Teguran & Sanksi', icon: 'clipboard' },
          { route: 'siswa', label: 'Data Siswa', icon: 'users' },
          { route: 'jenis', label: 'Jenis Pelanggaran', icon: 'alertCircle' },
          { route: 'nilai', label: 'Nilai & Poin', icon: 'award' }
        ]
      },
      {
        label: 'Informasi',
        items: [
          { route: 'artikel', label: 'Artikel', icon: 'file' }
        ]
      },
      {
        label: 'Akun',
        items: [
          { route: 'profil', label: 'Profil', icon: 'settings' }
        ]
      }
    ],
    orangtua: [
      {
        label: 'Ruang keluarga',
        items: [
          { route: 'dashboard', label: 'Ringkasan', icon: 'dashboard' },
          { route: 'pelanggaran', label: 'Pelanggaran Anak', icon: 'alert' },
          { route: 'teguran', label: 'Teguran', icon: 'clipboard' },
          { route: 'nilai', label: 'Nilai Anak', icon: 'award' },
          { route: 'artikel', label: 'Artikel', icon: 'file' }
        ]
      },
      {
        label: 'Akun',
        items: [
          { route: 'profil', label: 'Profil', icon: 'settings' }
        ]
      }
    ]
  };

  const ALLOWED = {
    admin: ['dashboard', 'siswa', 'guru', 'kelas', 'pelanggaran', 'jenis', 'teguran', 'nilai', 'artikel', 'aset', 'pj', 'profil'],
    guru: ['dashboard', 'siswa', 'pelanggaran', 'teguran', 'nilai', 'artikel', 'profil'],
    pj: ['dashboard', 'siswa', 'pelanggaran', 'jenis', 'teguran', 'nilai', 'artikel', 'profil'],
    orangtua: ['dashboard', 'pelanggaran', 'teguran', 'nilai', 'artikel', 'profil']
  };

  const $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  const $$ = function (selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); };

  /* ------------------------------------------------------------------ */
  /* Helpers exposed to page renderers                                    */
  /* ------------------------------------------------------------------ */

  function getAccount() {
    const db = App.db;
    const session = App.session;
    if (!session) return null;
    if (session.role === 'admin') return db.admin.find(function (item) { return item.id_admin === session.id; }) || null;
    if (session.role === 'guru') return db.guru.find(function (item) { return item.id_guru === session.id; }) || null;
    if (session.role === 'pj') return db.pj.find(function (item) { return item.id_pj === session.id; }) || null;
    if (session.role === 'orangtua') return db.orangTua.find(function (item) { return item.id_ortu === session.id; }) || null;
    return null;
  }

  function visibleStudents() {
    return TB.relations.scopedStudents(App.db, App.session).map(function (student) {
      const score = TB.relations.getNilai(App.db, student.id_siswa);
      const classItem = TB.relations.getKelas(App.db, student.id_kelas);
      const teacher = TB.relations.getGuru(App.db, student.id_guru);
      const violations = App.db.pelanggaran.filter(function (item) { return item.id_siswa === student.id_siswa; });
      const warnings = App.db.teguran.filter(function (warning) {
        return violations.some(function (item) { return item.id_pelanggaran === warning.id_pelanggaran; });
      });
      const points = score ? Number(score.total_poin) : 100;
      return {
        student: student,
        id: student.id_siswa,
        nama: student.nama,
        kelas: classItem,
        guru: teacher,
        nilai: score,
        total_poin: points,
        nilai_kompetensi: score ? Number(score.nilai_kompetensi) : 0,
        status: TB.utils.pointStatus(points),
        violationCount: violations.length,
        warningCount: warnings.length,
        violations: violations
      };
    });
  }

  function visibleViolations() {
    return TB.relations.scopedViolations(App.db, App.session)
      .map(function (record) {
        const student = TB.relations.getSiswa(App.db, record.id_siswa);
        const classItem = student ? TB.relations.getKelas(App.db, student.id_kelas) : null;
        const jenis = TB.relations.getJenis(App.db, record.id_jenis);
        const warning = TB.relations.getTeguran(App.db, record.id_pelanggaran);
        return {
          violation: record,
          id: record.id_pelanggaran,
          student: student,
          kelas: classItem,
          jenis: jenis,
          warning: warning,
          isPending: !warning,
          tanggal: record.tanggal,
          keterangan: record.keterangan
        };
      })
      .sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
  }

  function visibleWarnings() {
    return TB.relations.scopedWarnings(App.db, App.session)
      .map(function (warning) {
        const violation = TB.relations.getPelanggaran(App.db, warning.id_pelanggaran);
        const student = violation ? TB.relations.getSiswa(App.db, violation.id_siswa) : null;
        const classItem = student ? TB.relations.getKelas(App.db, student.id_kelas) : null;
        const jenis = violation ? TB.relations.getJenis(App.db, violation.id_jenis) : null;
        return {
          warning: warning,
          id: warning.id_teguran,
          violation: violation,
          student: student,
          kelas: classItem,
          jenis: jenis,
          tanggal: violation ? violation.tanggal : ''
        };
      })
      .sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
  }

  function visibleScores() {
    return visibleStudents().sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); });
  }

  function visibleClasses() {
    const scoped = visibleStudents();
    const ids = new Set(scoped.map(function (item) { return item.kelas ? item.kelas.id_kelas : null; }).filter(Boolean));
    return TB.stats.classSummary(App.db)
      .filter(function (summary) { return ids.has(summary.kelas.id_kelas); })
      .map(function (summary) {
        const classViolations = App.db.pelanggaran.filter(function (record) {
          const student = TB.relations.getSiswa(App.db, record.id_siswa);
          return student && student.id_kelas === summary.kelas.id_kelas;
        });
        return Object.assign({}, summary, { violations: classViolations });
      });
  }

  function pendingViolations() {
    return visibleViolations().filter(function (item) { return item.isPending; });
  }

  function grade(score) {
    const value = Number(score) || 0;
    if (value >= 90) return { letter: 'A', label: 'Sangat baik', tone: 'success' };
    if (value >= 80) return { letter: 'B', label: 'Baik', tone: 'info' };
    if (value >= 70) return { letter: 'C', label: 'Cukup', tone: 'warning' };
    return { letter: 'D', label: 'Perlu bimbingan', tone: 'danger' };
  }

  function pageHead(options) {
    const config = options || {};
    return '<div class="page-head">' +
      '<div class="page-head__copy">' +
        (config.eyebrow ? '<div class="page-head__eyebrow">' + TB.ui.icon(config.eyebrowIcon || 'dashboard', '', 12) + '<span>' + esc(config.eyebrow) + '</span></div>' : '') +
        '<h1>' + (config.title || '') + '</h1>' +
        (config.description ? '<p>' + config.description + '</p>' : '') +
        (config.meta ? '<div class="page-meta">' + config.meta + '</div>' : '') +
      '</div>' +
      (config.actions ? '<div class="page-head__actions">' + config.actions + '</div>' : '') +
    '</div>';
  }

  function statCard(options) {
    const config = options || {};
    const tone = config.tone ? ' stat-card--' + config.tone : '';
    const trendClass = config.trendType === 'down' ? 'stat-trend--down' : config.trendType === 'neutral' ? 'stat-trend--neutral' : 'stat-trend--up';
    return '<article class="stat-card' + tone + '">' +
      '<div class="stat-card__top">' +
        '<span class="stat-card__icon">' + TB.ui.icon(config.icon || 'activity', '', 18) + '</span>' +
        (config.trend ? '<span class="stat-trend ' + trendClass + '">' + (config.trendIcon ? TB.ui.icon(config.trendIcon, '', 10) : '') + esc(config.trend) + '</span>' : '') +
      '</div>' +
      '<span class="stat-card__label">' + esc(config.label) + '</span>' +
      '<strong class="stat-card__value">' + (config.value != null ? config.value : '—') + '</strong>' +
      (config.foot ? '<p class="stat-card__foot">' + config.foot + '</p>' : '') +
    '</article>';
  }

  function entityCell(name, secondary, extraClass) {
    return '<div class="entity-cell">' +
      TB.ui.avatar(name, 'sm', extraClass || '') +
      '<div class="entity-cell__copy"><strong>' + esc(name) + '</strong>' +
      (secondary ? '<span>' + esc(secondary) + '</span>' : '') +
      '</div></div>';
  }

  function emptyRow(columns, title, message, iconName) {
    return '<tr><td colspan="' + columns + '"><div class="table-empty">' +
      TB.ui.emptyState(iconName || 'search', title, message) +
    '</div></td></tr>';
  }

  function pointBadge(points) {
    const status = TB.utils.pointStatus(Number(points));
    return TB.ui.badge(status.label, status.tone, { dot: true });
  }

  function roleLabel(role) {
    return ROLE_LABEL[role] || role;
  }

  function formatLongToday() {
    return TB.utils.formatDate(TB.utils.today(), 'long');
  }

  function roleColor(role) {
    return role === 'admin' ? 'admin' : role === 'guru' ? 'guru' : role === 'pj' ? 'pj' : 'ortu';
  }

  function renderError(message) {
    return '<div class="page-loader">' + TB.ui.icon('alertCircle', '', 28) + '<span>' + esc(message) + '</span></div>';
  }

  const h = {
    esc: esc,
    icon: TB.ui.icon,
    avatar: TB.ui.avatar,
    badge: TB.ui.badge,
    modal: TB.ui.modal,
    closeModal: TB.ui.closeModal,
    confirm: TB.ui.confirm,
    toast: TB.ui.toast,
    progressRing: TB.ui.progressRing,
    fmtDate: TB.utils.formatDate,
    fmtShortDate: TB.utils.formatShortDate,
    relative: TB.utils.formatRelative,
    today: TB.utils.today,
    pointStatus: TB.utils.pointStatus,
    violationLevel: TB.utils.violationLevel,
    classOf: function (id) { return TB.relations.getKelas(App.db, id); },
    teacherOf: function (id) { return TB.relations.getGuru(App.db, id); },
    typeOf: function (id) { return TB.relations.getJenis(App.db, id); },
    scoreOf: function (id) { return TB.relations.getNilai(App.db, id); },
    warningOf: function (id) { return TB.relations.getTeguran(App.db, id); },
    getAccount: getAccount,
    roleLabel: roleLabel,
    roleColor: roleColor,
    grade: grade,
    pageHead: pageHead,
    statCard: statCard,
    entityCell: entityCell,
    emptyRow: emptyRow,
    pointBadge: pointBadge,
    visibleStudents: visibleStudents,
    visibleViolations: visibleViolations,
    visibleWarnings: visibleWarnings,
    visibleScores: visibleScores,
    visibleClasses: visibleClasses,
    pendingViolations: pendingViolations,
    formatLongToday: formatLongToday,
    initials: TB.utils.getInitials,
    classSummary: TB.stats.classSummary
  };

  App.h = h;
  App.utils = { getAccount: getAccount, visibleStudents: visibleStudents };

  /* ------------------------------------------------------------------ */
  /* Navigation                                                           */
  /* ------------------------------------------------------------------ */

  function isAllowed(route) {
    return (ALLOWED[App.session.role] || []).indexOf(route) !== -1;
  }

  function pendingCount() {
    if (App.session.role === 'orangtua') return 0;
    return pendingViolations().length;
  }

  function buildSidebar() {
    const nav = $('#sideNav');
    if (!nav) return;
    const pending = pendingCount();
    const config = NAV[App.session.role] || NAV.admin;
    nav.innerHTML = config.map(function (section) {
      return '<span class="side-section-label">' + esc(section.label) + '</span>' +
        section.items.filter(function (item) { return isAllowed(item.route); }).map(function (item) {
          const badge = item.badge && pending > 0 ? '<span class="side-link__badge">' + pending + '</span>' : '';
          return '<a class="side-link" href="#/' + item.route + '" data-route="' + item.route + '">' +
            TB.ui.icon(item.icon, '', 17) +
            '<span>' + esc(item.label) + '</span>' + badge +
          '</a>';
        }).join('');
    }).join('');

    updateActiveNav();
  }

  function updateActiveNav() {
    $$('#sideNav .side-link').forEach(function (link) {
      link.classList.toggle('is-active', link.dataset.route === App.state.route);
    });
  }

  function updateTopbar() {
    const meta = PAGE_META[App.state.route] || PAGE_META.dashboard;
    const title = App.session.role === 'orangtua' && meta.parentTitle ? meta.parentTitle : meta.title;
    const eyebrowEl = $('#pageEyebrow');
    const titleEl = $('#pageTitle');
    if (eyebrowEl) eyebrowEl.textContent = meta.eyebrow;
    if (titleEl) titleEl.textContent = title;
    document.title = title + ' — TumbuhBaik';
  }

  function updateShellUser() {
    const session = App.session;
    const account = getAccount();
    if (!session) return;
    const name = session.nama || (account ? account.nama : 'Pengguna');
    const username = session.username || (account ? account.username : '');
    const topAvatar = $('#topbarAvatar');
    const menuAvatar = $('#menuAvatar');
    const avatarClass = 'avatar--sm avatar-c' + TB.utils.colorIndex(name);
    if (topAvatar) {
      topAvatar.className = 'avatar ' + avatarClass;
      topAvatar.textContent = TB.utils.getInitials(name);
    }
    if (menuAvatar) {
      menuAvatar.className = 'avatar avatar--md avatar-c' + TB.utils.colorIndex(name);
      menuAvatar.textContent = TB.utils.getInitials(name);
    }
    const topName = $('#topbarName');
    const topRole = $('#topbarRole');
    const menuName = $('#menuName');
    const menuUsername = $('#menuUsername');
    if (topName) topName.textContent = name;
    if (topRole) topRole.textContent = roleLabel(session.role);
    if (menuName) menuName.textContent = name;
    if (menuUsername) menuUsername.textContent = '@' + username;

    const meta = App.db.meta;
    const schoolName = $('#sidebarSchoolName');
    const schoolYear = $('#sidebarSchoolYear');
    if (schoolName) schoolName.textContent = meta.school;
    if (schoolYear) schoolYear.textContent = 'TA ' + meta.tahunAjaran + ' · ' + meta.semester;
    const context = $('#topbarContext');
    if (context) context.textContent = 'TA ' + meta.tahunAjaran + ' · Semester ' + meta.semester;
  }

  function updateNotifications() {
    const count = pendingCount();
    const badge = $('#notifCount');
    const button = $('#notificationButton');
    if (badge) {
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.classList.toggle('hidden', count === 0 || App.session.role === 'orangtua');
    }
    if (button) {
      button.setAttribute('aria-label', count > 0 ? count + ' pelanggaran menunggu tindak lanjut' : 'Tidak ada pemberitahuan baru');
    }
  }

  function closeSidebar() {
    const sidebar = $('#appSidebar');
    const overlay = $('#sidebarOverlay');
    const trigger = $('#menuTrigger');
    if (sidebar) sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-active');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }

  function openSidebar() {
    const sidebar = $('#appSidebar');
    const overlay = $('#sidebarOverlay');
    const trigger = $('#menuTrigger');
    if (sidebar) sidebar.classList.add('is-open');
    if (overlay) overlay.classList.add('is-active');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  }

  function closeProfileMenu() {
    const trigger = $('#profileTrigger');
    const menu = $('#profileMenu');
    if (menu) menu.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function toggleProfileMenu() {
    const trigger = $('#profileTrigger');
    const menu = $('#profileMenu');
    if (!menu || !trigger) return;
    const willOpen = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', willOpen);
    trigger.setAttribute('aria-expanded', String(willOpen));
  }

  /* ------------------------------------------------------------------ */
  /* Routing                                                              */
  /* ------------------------------------------------------------------ */

  function parseRoute() {
    const raw = window.location.hash.replace(/^#\/?/, '');
    const sections = raw.split('?');
    const path = sections[0] || 'dashboard';
    const params = {};
    if (sections[1]) {
      new URLSearchParams(sections[1]).forEach(function (value, key) { params[key] = value; });
    }
    return { route: path.split('/')[0] || 'dashboard', params: params };
  }

  function renderRoute(options) {
    const opts = options || {};
    const parsed = parseRoute();
    let route = parsed.route;
    if (!PAGE_META[route] || !isAllowed(route)) route = 'dashboard';

    App.state.route = route;
    App.state.params = parsed.params;
    App.state.lastHash = window.location.hash;

    const renderer = App.renderers[route];
    const page = $('#pageContent');
    if (!page) return;

    if (typeof renderer !== 'function') {
      page.innerHTML = renderError('Halaman ini belum siap.');
      return;
    }

    let html;
    try {
      html = renderer(parsed.params, opts);
    } catch (error) {
      console.error('TumbuhBaik render error:', error);
      html = renderError('Terjadi kesalahan saat memuat halaman. Coba muat ulang.');
    }

    page.innerHTML = '<div class="page-anim">' + html + '</div>';
    updateActiveNav();
    updateTopbar();
    updateNotifications();
    updateShellUser();

    if (!opts.keepScroll) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    if (App.state.focusFilter) {
      const focus = App.state.focusFilter;
      const input = document.getElementById('filter-' + focus.page + '-' + focus.key);
      if (input) {
        input.focus();
        if (typeof input.setSelectionRange === 'function' && input.type === 'text') {
          const length = input.value.length;
          input.setSelectionRange(length, length);
        }
      }
      App.state.focusFilter = null;
    }
  }

  function applyFilter(page, key, value) {
    if (!App.state.filters[page]) App.state.filters[page] = {};
    App.state.filters[page][key] = value;
    App.state.focusFilter = { page: page, key: key };
    renderRoute({ keepScroll: true });
  }

  function resetFilters(page) {
    const defaults = {
      siswa: { q: '', kelas: 'all', status: 'all' },
      pelanggaran: { q: '', kelas: 'all', jenis: 'all', status: 'all' },
      teguran: { q: '' },
      nilai: { q: '', kelas: 'all' },
      artikel: { q: '' },
      aset: { q: '' },
      pj: { q: '' }
    };
    App.state.filters[page] = defaults[page] || {};
    renderRoute({ keepScroll: true });
  }

  function go(route) {
    const hash = '#/' + route;
    closeSidebar();
    closeProfileMenu();
    if (window.location.hash === hash) {
      renderRoute();
    } else {
      window.location.hash = hash;
    }
  }

  function refresh(options) {
    App.db = TB.store.load();
    renderRoute(Object.assign({ keepScroll: true }, options || {}));
    buildSidebar();
    updateNotifications();
    updateShellUser();
  }

  App.go = go;
  App.refresh = refresh;
  App.applyFilter = applyFilter;
  App.resetFilters = resetFilters;
  App.renderRoute = renderRoute;

  App.goPending = function () {
    App.state.filters.pelanggaran.status = 'pending';
    if (window.location.hash === '#/pelanggaran') {
      renderRoute({ keepScroll: false });
    } else {
      go('pelanggaran');
    }
  };

  App.setChartPeriod = function (period) {
    App.state.chartPeriod = Number(period) === 12 ? 12 : 6;
    renderRoute({ keepScroll: true });
  };

  App.logout = function () {
    TB.ui.confirm({
      eyebrow: 'Keluar akun',
      title: 'Keluar dari dashboard?',
      message: 'Sesi Anda akan diakhiri. Data demo tetap tersimpan di browser ini.',
      confirmText: 'Ya, keluar',
      icon: 'logout',
      onConfirm: function () {
        TB.auth.logout();
        window.location.href = 'login.html';
      }
    });
  };

  App.openHelp = function () {
    const role = App.session.role;
    const guides = {
      admin: [
        'Kelola data induk siswa, guru, kelas, dan akun PJ dari menu Manajemen.',
        'Catat pelanggaran dan tinjau teguran untuk memastikan data kesiswaan tetap mutakhir.',
        'Gunakan menu Nilai & Poin untuk melihat dampak poin secara otomatis.',
        'Artikel dan Web Assets dapat diperbarui dari menu Manajemen.'
      ],
      guru: [
        'Buka Data Siswa untuk melihat siswa di kelas binaan Anda.',
        'Catat pelanggaran melalui tombol Catat Pelanggaran. Poin siswa akan dihitung otomatis.',
        'Perbarui nilai kompetensi dari menu Nilai & Poin.',
        'Teguran yang dibuat PJ dapat Anda lihat pada menu Teguran.'
      ],
      pj: [
        'Tinjau catatan pelanggaran yang berstatus “Perlu tindak lanjut”.',
        'Buat teguran, sanksi, dan catatan pendampingan dari detail pelanggaran.',
        'Jenis pelanggaran dapat dilihat sebagai referensi penilaian.',
        'Akses Anda mencakup seluruh data siswa, tanpa mengubah data induk.'
      ],
      orangtua: [
        'Ringkasan menampilkan poin perilaku, nilai, dan catatan terbaru anak.',
        'Buka Pelanggaran Anak untuk melihat riwayat secara lengkap.',
        'Teguran berisi sanksi dan catatan pendampingan dari sekolah.',
        'Hubungi wali kelas atau PJ kesiswaan jika ada hal yang perlu didiskusikan.'
      ]
    };
    const items = (guides[role] || guides.admin).map(function (text) {
      return '<div class="help-item">' +
        '<span class="help-item__icon">' + TB.ui.icon('check', '', 13) + '</span>' +
        '<p>' + esc(text) + '</p>' +
      '</div>';
    }).join('');

    TB.ui.modal({
      eyebrow: 'Panduan singkat',
      title: 'Cara menggunakan TumbuhBaik',
      subtitle: 'Panduan untuk peran ' + roleLabel(role) + '.',
      size: 'sm',
      content: '<div class="help-list">' + items + '</div>' +
        '<div class="form-note" style="margin-top:18px;">' + TB.ui.icon('info', '', 15) + '<span>Demo ini menyimpan perubahan di <strong>localStorage</strong> browser Anda. Tidak ada data yang dikirim ke server.</span></div>',
      footer: '<button class="btn btn-ghost" type="button" data-modal-close>Tutup</button>' +
        '<button class="btn btn-brand" type="button" id="helpProfile">Buka profil</button>'
    });

    const btn = document.getElementById('helpProfile');
    if (btn) {
      btn.addEventListener('click', function () {
        TB.ui.closeModal();
        go('profil');
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Global search                                                       */
  /* ------------------------------------------------------------------ */

  function buildSearchItems() {
    const pages = [];
    (NAV[App.session.role] || []).forEach(function (section) {
      section.items.forEach(function (item) {
        if (!isAllowed(item.route)) return;
        pages.push({
          type: 'page',
          route: item.route,
          label: item.label,
          sub: 'Buka halaman',
          icon: item.icon,
          search: (item.label + ' ' + item.route).toLowerCase()
        });
      });
    });
    const students = visibleStudents().slice(0, 30).map(function (item) {
      return {
        type: 'student',
        id: item.id,
        label: item.nama,
        sub: (item.kelas ? 'Kelas ' + item.kelas.nama_kelas : '') + ' · ' + item.total_poin + ' poin',
        icon: 'user',
        search: (item.nama + ' ' + item.id + ' ' + (item.kelas ? item.kelas.nama_kelas : '')).toLowerCase()
      };
    });
    return { pages: pages, students: students };
  }

  function openSearch() {
    const items = buildSearchItems();
    const pageHTML = items.pages.map(function (item, index) {
      return '<button class="search-result" type="button" data-route="' + item.route + '" data-group="pages" data-search-text="' + esc(item.search) + '">' +
        '<span class="search-result__icon">' + TB.ui.icon(item.icon, '', 15) + '</span>' +
        '<span class="search-result__copy"><strong>' + esc(item.label) + '</strong><span>' + esc(item.sub) + '</span></span>' +
        '<span class="search-result__hint">' + (index === 0 ? '↵' : '') + '</span>' +
      '</button>';
    }).join('');
    const studentHTML = items.students.map(function (item) {
      return '<button class="search-result" type="button" data-student="' + item.id + '" data-group="students" data-search-text="' + esc(item.search) + '">' +
        '<span class="search-result__icon">' + TB.ui.icon('user', '', 15) + '</span>' +
        '<span class="search-result__copy"><strong>' + esc(item.label) + '</strong><span>' + esc(item.sub) + '</span></span>' +
        '<span class="search-result__hint">Lihat</span>' +
      '</button>';
    }).join('');

    TB.ui.modal({
      eyebrow: 'Pencarian cepat',
      title: 'Cari apa yang Anda butuhkan',
      subtitle: 'Telusuri halaman atau buka profil siswa.',
      size: 'sm',
      content: '<div class="command-search">' +
        '<div class="input-wrap">' + TB.ui.icon('search', '', 17) +
          '<input class="form-control" id="commandInput" type="search" placeholder="Kelas, siswa, halaman…" autocomplete="off" autofocus>' +
        '</div>' +
        '<div class="search-results" id="commandResults">' +
          '<div class="search-group-label" data-group-label="pages">Halaman</div>' + pageHTML +
          '<div class="search-group-label" data-group-label="students">Siswa</div>' + studentHTML +
          '<div class="search-empty hidden" id="searchEmpty">Tidak ada hasil. Coba kata kunci lain.</div>' +
        '</div>' +
        '<div class="search-footer"><span>Tekan <span class="kbd">Esc</span> untuk menutup</span><span>' + esc(App.db.meta.school) + '</span></div>' +
      '</div>',
      footer: ''
    });

    const input = document.getElementById('commandInput');
    const results = document.getElementById('commandResults');
    const empty = document.getElementById('searchEmpty');

    function applySearch() {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      const groups = { pages: 0, students: 0 };
      $$('.search-result', results).forEach(function (result) {
        const match = !query || result.dataset.searchText.indexOf(query) !== -1;
        result.classList.toggle('hidden', !match);
        if (match) {
          visible += 1;
          groups[result.dataset.group] = (groups[result.dataset.group] || 0) + 1;
        }
      });
      $$('[data-group-label]', results).forEach(function (label) {
        label.classList.toggle('hidden', !groups[label.dataset.groupLabel]);
      });
      if (empty) empty.classList.toggle('hidden', visible !== 0);
    }

    input.addEventListener('input', applySearch);
    results.addEventListener('click', function (event) {
      const routeButton = event.target.closest('[data-route]');
      const studentButton = event.target.closest('[data-student]');
      if (routeButton) {
        TB.ui.closeModal();
        go(routeButton.dataset.route);
      } else if (studentButton) {
        TB.ui.closeModal();
        if (typeof App.openStudentDetail === 'function') {
          App.openStudentDetail(studentButton.dataset.student);
        } else {
          go('siswa');
        }
      }
    });
  }

  App.openSearch = openSearch;

  /* ------------------------------------------------------------------ */
  /* Shell events                                                        */
  /* ------------------------------------------------------------------ */

  function bindShell() {
    const sidebar = $('#appSidebar');
    const overlay = $('#sidebarOverlay');
    const menuTrigger = $('#menuTrigger');
    const sidebarClose = $('#sidebarClose');
    const notificationButton = $('#notificationButton');
    const profileTrigger = $('#profileTrigger');
    const globalSearch = $('#globalSearch');
    const sideNav = $('#sideNav');

    if (menuTrigger) menuTrigger.addEventListener('click', openSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    if (sideNav) {
      sideNav.addEventListener('click', function (event) {
        if (event.target.closest('.side-link')) closeSidebar();
      });
    }

    if (notificationButton) {
      notificationButton.addEventListener('click', function () {
        if (App.session.role === 'orangtua') {
          go('pelanggaran');
        } else {
          App.goPending();
        }
      });
    }

    if (profileTrigger) {
      profileTrigger.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleProfileMenu();
      });
    }

    if (globalSearch) globalSearch.addEventListener('click', openSearch);

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.profile')) closeProfileMenu();

      const actionEl = event.target.closest('[data-app-action]');
      if (actionEl) {
        event.preventDefault();
        const action = actionEl.dataset.appAction;
        if (action === 'help') {
          closeProfileMenu();
          closeSidebar();
          App.openHelp();
        }
        if (action === 'logout') {
          closeProfileMenu();
          App.logout();
        }
      }
    });

    document.addEventListener('keydown', function (event) {
      const tag = (event.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || event.target.isContentEditable;
      if (event.key === '/' && !typing && !document.querySelector('.tb-modal.is-open')) {
        event.preventDefault();
        openSearch();
      }
      if (event.key === 'Escape') {
        closeProfileMenu();
        closeSidebar();
      }
    });

    window.addEventListener('hashchange', function () {
      renderRoute();
      buildSidebar();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 992) closeSidebar();
    });
  }

  function hydrateStaticIcons() {
    $$('[data-icon]').forEach(function (node) {
      const size = Number(node.dataset.iconSize) || 17;
      node.innerHTML = TB.ui.icon(node.dataset.icon, '', size);
      node.dataset.iconReady = '1';
    });
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  function init() {
    App.session = TB.auth.current();
    if (!App.session) {
      window.location.replace('login.html');
      return;
    }
    App.db = TB.store.load();

    hydrateStaticIcons();
    updateShellUser();
    buildSidebar();
    bindShell();

    const parsed = parseRoute();
    if (!PAGE_META[parsed.route] || !isAllowed(parsed.route)) {
      if (window.location.hash !== '#/dashboard') {
        window.location.hash = '#/dashboard';
        return;
      }
    }

    renderRoute();
  }

  App.init = init;
  App.helpers = h;
  App.isAllowed = isAllowed;
  App.pendingCount = pendingCount;

  document.addEventListener('DOMContentLoaded', function () {
    if (App.session) return;
    init();
  });
})();
