/* ==========================================================================
   TumbuhBaik — page renderers & actions (part 1)
   Dashboard, parent portal, students, teachers, classes and profile.
   ========================================================================== */
(function () {
  'use strict';

  const TB = window.TB;
  const App = window.App;
  const h = App.h;
  const state = App.state;
  const esc = h.esc;

  const $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  const $$ = function (selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); };
  const ROLE = function () { return App.session.role; };
  const IS_PARENT = function () { return ROLE() === 'orangtua'; };
  const IS_ADMIN = function () { return ROLE() === 'admin'; };
  const CAN_RECORD = function () { return ['admin', 'guru', 'pj'].indexOf(ROLE()) !== -1; };
  const CAN_WARN = function () { return ['admin', 'pj'].indexOf(ROLE()) !== -1; };

  /* ------------------------------------------------------------------ */
  /* Small shared helpers                                                */
  /* ------------------------------------------------------------------ */

  function firstName(name) {
    return String(name || '')
      .replace(/,\s*.*$/, '')
      .trim()
      .split(/\s+/)[0] || 'Sahabat';
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  }

  function monthSeries(records, count, dateKey) {
    const labels = [];
    const keys = [];
    const values = [];
    const now = new Date();
    for (let offset = count - 1; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      keys.push(key);
      labels.push(TB.data.MONTHS_SHORT[date.getMonth()]);
      values.push(records.filter(function (record) {
        return TB.utils.monthKey(record[dateKey || 'tanggal']) === key;
      }).length);
    }
    return { labels: labels, keys: keys, values: values };
  }

  function pointHistory(studentId, count) {
    const records = App.db.pelanggaran.filter(function (item) { return item.id_siswa === studentId; });
    const now = new Date();
    const labels = [];
    const values = [];
    for (let offset = count - 1; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
      const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      labels.push(TB.data.MONTHS_SHORT[date.getMonth()]);
      let deductions = 0;
      records.forEach(function (record) {
        if (TB.utils.monthKey(record.tanggal) <= key) {
          const jenis = TB.relations.getJenis(App.db, record.id_jenis);
          deductions += jenis ? Number(jenis.pengurangan_poin) : 0;
        }
      });
      values.push(Math.max(0, 100 - deductions));
    }
    return { labels: labels, values: values };
  }

  function monthNameList() {
    return TB.data.MONTHS_LONG;
  }

  function selected(value, expected) {
    return String(value) === String(expected) ? ' selected' : '';
  }

  function tabButton(period) {
    return '<button type="button" class="' + (state.chartPeriod === period ? 'is-active' : '') + '" onclick="App.setChartPeriod(' + period + ')">' + period + ' bulan</button>';
  }

  function classOptions(classes, current) {
    return '<option value="all"' + selected(current, 'all') + '>Semua kelas</option>' + classes.map(function (item) {
      return '<option value="' + esc(item.kelas.id_kelas) + '"' + selected(current, item.kelas.id_kelas) + '>Kelas ' + esc(item.kelas.nama_kelas) + '</option>';
    }).join('');
  }

  function statusOptions(current) {
    return '<option value="all"' + selected(current, 'all') + '>Semua status</option>' +
      '<option value="safe"' + selected(current, 'safe') + '>Sangat baik</option>' +
      '<option value="good"' + selected(current, 'good') + '>Baik</option>' +
      '<option value="attention"' + selected(current, 'attention') + '>Perlu perhatian</option>' +
      '<option value="critical"' + selected(current, 'critical') + '>Perlu pendampingan</option>';
  }

  function clearFiltersButton(page, hasFilter) {
    return hasFilter ? '<button type="button" class="btn btn-ghost btn-sm" onclick="App.resetFilters(\'' + page + '\')">' + h.icon('refresh', '', 13) + 'Reset</button>' : '';
  }

  function accountUsername(role) {
    const account = h.getAccount();
    return account ? account.username : '';
  }

  function roleAccent(role) {
    return role === 'admin' ? 'admin' : role === 'guru' ? 'guru' : role === 'pj' ? 'pj' : 'ortu';
  }

  function safeMessageForParent(status) {
    if (status.key === 'safe') return 'Perkembangan perilaku ananda sangat baik. Teruskan apresiasi kecil di rumah agar kebiasaan ini bertahan.';
    if (status.key === 'good') return 'Secara umum perkembangan ananda baik. Ajak anak bercerita tentang hari-harinya dan beri dukungan pada hal yang masih perlu diperbaiki.';
    if (status.key === 'attention') return 'Ada beberapa catatan yang perlu perhatian. Diskusikan bersama anak dengan tenang dan hubungi wali kelas untuk menyusun langkah pendampingan.';
    return 'Ananda membutuhkan pendampingan yang lebih dekat. Mari berdiskusi dengan wali kelas atau PJ kesiswaan untuk menyusun rencana perbaikan bersama.';
  }

  function statusNarrative(item) {
    const status = item.status;
    if (status.key === 'safe') return 'Poin perilaku baik. Pertahankan kebiasaan positif dan apresiasi kemajuan anak.';
    if (status.key === 'good') return 'Perkembangan cukup baik. Tetap pantau catatan dan beri dukungan di rumah.';
    if (status.key === 'attention') return 'Perlu perhatian. Beberapa catatan dapat menjadi bahan diskusi bersama wali kelas.';
    return 'Perlu pendampingan. Libatkan wali kelas dan PJ kesiswaan untuk langkah perbaikan.';
  }

  /* ------------------------------------------------------------------ */
  /* Staff dashboard                                                     */
  /* ------------------------------------------------------------------ */

  function renderDashboard() {
    if (IS_PARENT()) return renderParentDashboard();

    const stats = TB.stats.compute(App.db, App.session);
    const students = h.visibleStudents();
    const pending = h.pendingViolations();
    const classes = h.visibleClasses();
    const topTypes = TB.stats.topViolationTypes(App.db, stats.violations).slice(0, 5);
    const recent = h.visibleViolations().slice(0, 5);
    const safeCount = students.filter(function (item) { return item.total_poin >= 85; }).length;
    const trend = stats.trend;
    const trendType = stats.thisMonth.length > stats.lastMonth.length ? 'down' : stats.thisMonth.length < stats.lastMonth.length ? 'up' : 'neutral';
    const trendLabel = stats.lastMonth.length === 0
      ? (stats.thisMonth.length ? 'baru bulan ini' : 'stabil')
      : Math.abs(trend) + '% vs bulan lalu';
    const trendIcon = trendType === 'down' ? 'trend' : trendType === 'up' ? 'trendingDown' : 'activity';
    const name = firstName(App.session.nama);
    const classRows = classes.slice().sort(function (a, b) { return b.average - a.average; }).slice(0, 5);
    const chart = monthSeries(stats.violations, state.chartPeriod);
    const maxTypeCount = topTypes.length ? topTypes[0].count : 1;
    const barColors = ['#1F8A79', '#F6C95D', '#F2836C', '#5CA6D6', '#8A7CC4'];

    const notice = pending.length
      ? '<div class="notice-banner">' +
          '<span class="notice-banner__icon">' + h.icon('alert', '', 17) + '</span>' +
          '<div class="notice-banner__copy"><strong>' + pending.length + ' catatan menunggu tindak lanjut</strong>' +
            '<span>Tinjau pelanggaran dan tetapkan teguran agar pendampingan tidak tertunda.</span></div>' +
          '<button type="button" class="btn btn-brand" onclick="App.goPending()">Tinjau sekarang ' + h.icon('arrowRight', '', 14) + '</button>' +
        '</div>'
      : '';

    const statsHTML =
      '<div class="stats-grid">' +
        h.statCard({
          tone: 'navy', icon: 'users', label: 'Siswa terpantau', value: students.length,
          foot: '<strong>' + classes.length + ' kelas</strong> · ' + (ROLE() === 'guru' ? 'kelas binaan Anda' : 'dalam cakupan akses')
        }) +
        h.statCard({
          icon: 'award', label: 'Rata-rata poin perilaku', value: stats.averagePoints,
          foot: '<strong>' + safeCount + ' siswa</strong> berada di kategori sangat baik',
          trend: stats.averagePoints >= 80 ? 'sehat' : 'perlu atensi', trendType: stats.averagePoints >= 80 ? 'up' : 'neutral', trendIcon: 'activity'
        }) +
        h.statCard({
          tone: 'coral', icon: 'alert', label: 'Pelanggaran bulan ini', value: stats.thisMonth.length,
          foot: '<strong>' + stats.violations.length + ' catatan</strong> tercatat total',
          trend: trendLabel, trendType: trendType, trendIcon: trendIcon
        }) +
        h.statCard({
          tone: pending.length ? 'yellow' : 'mint', icon: 'clipboard', label: 'Menunggu tindak lanjut', value: pending.length,
          foot: pending.length ? '<strong>Perlu teguran</strong> dari PJ atau admin' : 'Semua catatan sudah ditindaklanjuti',
          trend: pending.length ? 'perlu tindakan' : 'bersih', trendType: pending.length ? 'down' : 'up', trendIcon: pending.length ? 'alert' : 'checkCircle'
        }) +
      '</div>';

    const chartHTML =
      '<article class="panel">' +
        '<div class="panel__head">' +
          '<div class="panel__title"><h2>Tren pelanggaran</h2><p>' + state.chartPeriod + ' bulan terakhir · ' + stats.violations.length + ' catatan dalam cakupan</p></div>' +
          '<div class="segmented">' + tabButton(6) + tabButton(12) + '</div>' +
        '</div>' +
        '<div class="chart-summary"><strong>' + stats.thisMonth.length + '</strong><span>catatan bulan ini</span>' +
          '<span class="badge-soft badge-soft--' + (trendType === 'down' ? 'danger' : trendType === 'up' ? 'success' : 'neutral') + '">' +
            h.icon(trendIcon, '', 12) + trendLabel +
          '</span>' +
        '</div>' +
        TB.ui.lineChart({ labels: chart.labels, values: chart.values, color: '#1F8A79', height: 250, title: 'tren pelanggaran' }) +
      '</article>';

    const topHTML =
      '<article class="panel">' +
        '<div class="panel__head panel__head--compact">' +
          '<div class="panel__title"><h2>Pelanggaran terbanyak</h2><p>Berdasarkan jumlah catatan</p></div>' +
          (App.isAllowed('jenis') ? '<button type="button" class="panel__link" onclick="App.go(\'jenis\')">Lihat jenis ' + h.icon('arrowRight', '', 12) + '</button>' : '') +
        '</div>' +
        (topTypes.length
          ? '<div class="rank-list">' + topTypes.map(function (item, index) {
              const width = Math.max(8, Math.round((item.count / maxTypeCount) * 100));
              return '<div class="rank-item"><div class="rank-item__top"><div class="rank-item__name">' +
                '<span class="dot" style="background:' + barColors[index % barColors.length] + '"></span><span>' + esc(item.jenis.nama_pelanggaran) + '</span></div>' +
                '<span class="rank-item__value">' + item.count + '× · −' + item.total + ' poin</span></div>' +
                '<div class="rank-bar"><span style="--bar-width:' + width + '%;background:' + barColors[index % barColors.length] + '"></span></div></div>';
            }).join('') + '</div>'
          : '<div class="inline-empty">Belum ada catatan pelanggaran pada cakupan ini.</div>') +
        '<div class="panel__footer"><span class="panel__footer-note">' + esc(App.db.meta.school) + '</span><span class="badge-soft badge-soft--neutral">' + esc(App.db.meta.semester) + '</span></div>' +
      '</article>';

    const recentRows = recent.length
      ? recent.map(function (item) {
          return '<tr>' +
            '<td>' + h.entityCell(item.student ? item.student.nama : 'Siswa', item.kelas ? 'Kelas ' + item.kelas.nama_kelas : '—') + '</td>' +
            '<td><span class="cell-main">' + esc(item.jenis ? item.jenis.nama_pelanggaran : '—') + '</span><span class="cell-sub">' + esc(item.keterangan || '') + '</span></td>' +
            '<td><span class="cell-date">' + h.icon('calendar', '', 12) + h.fmtShortDate(item.tanggal) + '</span></td>' +
            '<td>' + (item.warning ? h.badge('Ditindaklanjuti', 'success', { dot: true }) : h.badge('Perlu tindak lanjut', 'warning', { dot: true })) + '</td>' +
            '<td><button type="button" class="row-action" title="Lihat detail" onclick="App.openViolationDetail(\'' + item.id + '\')">' + h.icon('eye', '', 15) + '</button></td>' +
          '</tr>';
        }).join('')
      : h.emptyRow(5, 'Belum ada pelanggaran', 'Catatan pelanggaran akan muncul di sini.', 'shield');

    const recentHTML =
      '<article class="panel panel--flush table-panel">' +
        '<div class="table-panel__head"><div><h3>Catatan terbaru</h3><p>Aktivitas kesiswaan terakhir</p></div>' +
          '<button type="button" class="panel__link" onclick="App.go(\'pelanggaran\')">Lihat semua ' + h.icon('arrowRight', '', 12) + '</button>' +
        '</div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Siswa</th><th>Pelanggaran</th><th>Tanggal</th><th>Status</th><th></th></tr></thead><tbody>' + recentRows + '</tbody></table></div>' +
      '</article>';

    const classHTML =
      '<article class="panel">' +
        '<div class="panel__head panel__head--compact"><div class="panel__title"><h2>Kelas paling tertib</h2><p>Berdasarkan rata-rata poin perilaku</p></div>' +
          (App.isAllowed('kelas') ? '<button type="button" class="panel__link" onclick="App.go(\'kelas\')">Semua ' + h.icon('arrowRight', '', 12) + '</button>' : '') +
        '</div>' +
        (classRows.length
          ? '<div class="class-rank">' + classRows.map(function (item, index) {
              return '<div class="class-rank__row">' +
                '<span class="class-rank__rank">' + (index + 1) + '</span>' +
                '<div class="class-rank__copy"><strong>Kelas ' + esc(item.kelas.nama_kelas) + '</strong><span>' + item.count + ' siswa · ' + (item.wali ? esc(item.wali.nama.replace(/,\s*S\.Pd\./, '')) : 'tanpa wali') + '</span></div>' +
                '<span class="class-rank__points">' + item.average + '</span>' +
              '</div>';
            }).join('') + '</div>'
          : '<div class="inline-empty">Belum ada data kelas.</div>') +
        '<div class="panel__footer"><span class="panel__footer-note">' + (pending.length ? pending.length + ' catatan perlu tindak lanjut' : 'Semua catatan tertangani') + '</span>' +
          '<span class="badge-soft badge-soft--' + (pending.length ? 'warning' : 'success') + '">' + (pending.length ? 'Perlu atensi' : 'Aman') + '</span></div>' +
      '</article>';

    return h.pageHead({
      eyebrow: 'Ringkasan hari ini',
      eyebrowIcon: 'dashboard',
      title: greeting() + ', ' + esc(name) + '.',
      description: 'Berikut gambaran singkat perkembangan siswa dan catatan kesiswaan pada ' + h.fmtDate(h.today(), 'long') + '.',
      actions: CAN_RECORD()
        ? '<button type="button" class="btn btn-brand" onclick="App.openViolationForm()">' + h.icon('plus', '', 15) + 'Catat pelanggaran</button>' +
          '<button type="button" class="btn btn-white" onclick="App.openHelp()">' + h.icon('help', '', 15) + 'Panduan</button>'
        : ''
    }) +
    notice +
    statsHTML +
    '<div class="dashboard-grid">' + chartHTML + topHTML + '</div>' +
    '<div class="dashboard-grid dashboard-grid--even">' + recentHTML + classHTML + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Parent dashboard                                                    */
  /* ------------------------------------------------------------------ */

  function renderParentDashboard() {
    const children = h.visibleStudents();
    if (!children.length) {
      return h.pageHead({ eyebrow: 'Ringkasan ananda', title: 'Data anak belum tersedia' }) +
        TB.ui.emptyState('user', 'Belum ada data anak', 'Hubungi admin sekolah untuk menautkan akun orang tua dengan data siswa.');
    }

    const child = children[0];
    const timeline = TB.relations.studentTimeline(App.db, child.id);
    const warnings = h.visibleWarnings();
    const history = pointHistory(child.id, 6);
    const thisMonthRecords = child.violations.filter(function (item) {
      return TB.utils.monthKey(item.tanggal) === TB.utils.monthKey(h.today());
    });
    const latestWarning = warnings[0];
    const articles = App.db.artikel.slice().sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); }).slice(0, 2);
    const status = child.status;

    const hero =
      '<article class="parent-hero">' +
        h.avatar(child.nama, 'xl') +
        '<div class="parent-hero__copy">' +
          '<span class="parent-hero__eyebrow">' + h.icon('heart', '', 11) + 'Ananda · ' + esc(child.id) + '</span>' +
          '<h2>' + esc(child.nama) + '</h2>' +
          '<p>' + (child.kelas ? 'Kelas ' + esc(child.kelas.nama_kelas) : 'Kelas belum ditentukan') + (child.guru ? ' · Wali kelas ' + esc(child.guru.nama.replace(/,\s*S\.Pd\./, '')) : '') + '</p>' +
          '<div class="parent-hero__tags">' + h.badge(status.label, status.tone, { dot: true }) +
            h.badge('Nilai ' + child.nilai_kompetensi, 'info', { icon: 'award' }) +
            h.badge(thisMonthRecords.length + ' catatan bulan ini', 'neutral', { icon: 'calendar' }) +
          '</div>' +
        '</div>' +
        '<div class="parent-hero__gauge">' +
          h.progressRing(child.total_poin, { radius: 38, stroke: 7, label: child.total_poin, color: '#8AD3C2', track: 'rgba(255,255,255,.16)' }) +
          '<span>dari 100 poin perilaku</span>' +
        '</div>' +
      '</article>';

    const stats =
      '<div class="parent-summary">' +
        h.statCard({ icon: 'alert', label: 'Total pelanggaran', value: child.violationCount, foot: '<strong>' + thisMonthRecords.length + ' catatan</strong> bulan ini', tone: 'coral' }) +
        h.statCard({ icon: 'clipboard', label: 'Teguran tercatat', value: child.warningCount, foot: warnings.length ? 'Tindak lanjut sudah dilakukan sekolah' : 'Belum ada teguran', tone: 'yellow' }) +
        h.statCard({ icon: 'award', label: 'Nilai kompetensi', value: child.nilai_kompetensi, foot: '<strong>' + h.grade(child.nilai_kompetensi).label + '</strong> · predikat ' + h.grade(child.nilai_kompetensi).letter, tone: 'mint' }) +
      '</div>';

    const chartHTML =
      '<article class="panel">' +
        '<div class="panel__head">' +
          '<div class="panel__title"><h2>Perkembangan poin perilaku</h2><p>6 bulan terakhir · poin dihitung otomatis dari catatan</p></div>' +
          '<span class="badge-soft badge-soft--' + status.tone + '">' + status.label + '</span>' +
        '</div>' +
        '<div class="chart-summary"><strong>' + child.total_poin + '</strong><span>poin saat ini</span>' +
          '<span class="badge-soft badge-soft--' + (child.total_poin >= 80 ? 'success' : 'warning') + '">' + (child.total_poin >= 80 ? h.icon('trend', '', 12) : h.icon('alert', '', 12)) + (child.total_poin >= 80 ? 'sehat' : 'perlu perhatian') + '</span>' +
        '</div>' +
        TB.ui.lineChart({ labels: history.labels, values: history.values, color: '#1F8A79', height: 240, title: 'perkembangan poin ' + child.nama }) +
        '<div class="panel-note mt-8">' + h.icon('info', '', 14) + '<span>Poin berkurang sesuai jenis pelanggaran yang tercatat. Perubahan langsung terlihat setelah guru atau PJ memperbarui data.</span></div>' +
      '</article>';

    const focusHTML =
      '<article class="panel">' +
        '<div class="panel__head panel__head--compact"><div class="panel__title"><h2>Fokus pendampingan</h2><p>Untuk keluarga dan sekolah</p></div>' +
          '<button type="button" class="panel__link" onclick="App.go(\'teguran\')">Teguran ' + h.icon('arrowRight', '', 12) + '</button>' +
        '</div>' +
        '<div class="parent-note-card">' +
          '<span class="icon-tile ' + (status.key === 'safe' ? '' : 'icon-tile--coral') + '">' + h.icon(status.key === 'safe' ? 'heartHandshake' : 'alert', '', 17) + '</span>' +
          '<div><h3>' + esc(status.label) + '</h3><p>' + esc(safeMessageForParent(status)) + '</p></div>' +
        '</div>' +
        (latestWarning
          ? '<div class="warning-card__sanction mt-12">' + h.icon('clipboard', '', 14) + '<span><strong>Catatan terbaru:</strong> ' + esc(latestWarning.warning.sanksi) + '</span></div>' +
            (latestWarning.warning.catatan ? '<p class="warning-card__note">' + esc(latestWarning.warning.catatan) + '</p>' : '')
          : '<div class="inline-empty mt-12">Belum ada teguran. Ini kabar baik — teruskan komunikasi hangat dengan ananda.</div>') +
        '<div class="panel__footer"><span class="panel__footer-note">Terakhir diperbarui ' + h.fmtDate(h.today(), 'long') + '</span>' +
          '<button type="button" class="panel__link" onclick="App.go(\'pelanggaran\')">Riwayat ' + h.icon('arrowRight', '', 12) + '</button>' +
        '</div>' +
      '</article>';

    const timelineHTML =
      '<article class="panel">' +
        '<div class="panel__head panel__head--compact"><div class="panel__title"><h2>Catatan terbaru</h2><p>Riwayat perilaku ananda</p></div>' +
          '<button type="button" class="panel__link" onclick="App.go(\'pelanggaran\')">Semua ' + h.icon('arrowRight', '', 12) + '</button>' +
        '</div>' +
        (timeline.length
          ? '<div class="timeline">' + timeline.slice(0, 4).map(function (record) {
              return '<div class="timeline-item' + (record.warning ? ' timeline-item--success' : '') + '">' +
                '<span class="timeline-item__dot">' + h.icon(record.warning ? 'check' : 'alert', '', 13) + '</span>' +
                '<div class="timeline-item__body"><div class="timeline-item__head"><strong>' + esc(record.jenis ? record.jenis.nama_pelanggaran : 'Pelanggaran') + '</strong>' +
                  '<span>' + h.fmtShortDate(record.violation.tanggal) + '</span></div>' +
                  '<p>' + esc(record.violation.keterangan || '') + '</p>' +
                  h.badge(record.warning ? 'Sudah ditindaklanjuti' : 'Menunggu tindak lanjut', record.warning ? 'success' : 'warning', { dot: true }) +
                '</div></div>';
            }).join('') + '</div>'
          : '<div class="inline-empty">Belum ada catatan pelanggaran. Terus apresiasi kebiasaan baik ananda.</div>') +
      '</article>';

    const articlesHTML =
      '<article class="panel">' +
        '<div class="panel__head panel__head--compact"><div class="panel__title"><h2>Bacaan untuk keluarga</h2><p>Panduan singkat dari sekolah</p></div>' +
          '<button type="button" class="panel__link" onclick="App.go(\'artikel\')">Semua ' + h.icon('arrowRight', '', 12) + '</button></div>' +
        '<div class="article-mini-grid">' + articles.map(function (article, index) {
          return '<button type="button" class="article-mini" onclick="App.openArticle(\'' + article.id_artikel + '\')">' +
            '<span class="article-mini__icon">' + h.icon(['book', 'heartHandshake'][index % 2], '', 15) + '</span>' +
            '<span class="article-mini__copy"><strong>' + esc(article.judul_artikel) + '</strong><span>' + h.relative(article.tanggal) + '</span></span>' +
          '</button>';
        }).join('') + '</div>' +
        '<div class="panel__footer"><span class="panel__footer-note">Sumber: artikel sekolah</span>' +
          '<span class="badge-soft badge-soft--neutral">' + articles.length + ' artikel</span></div>' +
      '</article>';

    return h.pageHead({
      eyebrow: 'Ringkasan ananda',
      eyebrowIcon: 'heart',
      title: greeting() + ', ' + esc(firstName(App.session.nama)) + '.',
      description: 'Pantau perkembangan ' + esc(child.nama) + ' dengan tenang. Semua catatan di bawah berasal dari sekolah.',
      actions: '<button type="button" class="btn btn-brand" onclick="App.go(\'nilai\')">' + h.icon('award', '', 15) + 'Lihat nilai</button>' +
        '<button type="button" class="btn btn-white" onclick="App.openHelp()">' + h.icon('help', '', 15) + 'Panduan</button>'
    }) + hero + stats +
    '<div class="dashboard-grid">' + chartHTML + focusHTML + '</div>' +
    '<div class="dashboard-grid dashboard-grid--even">' + timelineHTML + articlesHTML + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Students                                                            */
  /* ------------------------------------------------------------------ */

  function renderStudents() {
    const filters = state.filters.siswa;
    const all = h.visibleStudents().sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); });
    const classes = [];
    const classIDs = new Set();
    all.forEach(function (item) {
      if (item.kelas && !classIDs.has(item.kelas.id_kelas)) {
        classIDs.add(item.kelas.id_kelas);
        classes.push({ kelas: item.kelas });
      }
    });
    classes.sort(function (a, b) { return a.kelas.nama_kelas.localeCompare(b.kelas.nama_kelas, 'id'); });

    const query = filters.q.toLowerCase();
    const filtered = all.filter(function (item) {
      const matchSearch = !query || (item.nama + ' ' + item.id + ' ' + (item.kelas ? item.kelas.nama_kelas : '')).toLowerCase().indexOf(query) !== -1;
      const matchClass = filters.kelas === 'all' || (item.kelas && item.kelas.id_kelas === filters.kelas);
      const matchStatus = filters.status === 'all' || item.status.key === filters.status;
      return matchSearch && matchClass && matchStatus;
    });
    const hasFilter = !!filters.q || filters.kelas !== 'all' || filters.status !== 'all';

    const headerAction = IS_ADMIN()
      ? '<button type="button" class="btn btn-brand" onclick="App.openStudentForm()">' + h.icon('plus', '', 15) + 'Tambah siswa</button>'
      : '';

    const rows = filtered.length
      ? filtered.map(function (item) {
          return '<tr>' +
            '<td>' + h.entityCell(item.nama, item.id + ' · ' + (item.kelas ? 'Kelas ' + item.kelas.nama_kelas : 'Tanpa kelas')) + '</td>' +
            '<td><span class="cell-main">Kelas ' + esc(item.kelas ? item.kelas.nama_kelas : '—') + '</span><span class="cell-sub">' + esc(item.guru ? item.guru.nama : 'Wali belum ditentukan') + '</span></td>' +
            '<td><span class="cell-main">' + item.nilai_kompetensi + '</span><span class="cell-sub">' + h.grade(item.nilai_kompetensi).label + '</span></td>' +
            '<td><div class="points-cell"><span class="points-cell__value">' + item.total_poin + '</span><div class="progress-bar"><span style="width:' + item.total_poin + '%;background:' + (item.total_poin >= 85 ? 'var(--teal)' : item.total_poin >= 70 ? 'var(--yellow)' : 'var(--danger)') + '"></span></div></div></td>' +
            '<td>' + h.badge(item.status.label, item.status.tone, { dot: true }) + '</td>' +
            '<td><div class="row-actions">' +
              '<button type="button" class="row-action" title="Lihat detail" onclick="App.openStudentDetail(\'' + item.id + '\')">' + h.icon('eye', '', 15) + '</button>' +
              (IS_ADMIN()
                ? '<button type="button" class="row-action" title="Edit siswa" onclick="App.openStudentForm(\'' + item.id + '\')">' + h.icon('edit', '', 15) + '</button>' +
                  '<button type="button" class="row-action row-action--danger" title="Hapus siswa" onclick="App.deleteStudent(\'' + item.id + '\')">' + h.icon('trash', '', 15) + '</button>'
                : '') +
            '</div></td>' +
          '</tr>';
        }).join('')
      : h.emptyRow(6, 'Siswa tidak ditemukan', 'Coba ubah kata kunci atau filter yang dipilih.', 'users');

    return h.pageHead({
      eyebrow: ROLE() === 'guru' ? 'Kelas binaan Anda' : 'Data kesiswaan',
      eyebrowIcon: 'users',
      title: ROLE() === 'guru' ? 'Siswa Binaan' : 'Data Siswa',
      description: ROLE() === 'guru'
        ? 'Daftar siswa di kelas yang Anda dampingi. Catat pelanggaran dan perbarui nilai tepat dari sini.'
        : 'Data induk siswa, wali kelas, nilai kompetensi, dan poin perilaku dalam satu tampilan.',
      actions: headerAction
    }) +
    '<div class="toolbar">' +
      '<div class="toolbar__left">' +
        '<div class="filter-search">' + h.icon('search', '', 14) +
          '<input class="form-control" id="filter-siswa-q" type="text" value="' + esc(filters.q) + '" placeholder="Cari nama atau NIS…" oninput="App.applyFilter(\'siswa\',\'q\',this.value)">' +
        '</div>' +
        '<select class="form-select" id="filter-siswa-kelas" onchange="App.applyFilter(\'siswa\',\'kelas\',this.value)">' + classOptions(classes, filters.kelas) + '</select>' +
        '<select class="form-select" id="filter-siswa-status" onchange="App.applyFilter(\'siswa\',\'status\',this.value)">' + statusOptions(filters.status) + '</select>' +
        clearFiltersButton('siswa', hasFilter) +
      '</div>' +
      '<div class="toolbar__count"><strong>' + filtered.length + '</strong> dari ' + all.length + ' siswa</div>' +
    '</div>' +
    '<article class="panel panel--flush table-panel">' +
      '<div class="table-wrap"><table class="data-table data-table--students">' +
        '<thead><tr><th>Siswa</th><th>Kelas &amp; wali</th><th>Nilai</th><th>Poin perilaku</th><th>Status</th><th></th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
      '<div class="panel__footer" style="padding:11px 17px;margin:0;border-top:1px solid var(--line);"><span class="panel__footer-note">' + esc(App.db.meta.school) + ' · ' + esc(App.db.meta.tahunAjaran) + '</span><span class="badge-soft badge-soft--neutral">Data demo</span></div>' +
    '</article>';
  }

  function openStudentDetail(id) {
    const item = h.visibleStudents().find(function (student) { return student.id === id; });
    if (!item) {
      h.toast('Data siswa tidak ditemukan atau bukan bagian dari akses Anda.', 'error');
      return;
    }
    const timeline = TB.relations.studentTimeline(App.db, id);
    const ortu = TB.relations.getOrtu(App.db, id);
    const recent = timeline.slice(0, 5);

    const timelineHTML = recent.length
      ? '<div class="timeline">' + recent.map(function (record) {
          return '<div class="timeline-item' + (record.warning ? ' timeline-item--success' : '') + '">' +
            '<span class="timeline-item__dot">' + h.icon(record.warning ? 'check' : 'alert', '', 13) + '</span>' +
            '<div class="timeline-item__body"><div class="timeline-item__head"><strong>' + esc(record.jenis ? record.jenis.nama_pelanggaran : 'Pelanggaran') + '</strong><span>' + h.fmtShortDate(record.violation.tanggal) + '</span></div>' +
              '<p>' + esc(record.violation.keterangan || '') + '</p>' +
              h.badge(record.warning ? 'Teguran ke-' + record.warning.jumlah_teguran : 'Belum ditindaklanjuti', record.warning ? 'success' : 'warning', { dot: true }) +
            '</div></div>';
        }).join('') + '</div>'
      : '<div class="inline-empty">Belum ada riwayat pelanggaran untuk siswa ini.</div>';

    const footer = '<button type="button" class="btn btn-ghost" data-modal-close>Tutup</button>' +
      (CAN_RECORD() ? '<button type="button" class="btn btn-soft" onclick="App.openViolationForm(null, \'' + item.id + '\')">' + h.icon('plus', '', 14) + 'Catat pelanggaran</button>' : '') +
      (IS_ADMIN() ? '<button type="button" class="btn btn-brand" onclick="App.openStudentForm(\'' + item.id + '\')">' + h.icon('edit', '', 14) + 'Edit data</button>' : '');

    h.modal({
      eyebrow: 'Profil siswa',
      title: item.nama,
      subtitle: 'Kelas ' + (item.kelas ? item.kelas.nama_kelas : '—') + ' · ' + item.id,
      size: 'lg',
      content: '<div class="detail-hero">' + h.avatar(item.nama, 'lg') +
        '<div class="detail-hero__copy"><h3>' + esc(item.nama) + '</h3><p>' + esc(item.id) + ' · ' + (item.kelas ? 'Kelas ' + esc(item.kelas.nama_kelas) : 'Tanpa kelas') + '</p>' +
          h.badge(item.status.label, item.status.tone, { dot: true }) + '</div>' +
        '</div>' +
        '<div class="detail-metrics">' +
          '<div class="detail-metric"><span>Poin perilaku</span><strong>' + item.total_poin + ' <small>/ 100</small></strong></div>' +
          '<div class="detail-metric"><span>Nilai kompetensi</span><strong>' + item.nilai_kompetensi + ' <small>predikat ' + h.grade(item.nilai_kompetensi).letter + '</small></strong></div>' +
          '<div class="detail-metric"><span>Total catatan</span><strong>' + item.violationCount + ' <small>pelanggaran</small></strong></div>' +
        '</div>' +
        '<div class="info-grid mt-16">' +
          '<div class="info-row"><label>Wali kelas</label><span>' + esc(item.guru ? item.guru.nama : 'Belum ditentukan') + '</span></div>' +
          '<div class="info-row"><label>Akun orang tua</label><span>' + (ortu ? esc(ortu.nama) + ' · @' + esc(ortu.username) : 'Belum tertaut') + '</span></div>' +
          '<div class="info-row"><label>Status perkembangan</label><span class="strong">' + h.badge(item.status.label, item.status.tone, { dot: true }) + '</span></div>' +
          '<div class="info-row"><label>Rekomendasi</label><span>' + esc(statusNarrative(item)) + '</span></div>' +
        '</div>' +
        '<div class="section-label">' + h.icon('activity', '', 14) + 'Riwayat pelanggaran terbaru</div>' + timelineHTML,
      footer: footer
    });
  }

  function openStudentForm(id) {
    if (!IS_ADMIN()) {
      h.toast('Hanya Admin Web yang dapat mengubah data induk siswa.', 'warning');
      return;
    }
    const existing = id ? App.db.siswa.find(function (item) { return item.id_siswa === id; }) : null;
    const current = existing ? h.visibleStudents().find(function (item) { return item.id === id; }) : null;
    const kelas = App.db.kelas.slice().sort(function (a, b) { return a.nama_kelas.localeCompare(b.nama_kelas, 'id'); });
    const guru = App.db.guru.slice().sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); });
    const nextId = TB.store.nextID(App.db.siswa, 'id_siswa', 'S', 3);

    const content = '<form id="studentForm" onsubmit="App.submitStudent(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">' +
      '<div class="detail-hero" style="margin-bottom:17px;">' +
        (existing ? h.avatar(existing.nama, 'lg') : '<span class="icon-tile icon-tile--lg">' + h.icon('user', '', 24) + '</span>') +
        '<div class="detail-hero__copy"><h3>' + (existing ? esc(existing.nama) : 'Siswa baru') + '</h3><p>' + (existing ? esc(existing.id_siswa) + ' · ubah data induk siswa' : 'ID otomatis: ' + nextId) + '</p></div>' +
      '</div>' +
      '<div class="form-grid">' +
        '<div class="field field--full"><label for="studentName">Nama lengkap</label><input class="form-control" id="studentName" name="nama" value="' + esc(existing ? existing.nama : '') + '" placeholder="Nama lengkap siswa" maxlength="80" required></div>' +
        '<div class="field"><label for="studentClass">Kelas</label><select class="form-select" id="studentClass" name="id_kelas" required>' +
          '<option value="">Pilih kelas</option>' + kelas.map(function (item) { return '<option value="' + item.id_kelas + '"' + selected(existing ? existing.id_kelas : '', item.id_kelas) + '>Kelas ' + esc(item.nama_kelas) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="field"><label for="studentTeacher">Wali kelas</label><select class="form-select" id="studentTeacher" name="id_guru" required>' +
          '<option value="">Pilih guru</option>' + guru.map(function (item) { return '<option value="' + item.id_guru + '"' + selected(existing ? existing.id_guru : '', item.id_guru) + '>' + esc(item.nama) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="field field--full"><div class="form-note">' + h.icon('info', '', 14) + '<span>Nilai awal kompetensi untuk siswa baru diatur ke <strong>80</strong>. Nilai dan poin dapat diperbarui setelah data tersimpan.</span></div></div>' +
      '</div>' +
      (current ? '<div class="point-preview mt-12"><span class="point-preview__icon">' + h.icon('award', '', 16) + '</span><div class="point-preview__copy"><strong>Poin saat ini: ' + current.total_poin + ' / 100</strong><span>Poin dihitung ulang otomatis dari seluruh catatan pelanggaran.</span></div></div>' : '') +
    '</form>';

    h.modal({
      eyebrow: id ? 'Edit data siswa' : 'Data siswa baru',
      title: id ? 'Ubah data ' + (existing ? existing.nama : 'siswa') : 'Tambah siswa',
      subtitle: 'Data ini menjadi dasar poin perilaku, nilai, dan akses orang tua.',
      size: 'lg',
      content: content,
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="studentForm">' + h.icon('check', '', 15) + (id ? 'Simpan perubahan' : 'Simpan siswa') + '</button>'
    });
  }

  function submitStudent(event, id) {
    event.preventDefault();
    if (!IS_ADMIN()) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nama = String(data.get('nama') || '').trim();
    const idKelas = String(data.get('id_kelas') || '');
    const idGuru = String(data.get('id_guru') || '');

    if (!nama || !idKelas || !idGuru) {
      h.toast('Nama, kelas, dan wali kelas wajib diisi.', 'error');
      return;
    }

    App.db = TB.store.load();
    if (id) {
      const student = App.db.siswa.find(function (item) { return item.id_siswa === id; });
      if (!student) {
        h.toast('Data siswa tidak ditemukan.', 'error');
        return;
      }
      student.nama = nama;
      student.id_kelas = idKelas;
      student.id_guru = idGuru;
    } else {
      const newId = TB.store.nextID(App.db.siswa, 'id_siswa', 'S', 3);
      App.db.siswa.push({ id_siswa: newId, nama: nama, id_kelas: idKelas, id_guru: idGuru });
      App.db.nilai.push({
        id_nilai: TB.store.nextID(App.db.nilai, 'id_nilai', 'N', 3),
        id_siswa: newId,
        nilai_kompetensi: 80,
        total_poin: 100
      });
    }

    TB.store.save(App.db);
    h.closeModal();
    App.refresh();
    h.toast(id ? 'Data siswa diperbarui.' : 'Siswa baru ditambahkan.', 'success');
  }

  function deleteStudent(id) {
    if (!IS_ADMIN()) return;
    const student = App.db.siswa.find(function (item) { return item.id_siswa === id; });
    if (!student) return;
    const violations = App.db.pelanggaran.filter(function (item) { return item.id_siswa === id; });
    const violationIDs = new Set(violations.map(function (item) { return item.id_pelanggaran; }));
    const warnings = App.db.teguran.filter(function (item) { return violationIDs.has(item.id_pelanggaran); });

    h.confirm({
      eyebrow: 'Hapus data',
      title: 'Hapus siswa ini?',
      message: 'Data <strong>' + esc(student.nama) + '</strong> beserta ' + violations.length + ' catatan pelanggaran, ' + warnings.length + ' teguran, nilai, dan akun orang tua tertaut akan dihapus permanen.',
      confirmText: 'Hapus siswa',
      danger: true,
      onConfirm: function () {
        App.db = TB.store.load();
        App.db.siswa = App.db.siswa.filter(function (item) { return item.id_siswa !== id; });
        App.db.nilai = App.db.nilai.filter(function (item) { return item.id_siswa !== id; });
        App.db.pelanggaran = App.db.pelanggaran.filter(function (item) { return item.id_siswa !== id; });
        App.db.teguran = App.db.teguran.filter(function (item) { return !violationIDs.has(item.id_pelanggaran); });
        App.db.orangTua = App.db.orangTua.filter(function (item) { return item.id_siswa !== id; });
        TB.store.save(App.db);
        App.refresh();
        h.toast('Data siswa dan riwayat terkait telah dihapus.', 'success');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Teachers                                                            */
  /* ------------------------------------------------------------------ */

  function renderTeachers() {
    if (!IS_ADMIN()) {
      return h.pageHead({ title: 'Akses terbatas' }) + TB.ui.emptyState('lock', 'Halaman khusus admin', 'Manajemen akun guru hanya dapat diakses oleh Admin Web.');
    }
    const teachers = App.db.guru.map(function (teacher) {
      const classes = TB.relations.classesForGuru(App.db, teacher.id_guru);
      const students = App.db.siswa.filter(function (item) { return item.id_guru === teacher.id_guru; });
      const scores = students.map(function (student) { return TB.relations.getNilai(App.db, student.id_siswa); }).filter(Boolean);
      const average = scores.length ? Math.round(scores.reduce(function (total, item) { return total + item.total_poin; }, 0) / scores.length) : 100;
      return { teacher: teacher, classes: classes, students: students, average: average };
    });

    const cards = teachers.length
      ? teachers.map(function (item) {
          return '<article class="person-card">' +
            '<div class="person-card__head">' + h.avatar(item.teacher.nama, 'lg') +
              '<div class="person-card__identity"><h3>' + esc(item.teacher.nama) + '</h3><p>@' + esc(item.teacher.username) + ' · <span class="cell-code">' + esc(item.teacher.id_guru) + '</span></p></div>' +
              '<div class="person-card__actions">' +
                '<button type="button" class="row-action" title="Edit guru" onclick="App.openTeacherForm(\'' + item.teacher.id_guru + '\')">' + h.icon('edit', '', 14) + '</button>' +
                '<button type="button" class="row-action row-action--danger" title="Hapus guru" onclick="App.deleteTeacher(\'' + item.teacher.id_guru + '\')">' + h.icon('trash', '', 14) + '</button>' +
              '</div>' +
            '</div>' +
            '<div class="person-card__tags">' + item.classes.map(function (classItem) { return h.badge('Kelas ' + classItem.nama_kelas, 'guru'); }).join('') +
              (item.classes.length ? '' : h.badge('Belum ada kelas', 'neutral')) +
            '</div>' +
            '<div class="person-card__stats">' +
              '<div class="person-stat"><span>Siswa binaan</span><strong>' + item.students.length + '</strong></div>' +
              '<div class="person-stat"><span>Rata-rata poin</span><strong>' + item.average + '</strong></div>' +
            '</div>' +
            '<div class="person-card__footer"><span>' + h.icon('shield', '', 11) + 'Akses catat & nilai</span>' +
              '<span class="badge-soft badge-soft--success">Aktif</span>' +
            '</div>' +
          '</article>';
        }).join('')
      : TB.ui.emptyState('graduation', 'Belum ada guru', 'Tambahkan akun guru untuk mulai menggunakan dashboard.');

    return h.pageHead({
      eyebrow: 'Data kesiswaan',
      eyebrowIcon: 'graduation',
      title: 'Data Guru',
      description: 'Kelola akun guru, kelas binaan, serta akses pencatatan pelanggaran dan nilai.',
      actions: '<button type="button" class="btn btn-brand" onclick="App.openTeacherForm()">' + h.icon('plus', '', 15) + 'Tambah guru</button>'
    }) +
    '<div class="toolbar"><div class="toolbar__left"><span class="chip">' + h.icon('users', '', 13) + teachers.length + ' akun guru</span><span class="chip">' + h.icon('layers', '', 13) + App.db.kelas.length + ' kelas</span></div>' +
      '<div class="toolbar__count">Wali kelas ditentukan dari data siswa</div></div>' +
    '<div class="people-grid">' + cards + '</div>';
  }

  function openTeacherForm(id) {
    if (!IS_ADMIN()) return;
    const teacher = id ? App.db.guru.find(function (item) { return item.id_guru === id; }) : null;
    const nextId = TB.store.nextID(App.db.guru, 'id_guru', 'G', 2);
    const content = '<form id="teacherForm" onsubmit="App.submitTeacher(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">' +
      '<div class="detail-hero" style="margin-bottom:17px;">' +
        (teacher ? h.avatar(teacher.nama, 'lg') : '<span class="icon-tile icon-tile--lg">' + h.icon('graduation', '', 23) + '</span>') +
        '<div class="detail-hero__copy"><h3>' + (teacher ? esc(teacher.nama) : 'Akun guru baru') + '</h3><p>' + (teacher ? 'ID ' + esc(teacher.id_guru) : 'ID otomatis: ' + nextId) + '</p></div>' +
      '</div>' +
      '<div class="form-stack">' +
        '<div class="field"><label for="teacherName">Nama lengkap</label><input class="form-control" id="teacherName" name="nama" value="' + esc(teacher ? teacher.nama : '') + '" placeholder="cth. Ratna Wulandari, S.Pd." required></div>' +
        '<div class="form-row">' +
          '<div class="field"><label for="teacherUsername">Username</label><input class="form-control" id="teacherUsername" name="username" value="' + esc(teacher ? teacher.username : '') + '" placeholder="cth. guru.ratna" autocomplete="off" required></div>' +
          '<div class="field"><label for="teacherPassword">Kata sandi</label><input class="form-control" id="teacherPassword" name="password" type="text" value="" placeholder="' + (teacher ? 'Biarkan kosong bila tidak diubah' : 'Minimal 6 karakter') + '" autocomplete="new-password"' + (teacher ? '' : ' required') + '></div>' +
        '</div>' +
        '<div class="form-note">' + h.icon('info', '', 14) + '<span>Guru dapat melihat siswa dengan <strong>id_guru</strong> yang sama, mencatat pelanggaran, dan memperbarui nilai. Username harus unik di seluruh akun.</span></div>' +
      '</div>' +
    '</form>';
    h.modal({
      eyebrow: id ? 'Edit akun guru' : 'Akun guru baru',
      title: id ? 'Ubah akun guru' : 'Tambah guru',
      subtitle: 'Akun ini digunakan untuk masuk ke dashboard guru.',
      content: content,
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="teacherForm">' + h.icon('check', '', 15) + (id ? 'Simpan perubahan' : 'Simpan guru') + '</button>'
    });
  }

  function usernameTaken(username, ignoreRole, ignoreId) {
    const name = String(username || '').toLowerCase();
    const checks = [
      { role: 'admin', items: App.db.admin, id: 'id_admin' },
      { role: 'guru', items: App.db.guru, id: 'id_guru' },
      { role: 'pj', items: App.db.pj, id: 'id_pj' },
      { role: 'orangtua', items: App.db.orangTua, id: 'id_ortu' }
    ];
    return checks.some(function (check) {
      if (ignoreRole === check.role) return false;
      return check.items.some(function (account) {
        return account.username.toLowerCase() === name && account[check.id] !== ignoreId;
      });
    });
  }

  function submitTeacher(event, id) {
    event.preventDefault();
    if (!IS_ADMIN()) return;
    const data = new FormData(event.currentTarget);
    const nama = String(data.get('nama') || '').trim();
    const username = String(data.get('username') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    if (!nama || !username) {
      h.toast('Nama dan username wajib diisi.', 'error');
      return;
    }
    if (usernameTaken(username, 'guru', id)) {
      h.toast('Username sudah digunakan akun lain. Pilih username berbeda.', 'error');
      return;
    }
    if (!id && password.length < 6) {
      h.toast('Kata sandi minimal 6 karakter.', 'error');
      return;
    }
    if (id && password && password.length < 6) {
      h.toast('Kata sandi baru minimal 6 karakter.', 'error');
      return;
    }

    App.db = TB.store.load();
    if (id) {
      const teacher = App.db.guru.find(function (item) { return item.id_guru === id; });
      if (!teacher) return;
      teacher.nama = nama;
      teacher.username = username;
      if (password) teacher.password = password;
    } else {
      App.db.guru.push({
        id_guru: TB.store.nextID(App.db.guru, 'id_guru', 'G', 2),
        nama: nama,
        username: username,
        password: password
      });
    }
    TB.store.save(App.db);
    h.closeModal();
    App.refresh();
    h.toast(id ? 'Akun guru diperbarui.' : 'Akun guru baru ditambahkan.', 'success');
  }

  function deleteTeacher(id) {
    if (!IS_ADMIN()) return;
    const teacher = App.db.guru.find(function (item) { return item.id_guru === id; });
    if (!teacher) return;
    const assigned = App.db.siswa.filter(function (item) { return item.id_guru === id; });
    if (assigned.length) {
      h.toast('Guru masih membina ' + assigned.length + ' siswa. Pindahkan siswa ke wali lain terlebih dahulu.', 'warning');
      return;
    }
    h.confirm({
      eyebrow: 'Hapus akun',
      title: 'Hapus akun guru?',
      message: 'Akun <strong>' + esc(teacher.nama) + '</strong> akan dihapus dan tidak dapat masuk lagi ke dashboard.',
      confirmText: 'Hapus guru',
      danger: true,
      onConfirm: function () {
        App.db = TB.store.load();
        App.db.guru = App.db.guru.filter(function (item) { return item.id_guru !== id; });
        TB.store.save(App.db);
        App.refresh();
        h.toast('Akun guru dihapus.', 'success');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Classes                                                             */
  /* ------------------------------------------------------------------ */

  function renderClasses() {
    if (!IS_ADMIN()) {
      return h.pageHead({ title: 'Akses terbatas' }) + TB.ui.emptyState('lock', 'Halaman khusus admin', 'Manajemen kelas hanya dapat diakses oleh Admin Web.');
    }
    const summaries = h.visibleClasses().sort(function (a, b) {
      return a.kelas.nama_kelas.localeCompare(b.kelas.nama_kelas, 'id');
    });
    const cards = summaries.length
      ? summaries.map(function (item) {
          return '<article class="class-card">' +
            '<div class="class-card__top"><span class="class-badge">' + esc(item.kelas.nama_kelas) + '</span>' +
              '<div class="class-card__actions">' +
                '<button type="button" class="row-action" title="Lihat siswa" onclick="App.viewClassStudents(\'' + item.kelas.id_kelas + '\')">' + h.icon('eye', '', 14) + '</button>' +
                '<button type="button" class="row-action" title="Edit kelas" onclick="App.openClassForm(\'' + item.kelas.id_kelas + '\')">' + h.icon('edit', '', 14) + '</button>' +
                '<button type="button" class="row-action row-action--danger" title="Hapus kelas" onclick="App.deleteClass(\'' + item.kelas.id_kelas + '\')">' + h.icon('trash', '', 14) + '</button>' +
              '</div>' +
            '</div>' +
            '<h3>Kelas ' + esc(item.kelas.nama_kelas) + '</h3>' +
            '<div class="class-card__wali">' + h.icon('graduation', '', 11) + (item.wali ? esc(item.wali.nama) : 'Wali belum ditentukan') + '</div>' +
            '<div class="class-card__stats">' +
              '<div class="class-card__stat"><span>Siswa</span><strong>' + item.count + '</strong></div>' +
              '<div class="class-card__stat"><span>Rata-rata poin</span><strong>' + item.average + '</strong></div>' +
              '<div class="class-card__stat"><span>Catatan</span><strong>' + item.violations.length + '</strong></div>' +
            '</div>' +
            '<div class="class-card__progress"><div class="class-card__progress-head"><span>Rata-rata perilaku</span><span>' + item.average + ' / 100</span></div>' +
              '<div class="progress-bar"><span style="width:' + item.average + '%;background:' + (item.average >= 85 ? 'var(--teal)' : item.average >= 70 ? 'var(--yellow)' : 'var(--danger)') + '"></span></div></div>' +
          '</article>';
        }).join('')
      : TB.ui.emptyState('layers', 'Belum ada kelas', 'Tambahkan kelas untuk mulai menata data siswa.');

    return h.pageHead({
      eyebrow: 'Data kesiswaan',
      eyebrowIcon: 'layers',
      title: 'Data Kelas',
      description: 'Setiap kelas menampung data siswa. Wali kelas ditentukan dari guru pada data siswa.',
      actions: '<button type="button" class="btn btn-brand" onclick="App.openClassForm()">' + h.icon('plus', '', 15) + 'Tambah kelas</button>'
    }) +
    '<div class="toolbar"><div class="toolbar__left"><span class="chip">' + h.icon('layers', '', 13) + summaries.length + ' kelas</span><span class="chip">' + h.icon('users', '', 13) + App.db.siswa.length + ' siswa</span></div>' +
      '<div class="toolbar__count">Klik ikon mata untuk melihat siswa per kelas</div></div>' +
    '<div class="class-grid">' + cards + '</div>';
  }

  function openClassForm(id) {
    if (!IS_ADMIN()) return;
    const existing = id ? App.db.kelas.find(function (item) { return item.id_kelas === id; }) : null;
    const nextId = TB.store.nextID(App.db.kelas, 'id_kelas', 'K', 2);
    h.modal({
      eyebrow: id ? 'Edit kelas' : 'Kelas baru',
      title: id ? 'Ubah kelas' : 'Tambah kelas',
      subtitle: 'Nama kelas ditampilkan pada data siswa, nilai, dan laporan.',
      content: '<form id="classForm" onsubmit="App.submitClass(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">' +
        '<div class="detail-hero" style="margin-bottom:17px;"><span class="icon-tile icon-tile--lg">' + h.icon('layers', '', 23) + '</span>' +
          '<div class="detail-hero__copy"><h3>' + (existing ? 'Kelas ' + esc(existing.nama_kelas) : 'Kelas baru') + '</h3><p>' + (existing ? 'ID ' + esc(existing.id_kelas) : 'ID otomatis: ' + nextId) + '</p></div></div>' +
        '<div class="field"><label for="className">Nama kelas</label><input class="form-control" id="className" name="nama_kelas" value="' + esc(existing ? existing.nama_kelas : '') + '" placeholder="cth. 4A" maxlength="20" required></div>' +
        '<div class="form-note mt-12">' + h.icon('info', '', 14) + '<span>Gunakan format singkat seperti <strong>1A</strong>, <strong>4B</strong>, atau <strong>6A</strong> agar mudah dibaca di seluruh dashboard.</span></div>' +
      '</form>',
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="classForm">' + h.icon('check', '', 15) + (id ? 'Simpan perubahan' : 'Simpan kelas') + '</button>'
    });
  }

  function submitClass(event, id) {
    event.preventDefault();
    if (!IS_ADMIN()) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('nama_kelas') || '').trim();
    if (!name) {
      h.toast('Nama kelas wajib diisi.', 'error');
      return;
    }
    const duplicate = App.db.kelas.some(function (item) {
      return item.nama_kelas.toLowerCase() === name.toLowerCase() && item.id_kelas !== id;
    });
    if (duplicate) {
      h.toast('Nama kelas sudah digunakan.', 'error');
      return;
    }
    App.db = TB.store.load();
    if (id) {
      const classItem = App.db.kelas.find(function (item) { return item.id_kelas === id; });
      if (!classItem) return;
      classItem.nama_kelas = name;
    } else {
      App.db.kelas.push({ id_kelas: TB.store.nextID(App.db.kelas, 'id_kelas', 'K', 2), nama_kelas: name });
    }
    TB.store.save(App.db);
    h.closeModal();
    App.refresh();
    h.toast(id ? 'Data kelas diperbarui.' : 'Kelas baru ditambahkan.', 'success');
  }

  function deleteClass(id) {
    if (!IS_ADMIN()) return;
    const classItem = App.db.kelas.find(function (item) { return item.id_kelas === id; });
    if (!classItem) return;
    const students = App.db.siswa.filter(function (item) { return item.id_kelas === id; });
    if (students.length) {
      h.toast('Kelas masih memiliki ' + students.length + ' siswa. Pindahkan siswa terlebih dahulu.', 'warning');
      return;
    }
    h.confirm({
      eyebrow: 'Hapus kelas',
      title: 'Hapus kelas ini?',
      message: 'Kelas <strong>' + esc(classItem.nama_kelas) + '</strong> akan dihapus dari data induk.',
      confirmText: 'Hapus kelas',
      danger: true,
      onConfirm: function () {
        App.db = TB.store.load();
        App.db.kelas = App.db.kelas.filter(function (item) { return item.id_kelas !== id; });
        TB.store.save(App.db);
        App.refresh();
        h.toast('Kelas dihapus.', 'success');
      }
    });
  }

  function viewClassStudents(id) {
    state.filters.siswa = { q: '', kelas: id, status: 'all' };
    App.go('siswa');
  }

  /* ------------------------------------------------------------------ */
  /* Profile                                                             */
  /* ------------------------------------------------------------------ */

  function renderProfile() {
    const account = h.getAccount();
    if (!account) {
      return h.pageHead({ title: 'Profil tidak ditemukan' }) + TB.ui.emptyState('user', 'Akun tidak ditemukan', 'Silakan masuk kembali.');
    }
    const role = App.session.role;
    const child = role === 'orangtua' ? h.visibleStudents()[0] : null;
    const stats = TB.stats.compute(App.db, App.session);
    const extraInfo = role === 'admin'
      ? '<div class="profile-info-row"><span>Tanggung jawab</span><strong>Seluruh data &amp; pengaturan web</strong></div>'
      : role === 'guru'
        ? '<div class="profile-info-row"><span>Kelas binaan</span><strong>' + TB.relations.classesForGuru(App.db, App.session.id).map(function (item) { return item.nama_kelas; }).join(', ') + '</strong></div>'
        : role === 'pj'
          ? '<div class="profile-info-row"><span>Tanggung jawab</span><strong>Tinjauan pelanggaran &amp; teguran</strong></div>'
          : '<div class="profile-info-row"><span>Ananda</span><strong>' + (child ? esc(child.nama) + ' · Kelas ' + esc(child.kelas ? child.kelas.nama_kelas : '—') : 'Belum tertaut') + '</strong></div>';

    const content = '<div class="profile-grid">' +
      '<article class="profile-hero">' +
        h.avatar(account.nama, 'xl') +
        '<h2>' + esc(account.nama) + '</h2>' +
        '<p>@' + esc(account.username) + ' · ' + h.roleLabel(role) + '</p>' +
        '<div class="profile-hero__meta">' + h.badge('Akun ' + h.roleLabel(role), roleAccent(role), { icon: 'shield' }) + h.badge('Aktif', 'success', { dot: true }) + '</div>' +
        '<div class="profile-hero__info">' +
          '<div class="profile-hero__info-row"><span>ID akun</span><strong>' + esc(App.session.id) + '</strong></div>' +
          '<div class="profile-hero__info-row"><span>Username</span><strong>@' + esc(account.username) + '</strong></div>' +
          '<div class="profile-hero__info-row"><span>Sekolah</span><strong>' + esc(App.db.meta.school) + '</strong></div>' +
          '<div class="profile-hero__info-row"><span>Tahun ajaran</span><strong>' + esc(App.db.meta.tahunAjaran) + '</strong></div>' +
        '</div>' +
        '<div style="position:relative;z-index:1;display:flex;gap:7px;margin-top:18px;">' +
          '<button type="button" class="btn btn-soft btn-sm" onclick="App.copyUsername(\'' + esc(account.username) + '\')">' + h.icon('copy', '', 13) + 'Salin username</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" style="color:rgba(255,255,255,.7);" onclick="App.openHelp()">' + h.icon('help', '', 13) + 'Panduan</button>' +
        '</div>' +
      '</article>' +
      '<div class="profile-stack">' +
        '<article class="panel profile-panel">' +
          '<div class="panel__head"><div class="panel__title"><h2>Informasi akun</h2><p>Ringkasan akses dan data terkait</p></div>' + h.badge(h.roleLabel(role), roleAccent(role)) + '</div>' +
          '<div class="profile-info-list">' +
            '<div class="profile-info-row"><span>Nama</span><strong>' + esc(account.nama) + '</strong></div>' +
            '<div class="profile-info-row"><span>Username</span><strong>@' + esc(account.username) + '</strong></div>' +
            '<div class="profile-info-row"><span>Peran</span><strong>' + h.roleLabel(role) + '</strong></div>' +
            extraInfo +
            '<div class="profile-info-row"><span>Data dalam cakupan</span><strong>' + stats.students.length + ' siswa · ' + stats.violations.length + ' catatan</strong></div>' +
          '</div>' +
        '</article>' +
        (child ? '<article class="panel profile-panel">' +
          '<div class="panel__head"><div class="panel__title"><h2>Data ananda</h2><p>Terhubung dengan akun orang tua ini</p></div>' +
            '<button type="button" class="panel__link" onclick="App.go(\'dashboard\')">Ringkasan ' + h.icon('arrowRight', '', 12) + '</button></div>' +
          '<div class="detail-hero">' + h.avatar(child.nama, 'md') + '<div class="detail-hero__copy"><h3>' + esc(child.nama) + '</h3><p>' + esc(child.id) + ' · Kelas ' + esc(child.kelas ? child.kelas.nama_kelas : '—') + '</p>' + h.badge(child.status.label, child.status.tone, { dot: true }) + '</div>' +
            '<span style="margin-left:auto;text-align:right;"><strong style="font-size:20px;color:var(--navy);">' + child.total_poin + '</strong><br><span style="font-size:8px;color:var(--muted);">poin</span></span></div>' +
        '</article>' : '') +
        '<article class="panel profile-panel">' +
          '<div class="panel__head"><div class="panel__title"><h2>Keamanan akun</h2><p>Ubah kata sandi untuk menjaga akses</p></div>' + h.icon('key', '', 17) + '</div>' +
          '<form class="profile-password-form" onsubmit="App.submitPasswordChange(event)">' +
            '<div class="form-row">' +
              '<div class="field"><label for="currentPassword">Kata sandi saat ini</label><input class="form-control" id="currentPassword" name="current" type="password" autocomplete="current-password" required></div>' +
              '<div class="field"><label for="newPassword">Kata sandi baru</label><input class="form-control" id="newPassword" name="next" type="password" minlength="6" autocomplete="new-password" required></div>' +
            '</div>' +
            '<div class="field"><label for="confirmPassword">Ulangi kata sandi baru</label><input class="form-control" id="confirmPassword" name="confirm" type="password" minlength="6" autocomplete="new-password" required></div>' +
            '<div class="form-note">' + h.icon('info', '', 13) + '<span>Kata sandi demo tersimpan di browser. Hindari menggunakan kata sandi asli pada demo ini.</span></div>' +
            '<button type="submit" class="btn btn-brand btn-sm">' + h.icon('lock', '', 14) + 'Perbarui kata sandi</button>' +
          '</form>' +
        '</article>' +
        (IS_ADMIN() ? '<article class="panel danger-panel">' +
          '<div class="panel__head"><div class="panel__title"><h2>Reset data demo</h2><p>Kembalikan seluruh data contoh ke kondisi awal</p></div>' + h.icon('refresh', '', 17) + '</div>' +
          '<p>Tindakan ini akan menghapus seluruh perubahan pada siswa, pelanggaran, teguran, nilai, artikel, dan akun. Kata sandi demo akan kembali seperti semula.</p>' +
          '<button type="button" class="btn btn-outline btn-sm mt-12" onclick="App.resetDemoData()">' + h.icon('refresh', '', 13) + 'Reset data demo</button>' +
        '</article>' : '') +
      '</div>' +
    '</div>';

    return h.pageHead({
      eyebrow: 'Akun saya',
      eyebrowIcon: 'settings',
      title: 'Profil & Pengaturan',
      description: 'Kelola informasi akun dan keamanan akses Anda.',
      actions: '<a class="btn btn-white" href="index.html" target="_blank" rel="noreferrer">' + h.icon('externalLink', '', 15) + 'Lihat situs</a>'
    }) + content;
  }

  App.copyUsername = function (username) {
    TB.ui.copyText(username).then(function (ok) {
      h.toast(ok ? 'Username disalin ke clipboard.' : 'Tidak dapat menyalin secara otomatis.', ok ? 'success' : 'error');
    });
  };

  App.submitPasswordChange = function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const current = String(data.get('current') || '');
    const next = String(data.get('next') || '');
    const confirm = String(data.get('confirm') || '');
    if (next !== confirm) {
      h.toast('Konfirmasi kata sandi belum sama.', 'error');
      return;
    }
    const result = TB.auth.changePassword(current, next);
    if (!result.ok) {
      h.toast(result.error, 'error');
      return;
    }
    form.reset();
    h.toast('Kata sandi berhasil diperbarui.', 'success');
  };

  App.resetDemoData = function () {
    h.confirm({
      eyebrow: 'Reset data',
      title: 'Kembalikan data demo?',
      message: 'Seluruh perubahan akan dihapus dan data awal dimuat kembali. Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Reset sekarang',
      danger: true,
      onConfirm: function () {
        TB.store.reset();
        App.db = TB.store.load();
        App.refresh();
        h.toast('Data demo berhasil dikembalikan ke kondisi awal.', 'success');
      }
    });
  };

  /* ------------------------------------------------------------------ */
  /* Renderer registration                                               */
  /* ------------------------------------------------------------------ */

  App.renderers.dashboard = renderDashboard;
  App.renderers.siswa = renderStudents;
  App.renderers.guru = renderTeachers;
  App.renderers.kelas = renderClasses;
  App.renderers.profil = renderProfile;

  App.openStudentDetail = openStudentDetail;
  App.openStudentForm = openStudentForm;
  App.submitStudent = submitStudent;
  App.deleteStudent = deleteStudent;
  App.openTeacherForm = openTeacherForm;
  App.submitTeacher = submitTeacher;
  App.deleteTeacher = deleteTeacher;
  App.openClassForm = openClassForm;
  App.submitClass = submitClass;
  App.deleteClass = deleteClass;
  App.viewClassStudents = viewClassStudents;
  App.firstName = firstName;
  App.monthSeries = monthSeries;
  App.usernameTaken = usernameTaken;
  App.CAN_RECORD = CAN_RECORD;
  App.CAN_WARN = CAN_WARN;
})();
