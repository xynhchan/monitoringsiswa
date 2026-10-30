/* ==========================================================================
   TumbuhBaik — page renderers & actions (part 2)
   Violations, warnings, scores, violation types, articles, assets and PJ.
   ========================================================================== */
(function () {
  'use strict';

  const TB = window.TB;
  const App = window.App;
  const h = App.h;
  const state = App.state;
  const esc = h.esc;

  const $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  const ROLE = function () { return App.session.role; };
  const IS_PARENT = function () { return ROLE() === 'orangtua'; };
  const IS_ADMIN = function () { return ROLE() === 'admin'; };
  const CAN_RECORD = function () { return ['admin', 'guru', 'pj'].indexOf(ROLE()) !== -1; };
  const CAN_WARN = function () { return ['admin', 'pj'].indexOf(ROLE()) !== -1; };
  const CAN_EDIT_VIOLATION = function () { return ['admin', 'pj'].indexOf(ROLE()) !== -1; };
  const CAN_EDIT_SCORE = function () { return ['admin', 'guru'].indexOf(ROLE()) !== -1; };

  function selected(value, expected) {
    return String(value) === String(expected) ? ' selected' : '';
  }

  function roleClasses() {
    const rows = h.visibleStudents();
    const map = {};
    rows.forEach(function (item) {
      if (!item.kelas) return;
      map[item.kelas.id_kelas] = item.kelas;
    });
    return Object.keys(map).map(function (id) { return { kelas: map[id] }; })
      .sort(function (a, b) { return a.kelas.nama_kelas.localeCompare(b.kelas.nama_kelas, 'id'); });
  }

  function classFilterOptions(current) {
    const classes = roleClasses();
    return '<option value="all"' + selected(current, 'all') + '>Semua kelas</option>' + classes.map(function (item) {
      return '<option value="' + esc(item.kelas.id_kelas) + '"' + selected(current, item.kelas.id_kelas) + '>Kelas ' + esc(item.kelas.nama_kelas) + '</option>';
    }).join('');
  }

  function violationTypeOptions(current, includeAll) {
    return (includeAll ? '<option value="all"' + selected(current, 'all') + '>Semua jenis</option>' : '') +
      App.db.jenisPelanggaran.map(function (item) {
        return '<option value="' + item.id_jenis + '"' + selected(current, item.id_jenis) + '>' + esc(item.nama_pelanggaran) + ' (−' + item.pengurangan_poin + ')</option>';
      }).join('');
  }

  function violationStatusOptions(current) {
    return '<option value="all"' + selected(current, 'all') + '>Semua status</option>' +
      '<option value="pending"' + selected(current, 'pending') + '>Perlu tindak lanjut</option>' +
      '<option value="done"' + selected(current, 'done') + '>Sudah ditindaklanjuti</option>';
  }

  function clearButton(page, active) {
    return active ? '<button type="button" class="btn btn-ghost btn-sm" onclick="App.resetFilters(\'' + page + '\')">' + h.icon('refresh', '', 13) + 'Reset</button>' : '';
  }

  function pendingBadge(item) {
    return item.warning
      ? h.badge('Ditindaklanjuti', 'success', { dot: true })
      : h.badge('Perlu tindak lanjut', 'warning', { dot: true });
  }

  function textExcerpt(text, length) {
    const value = String(text || '').trim();
    if (value.length <= length) return value;
    return value.slice(0, length).trim() + '…';
  }

  function studentName(item) {
    return item && item.student ? item.student.nama : 'Siswa';
  }

  function classLabel(item) {
    return item && item.kelas ? 'Kelas ' + item.kelas.nama_kelas : '—';
  }

  function typePoints(jenis) {
    return jenis ? Number(jenis.pengurangan_poin) : 0;
  }

  /* ------------------------------------------------------------------ */
  /* Violations                                                          */
  /* ------------------------------------------------------------------ */

  function renderViolations() {
    if (IS_PARENT()) return renderParentViolations();

    const filters = state.filters.pelanggaran;
    const all = h.visibleViolations();
    const pending = all.filter(function (item) { return item.isPending; });
    const query = filters.q.toLowerCase();

    const filtered = all.filter(function (item) {
      const haystack = [studentName(item), item.kelas ? item.kelas.nama_kelas : '', item.jenis ? item.jenis.nama_pelanggaran : '', item.keterangan].join(' ').toLowerCase();
      const matchSearch = !query || haystack.indexOf(query) !== -1;
      const matchClass = filters.kelas === 'all' || (item.kelas && item.kelas.id_kelas === filters.kelas);
      const matchType = filters.jenis === 'all' || (item.jenis && item.jenis.id_jenis === filters.jenis);
      const matchStatus = filters.status === 'all' || (filters.status === 'pending' ? item.isPending : !item.isPending);
      return matchSearch && matchClass && matchType && matchStatus;
    });
    const active = !!filters.q || filters.kelas !== 'all' || filters.jenis !== 'all' || filters.status !== 'all';

    const rows = filtered.length
      ? filtered.map(function (item) {
          return '<tr>' +
            '<td><span class="cell-date">' + h.icon('calendar', '', 12) + h.fmtShortDate(item.tanggal) + '</span><span class="cell-sub">' + esc(item.id) + '</span></td>' +
            '<td>' + h.entityCell(studentName(item), classLabel(item)) + '</td>' +
            '<td><span class="cell-main">' + esc(item.jenis ? item.jenis.nama_pelanggaran : '—') + '</span><span class="cell-sub">' + esc(textExcerpt(item.keterangan, 52)) + '</span></td>' +
            '<td><span class="deduction-badge ' + (typePoints(item.jenis) <= 5 ? 'deduction-badge--light' : typePoints(item.jenis) >= 20 ? '' : 'deduction-badge--mild') + '">−' + typePoints(item.jenis) + ' poin</span></td>' +
            '<td>' + pendingBadge(item) + '</td>' +
            '<td><div class="row-actions">' +
              '<button type="button" class="row-action" title="Lihat detail" onclick="App.openViolationDetail(\'' + item.id + '\')">' + h.icon('eye', '', 15) + '</button>' +
              (item.isPending && CAN_WARN() ? '<button type="button" class="row-action" title="Buat teguran" onclick="App.openWarningForm(null, \'' + item.id + '\')">' + h.icon('clipboard', '', 14) + '</button>' : '') +
              (CAN_EDIT_VIOLATION() ? '<button type="button" class="row-action" title="Edit catatan" onclick="App.openViolationForm(\'' + item.id + '\')">' + h.icon('edit', '', 14) + '</button>' : '') +
              (IS_ADMIN() ? '<button type="button" class="row-action row-action--danger" title="Hapus catatan" onclick="App.deleteViolation(\'' + item.id + '\')">' + h.icon('trash', '', 14) + '</button>' : '') +
            '</div></td>' +
          '</tr>';
        }).join('')
      : h.emptyRow(6, 'Catatan tidak ditemukan', 'Coba ubah filter atau kata kunci pencarian.', 'shield');

    return h.pageHead({
      eyebrow: 'Monitoring perilaku',
      eyebrowIcon: 'alert',
      title: 'Pelanggaran & Catatan',
      description: 'Catat kejadian dengan jelas, lalu tindak lanjuti melalui teguran yang mendidik.',
      meta: h.badge(pending.length + ' perlu tindak lanjut', pending.length ? 'warning' : 'success', { dot: true }) +
        h.badge(all.length + ' total catatan', 'neutral', { icon: 'file' }),
      actions: '<button type="button" class="btn btn-brand" onclick="App.openViolationForm()">' + h.icon('plus', '', 15) + 'Catat pelanggaran</button>'
    }) +
    (pending.length ? '<div class="notice-banner">' +
      '<span class="notice-banner__icon">' + h.icon('alert', '', 17) + '</span>' +
      '<div class="notice-banner__copy"><strong>' + pending.length + ' catatan belum memiliki teguran</strong><span>Tindak lanjuti dengan pendampingan yang sesuai, bukan sekadar hukuman.</span></div>' +
      '<button type="button" class="btn btn-soft" onclick="App.applyFilter(\'pelanggaran\',\'status\',\'pending\')">Filter pending ' + h.icon('arrowRight', '', 13) + '</button>' +
    '</div>' : '') +
    '<div class="toolbar">' +
      '<div class="toolbar__left">' +
        '<div class="filter-search">' + h.icon('search', '', 14) +
          '<input class="form-control" id="filter-pelanggaran-q" type="text" value="' + esc(filters.q) + '" placeholder="Cari siswa atau catatan…" oninput="App.applyFilter(\'pelanggaran\',\'q\',this.value)">' +
        '</div>' +
        '<select class="form-select" id="filter-pelanggaran-kelas" onchange="App.applyFilter(\'pelanggaran\',\'kelas\',this.value)">' + classFilterOptions(filters.kelas) + '</select>' +
        '<select class="form-select" id="filter-pelanggaran-jenis" onchange="App.applyFilter(\'pelanggaran\',\'jenis\',this.value)">' + violationTypeOptions(filters.jenis, true) + '</select>' +
        '<select class="form-select" id="filter-pelanggaran-status" onchange="App.applyFilter(\'pelanggaran\',\'status\',this.value)">' + violationStatusOptions(filters.status) + '</select>' +
        clearButton('pelanggaran', active) +
      '</div>' +
      '<div class="toolbar__count"><strong>' + filtered.length + '</strong> dari ' + all.length + ' catatan</div>' +
    '</div>' +
    '<article class="panel panel--flush table-panel">' +
      '<div class="table-wrap"><table class="data-table data-table--violations">' +
        '<thead><tr><th>Tanggal</th><th>Siswa</th><th>Jenis &amp; keterangan</th><th>Poin</th><th>Status</th><th></th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
      '<div class="panel__footer" style="padding:11px 17px;margin:0;border-top:1px solid var(--line);"><span class="panel__footer-note">Poin berkurang otomatis sesuai jenis pelanggaran</span><span class="badge-soft badge-soft--neutral">' + esc(App.db.meta.tahunAjaran) + '</span></div>' +
    '</article>';
  }

  function renderParentViolations() {
    const all = h.visibleViolations();
    const filters = state.filters.pelanggaran;
    const query = filters.q.toLowerCase();
    const filtered = all.filter(function (item) {
      const haystack = [item.jenis ? item.jenis.nama_pelanggaran : '', item.keterangan].join(' ').toLowerCase();
      const matchSearch = !query || haystack.indexOf(query) !== -1;
      const matchType = filters.jenis === 'all' || (item.jenis && item.jenis.id_jenis === filters.jenis);
      const matchStatus = filters.status === 'all' || (filters.status === 'pending' ? item.isPending : !item.isPending);
      return matchSearch && matchType && matchStatus;
    });
    const pending = all.filter(function (item) { return item.isPending; });
    const thisMonth = all.filter(function (item) { return TB.utils.monthKey(item.tanggal) === TB.utils.monthKey(h.today()); });
    const active = !!filters.q || filters.jenis !== 'all' || filters.status !== 'all';

    const rows = filtered.length
      ? filtered.map(function (item) {
          return '<tr>' +
            '<td><span class="cell-date">' + h.icon('calendar', '', 12) + h.fmtDate(item.tanggal) + '</span></td>' +
            '<td><span class="cell-main">' + esc(item.jenis ? item.jenis.nama_pelanggaran : '—') + '</span><span class="cell-sub">' + esc(textExcerpt(item.keterangan, 60)) + '</span></td>' +
            '<td><span class="deduction-badge">−' + typePoints(item.jenis) + ' poin</span></td>' +
            '<td>' + pendingBadge(item) + '</td>' +
            '<td><button type="button" class="row-action" title="Lihat detail" onclick="App.openViolationDetail(\'' + item.id + '\')">' + h.icon('eye', '', 15) + '</button></td>' +
          '</tr>';
        }).join('')
      : h.emptyRow(5, 'Tidak ada catatan', 'Tidak ada catatan yang sesuai dengan filter.', 'shield');

    return h.pageHead({
      eyebrow: 'Riwayat ananda',
      eyebrowIcon: 'alert',
      title: 'Pelanggaran Anak',
      description: 'Setiap catatan disertai keterangan dan tindak lanjut. Baca dengan tenang, lalu ajak anak berdiskusi.',
      actions: '<button type="button" class="btn btn-white" onclick="App.go(\'teguran\')">' + h.icon('clipboard', '', 15) + 'Lihat teguran</button>'
    }) +
    '<div class="parent-summary">' +
      h.statCard({ icon: 'alert', label: 'Total catatan', value: all.length, tone: 'coral', foot: '<strong>' + thisMonth.length + ' catatan</strong> bulan ini' }) +
      h.statCard({ icon: 'checkCircle', label: 'Sudah ditindaklanjuti', value: all.length - pending.length, foot: pending.length ? pending.length + ' menunggu tindak lanjut' : 'Semua sudah ditindaklanjuti', tone: 'mint' }) +
      h.statCard({ icon: 'calendar', label: 'Bulan ini', value: thisMonth.length, foot: 'Periode ' + TB.data.MONTHS_LONG[new Date().getMonth()] + ' ' + new Date().getFullYear(), tone: 'yellow' }) +
    '</div>' +
    '<div class="toolbar">' +
      '<div class="toolbar__left">' +
        '<div class="filter-search">' + h.icon('search', '', 14) +
          '<input class="form-control" id="filter-pelanggaran-q" type="text" value="' + esc(filters.q) + '" placeholder="Cari jenis atau keterangan…" oninput="App.applyFilter(\'pelanggaran\',\'q\',this.value)">' +
        '</div>' +
        '<select class="form-select" id="filter-pelanggaran-jenis" onchange="App.applyFilter(\'pelanggaran\',\'jenis\',this.value)">' + violationTypeOptions(filters.jenis, true) + '</select>' +
        '<select class="form-select" id="filter-pelanggaran-status" onchange="App.applyFilter(\'pelanggaran\',\'status\',this.value)">' + violationStatusOptions(filters.status) + '</select>' +
        clearButton('pelanggaran', active) +
      '</div>' +
      '<div class="toolbar__count"><strong>' + filtered.length + '</strong> catatan ditampilkan</div>' +
    '</div>' +
    '<article class="panel panel--flush table-panel">' +
      '<div class="table-wrap"><table class="data-table">' +
        '<thead><tr><th>Tanggal</th><th>Pelanggaran</th><th>Poin</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '</article>' +
    '<div class="panel-note mt-12">' + h.icon('heartHandshake', '', 15) + '<span>Catatan ini adalah alat komunikasi, bukan label untuk anak. Diskusikan dengan wali kelas jika Anda membutuhkan dukungan tambahan.</span></div>';
  }

  function openViolationDetail(id) {
    const item = h.visibleViolations().find(function (record) { return record.id === id; });
    if (!item) {
      h.toast('Catatan tidak ditemukan atau bukan bagian dari akses Anda.', 'error');
      return;
    }
    const warning = item.warning;
    const footer = '<button type="button" class="btn btn-ghost" data-modal-close>Tutup</button>' +
      (item.isPending && CAN_WARN() ? '<button type="button" class="btn btn-brand" onclick="App.openWarningForm(null, \'' + item.id + '\')">' + h.icon('clipboard', '', 14) + 'Buat teguran</button>' : '') +
      (CAN_EDIT_VIOLATION() ? '<button type="button" class="btn btn-soft" onclick="App.openViolationForm(\'' + item.id + '\')">' + h.icon('edit', '', 14) + 'Edit' + '</button>' : '');

    h.modal({
      eyebrow: 'Detail pelanggaran',
      title: item.jenis ? item.jenis.nama_pelanggaran : 'Catatan pelanggaran',
      subtitle: h.fmtDate(item.tanggal, 'long') + ' · ' + esc(item.id),
      size: 'lg',
      content: '<div class="detail-hero">' +
        h.avatar(studentName(item), 'lg') +
        '<div class="detail-hero__copy"><h3>' + esc(studentName(item)) + '</h3><p>' + esc(classLabel(item)) + ' · ' + esc(item.student ? item.student.id_siswa : '') + '</p>' + pendingBadge(item) + '</div>' +
        '<span class="deduction-badge">−' + typePoints(item.jenis) + ' poin</span>' +
      '</div>' +
      '<div class="info-grid mt-16">' +
        '<div class="info-row"><label>Tanggal kejadian</label><span>' + h.fmtDate(item.tanggal, 'long') + '</span></div>' +
        '<div class="info-row"><label>Jenis pelanggaran</label><span>' + esc(item.jenis ? item.jenis.nama_pelanggaran : '—') + '</span></div>' +
        '<div class="info-row"><label>Keterangan</label><span>' + esc(item.keterangan || 'Tidak ada keterangan tambahan.') + '</span></div>' +
        '<div class="info-row"><label>Status tindak lanjut</label><span>' + (warning ? 'Teguran ke-' + warning.jumlah_teguran + ' telah dicatat.' : 'Belum ada teguran.') + '</span></div>' +
      '</div>' +
      '<div class="section-label">' + h.icon('clipboard', '', 14) + 'Tindak lanjut</div>' +
      (warning
        ? '<div class="warning-card__sanction" style="margin-top:0;padding:13px 14px;font-size:10.5px;">' + h.icon('checkCircle', '', 15) + '<span><strong>Sanksi:</strong> ' + esc(warning.sanksi) + '<br><strong>Catatan:</strong> ' + esc(warning.catatan || '—') + '</span></div>'
        : '<div class="empty-inline">Belum ada teguran untuk catatan ini.' + (CAN_WARN() ? ' Buat teguran agar pendampingan tercatat lengkap.' : '') + '</div>') +
      '<div class="form-note mt-12">' + h.icon('info', '', 14) + '<span>Poin perilaku siswa diperbarui otomatis: <strong>' + (h.scoreOf(item.student ? item.student.id_siswa : '') ? h.scoreOf(item.student.id_siswa).total_poin : '—') + ' / 100</strong>.</span></div>',
      footer: footer
    });
  }

  function openViolationForm(id, studentId) {
    if (!CAN_RECORD()) {
      h.toast('Anda tidak memiliki akses untuk mencatat pelanggaran.', 'warning');
      return;
    }
    if (id && !CAN_EDIT_VIOLATION()) {
      h.toast('Hanya admin atau PJ yang dapat mengubah catatan.', 'warning');
      return;
    }
    const existing = id ? App.db.pelanggaran.find(function (item) { return item.id_pelanggaran === id; }) : null;
    const students = h.visibleStudents().slice().sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); });
    const preselected = existing ? existing.id_siswa : (studentId || '');
    const selectedType = existing ? existing.id_jenis : '';
    const date = existing ? existing.tanggal : h.today();

    if (!students.length) {
      h.modal({
        eyebrow: 'Catat pelanggaran',
        title: 'Belum ada siswa',
        content: TB.ui.emptyState('users', 'Siswa belum tersedia', 'Data siswa perlu ditambahkan oleh admin sebelum pelanggaran dapat dicatat.'),
        footer: '<button type="button" class="btn btn-brand" data-modal-close>Tutup</button>'
      });
      return;
    }

    const content = '<form id="violationForm" data-edit-id="' + (id || '') + '" onsubmit="App.submitViolation(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">' +
      '<div class="form-stack">' +
        '<div class="form-grid">' +
          '<div class="field"><label for="violationStudent">Siswa</label><select class="form-select" id="violationStudent" name="id_siswa" onchange="App.updateViolationPreview(this.form)" required>' +
            '<option value="">Pilih siswa</option>' + students.map(function (student) {
              return '<option value="' + student.id + '"' + selected(preselected, student.id) + '>' + esc(student.nama) + ' · Kelas ' + esc(student.kelas ? student.kelas.nama_kelas : '—') + '</option>';
            }).join('') +
          '</select></div>' +
          '<div class="field"><label for="violationType">Jenis pelanggaran</label><select class="form-select" id="violationType" name="id_jenis" onchange="App.updateViolationPreview(this.form)" required>' +
            '<option value="">Pilih jenis</option>' + App.db.jenisPelanggaran.map(function (item) {
              return '<option value="' + item.id_jenis + '"' + selected(selectedType, item.id_jenis) + '>' + esc(item.nama_pelanggaran) + ' (−' + item.pengurangan_poin + ' poin)</option>';
            }).join('') +
          '</select></div>' +
        '</div>' +
        '<div class="field"><label for="violationDate">Tanggal kejadian</label><input class="form-control" id="violationDate" name="tanggal" type="date" value="' + esc(date) + '" max="' + h.today() + '" required></div>' +
        '<div class="field"><label for="violationNote">Keterangan kejadian</label><textarea class="form-control" id="violationNote" name="keterangan" rows="3" maxlength="300" placeholder="Tuliskan keterangan singkat, objektif, dan tanpa label negatif pada anak.">' + esc(existing ? existing.keterangan : '') + '</textarea><span class="field__hint">Opsional, tetapi sangat membantu saat meninjau tindak lanjut.</span></div>' +
        '<div id="violationPointPreview"></div>' +
        '<div class="form-note">' + h.icon('info', '', 14) + '<span>Poin perilaku dihitung ulang otomatis setelah catatan disimpan. Poin tidak dapat melebihi 100 atau kurang dari 0.</span></div>' +
      '</div>' +
    '</form>';

    h.modal({
      eyebrow: id ? 'Edit catatan' : 'Catatan baru',
      title: id ? 'Edit pelanggaran' : 'Catat pelanggaran',
      subtitle: id ? 'Perubahan akan memperbarui poin siswa secara otomatis.' : 'Catat kejadian dengan bahasa yang objektif dan mendukung perbaikan.',
      size: 'lg',
      content: content,
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="violationForm">' + h.icon('check', '', 15) + (id ? 'Simpan perubahan' : 'Simpan catatan') + '</button>',
      onMount: function () {
        const form = document.getElementById('violationForm');
        if (form) App.updateViolationPreview(form);
      }
    });
  }

  App.updateViolationPreview = function (form) {
    if (!form) return;
    const preview = document.getElementById('violationPointPreview');
    if (!preview) return;
    const studentId = form.elements.id_siswa ? form.elements.id_siswa.value : '';
    const typeId = form.elements.id_jenis ? form.elements.id_jenis.value : '';
    const editId = form.dataset.editId;
    const score = h.scoreOf(studentId);
    const current = score ? Number(score.total_poin) : 100;
    let oldDeduction = 0;
    if (editId) {
      const old = App.db.pelanggaran.find(function (item) { return item.id_pelanggaran === editId; });
      if (old) oldDeduction = typePoints(h.typeOf(old.id_jenis));
    }
    const jenis = h.typeOf(typeId);
    const next = jenis ? Math.max(0, current + oldDeduction - Number(jenis.pengurangan_poin)) : current;
    const status = h.pointStatus(next);
    preview.innerHTML = '<div class="point-preview">' +
      '<span class="point-preview__icon">' + h.icon('activity', '', 16) + '</span>' +
      '<div class="point-preview__copy"><strong>Perkiraan poin setelah disimpan: ' + next + ' / 100</strong>' +
        '<span>' + (jenis ? 'Pengurangan ' + jenis.pengurangan_poin + ' poin · ' : '') + h.badge(status.label, status.tone, { dot: true }) + '</span>' +
      '</div>' +
    '</div>';
  };

  function submitViolation(event, id) {
    event.preventDefault();
    if (!CAN_RECORD()) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const idSiswa = String(data.get('id_siswa') || '');
    const idJenis = String(data.get('id_jenis') || '');
    const tanggal = String(data.get('tanggal') || '');
    const keterangan = String(data.get('keterangan') || '').trim();
    if (!idSiswa || !idJenis || !tanggal) {
      h.toast('Siswa, jenis pelanggaran, dan tanggal wajib diisi.', 'error');
      return;
    }
    if (!App.db.jenisPelanggaran.some(function (item) { return item.id_jenis === idJenis; })) {
      h.toast('Jenis pelanggaran tidak valid.', 'error');
      return;
    }

    App.db = TB.store.load();
    if (id) {
      const record = App.db.pelanggaran.find(function (item) { return item.id_pelanggaran === id; });
      if (!record) {
        h.toast('Catatan tidak ditemukan.', 'error');
        return;
      }
      record.id_siswa = idSiswa;
      record.id_jenis = idJenis;
      record.tanggal = tanggal;
      record.keterangan = keterangan;
    } else {
      App.db.pelanggaran.push({
        id_pelanggaran: TB.store.nextID(App.db.pelanggaran, 'id_pelanggaran', 'V', 3),
        id_siswa: idSiswa,
        id_jenis: idJenis,
        keterangan: keterangan,
        tanggal: tanggal
      });
    }
    TB.store.save(App.db);
    const score = TB.relations.getNilai(App.db, idSiswa);
    h.closeModal();
    App.refresh();
    h.toast((id ? 'Catatan diperbarui. ' : 'Pelanggaran dicatat. ') + 'Poin siswa saat ini ' + (score ? score.total_poin : '—') + ' / 100.', 'success');
  }

  function deleteViolation(id) {
    if (!IS_ADMIN()) return;
    const record = App.db.pelanggaran.find(function (item) { return item.id_pelanggaran === id; });
    if (!record) return;
    const student = TB.relations.getSiswa(App.db, record.id_siswa);
    const jenis = TB.relations.getJenis(App.db, record.id_jenis);
    const warning = TB.relations.getTeguran(App.db, id);
    h.confirm({
      eyebrow: 'Hapus catatan',
      title: 'Hapus pelanggaran ini?',
      message: 'Catatan <strong>' + esc(jenis ? jenis.nama_pelanggaran : id) + '</strong> milik <strong>' + esc(student ? student.nama : 'siswa') + '</strong> akan dihapus.' + (warning ? ' Teguran yang tertaut juga akan dihapus.' : '') + ' Poin siswa dihitung ulang otomatis.',
      confirmText: 'Hapus catatan',
      danger: true,
      onConfirm: function () {
        App.db = TB.store.load();
        App.db.pelanggaran = App.db.pelanggaran.filter(function (item) { return item.id_pelanggaran !== id; });
        App.db.teguran = App.db.teguran.filter(function (item) { return item.id_pelanggaran !== id; });
        TB.store.save(App.db);
        App.refresh();
        h.toast('Catatan pelanggaran dihapus.', 'success');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Violation types                                                     */
  /* ------------------------------------------------------------------ */

  function renderViolationTypes() {
    const types = App.db.jenisPelanggaran;
    const rows = types.map(function (item) {
      const usage = App.db.pelanggaran.filter(function (record) { return record.id_jenis === item.id_jenis; }).length;
      const level = h.violationLevel(item.pengurangan_poin);
      return '<tr>' +
        '<td><span class="entity-cell"><span class="icon-tile" style="width:32px;height:32px;border-radius:10px;">' + h.icon('alertCircle', '', 15) + '</span><span class="entity-cell__copy"><strong>' + esc(item.nama_pelanggaran) + '</strong><span>' + esc(item.id_jenis) + '</span></span></span></td>' +
        '<td><span class="deduction-badge ' + (Number(item.pengurangan_poin) >= 20 ? '' : Number(item.pengurangan_poin) >= 10 ? 'deduction-badge--mild' : 'deduction-badge--light') + '">−' + item.pengurangan_poin + ' poin</span></td>' +
        '<td>' + h.badge(level.label, level.tone, { dot: true }) + '</td>' +
        '<td><span class="cell-main">' + usage + ' catatan</span><span class="cell-sub">digunakan saat ini</span></td>' +
        '<td>' + (IS_ADMIN()
          ? '<div class="row-actions"><button type="button" class="row-action" title="Edit jenis" onclick="App.openViolationTypeForm(\'' + item.id_jenis + '\')">' + h.icon('edit', '', 14) + '</button>' +
            '<button type="button" class="row-action row-action--danger" title="Hapus jenis" onclick="App.deleteViolationType(\'' + item.id_jenis + '\')">' + h.icon('trash', '', 14) + '</button></div>'
          : '<span class="badge-soft badge-soft--neutral">Referensi</span>') + '</td>' +
      '</tr>';
    }).join('');

    return h.pageHead({
      eyebrow: 'Referensi kesiswaan',
      eyebrowIcon: 'alertCircle',
      title: 'Jenis Pelanggaran',
      description: 'Daftar jenis pelanggaran beserta pengurangan poinnya. Perubahan poin akan menghitung ulang nilai perilaku siswa.',
      actions: IS_ADMIN() ? '<button type="button" class="btn btn-brand" onclick="App.openViolationTypeForm()">' + h.icon('plus', '', 15) + 'Tambah jenis</button>' : ''
    }) +
    '<div class="toolbar"><div class="toolbar__left"><span class="chip">' + h.icon('layers', '', 13) + types.length + ' jenis</span>' +
      '<span class="chip">' + h.icon('alert', '', 13) + App.db.pelanggaran.length + ' catatan</span></div>' +
      '<div class="toolbar__count">' + (IS_ADMIN() ? 'Admin dapat mengubah referensi poin' : 'Hanya baca untuk peran Anda') + '</div></div>' +
    '<article class="panel panel--flush table-panel">' +
      '<div class="table-wrap"><table class="data-table">' +
        '<thead><tr><th>Jenis pelanggaran</th><th>Pengurangan</th><th>Tingkat</th><th>Penggunaan</th><th></th></tr></thead>' +
        '<tbody>' + (rows || h.emptyRow(5, 'Belum ada jenis pelanggaran', 'Tambahkan jenis pelanggaran untuk mulai mencatat.', 'alertCircle')) + '</tbody>' +
      '</table></div>' +
    '</article>';
  }

  function openViolationTypeForm(id) {
    if (!IS_ADMIN()) {
      h.toast('Hanya Admin Web yang dapat mengubah jenis pelanggaran.', 'warning');
      return;
    }
    const existing = id ? App.db.jenisPelanggaran.find(function (item) { return item.id_jenis === id; }) : null;
    const nextId = TB.store.nextID(App.db.jenisPelanggaran, 'id_jenis', 'J', 2);
    h.modal({
      eyebrow: id ? 'Edit referensi' : 'Referensi baru',
      title: id ? 'Ubah jenis pelanggaran' : 'Tambah jenis pelanggaran',
      subtitle: 'Pilih pengurangan poin yang proporsional dan mendukung pendampingan.',
      content: '<form id="violationTypeForm" onsubmit="App.submitViolationType(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">' +
        '<div class="detail-hero" style="margin-bottom:17px;"><span class="icon-tile icon-tile--lg icon-tile--coral">' + h.icon('alertCircle', '', 23) + '</span>' +
          '<div class="detail-hero__copy"><h3>' + (existing ? esc(existing.nama_pelanggaran) : 'Jenis baru') + '</h3><p>' + (existing ? esc(existing.id_jenis) : 'ID otomatis: ' + nextId) + '</p></div></div>' +
        '<div class="form-stack">' +
          '<div class="field"><label for="typeName">Nama pelanggaran</label><input class="form-control" id="typeName" name="nama_pelanggaran" value="' + esc(existing ? existing.nama_pelanggaran : '') + '" placeholder="cth. Terlambat masuk sekolah" maxlength="100" required></div>' +
          '<div class="field"><label for="typePoints">Pengurangan poin</label><input class="form-control" id="typePoints" name="pengurangan_poin" type="number" min="1" max="100" value="' + (existing ? existing.pengurangan_poin : 10) + '" required><span class="field__hint">Contoh: 5 untuk pelanggaran ringan, 10–15 sedang, 20+ berat.</span></div>' +
          '<div class="form-note">' + h.icon('info', '', 14) + '<span>Mengubah poin akan memengaruhi total poin seluruh siswa yang memiliki catatan dengan jenis ini.</span></div>' +
        '</div>' +
      '</form>',
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="violationTypeForm">' + h.icon('check', '', 15) + (id ? 'Simpan perubahan' : 'Simpan jenis') + '</button>'
    });
  }

  function submitViolationType(event, id) {
    event.preventDefault();
    if (!IS_ADMIN()) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('nama_pelanggaran') || '').trim();
    const points = Number(data.get('pengurangan_poin'));
    if (!name || !Number.isFinite(points) || points < 1) {
      h.toast('Nama dan pengurangan poin wajib diisi dengan benar.', 'error');
      return;
    }
    App.db = TB.store.load();
    if (id) {
      const type = App.db.jenisPelanggaran.find(function (item) { return item.id_jenis === id; });
      if (!type) return;
      type.nama_pelanggaran = name;
      type.pengurangan_poin = Math.min(100, Math.round(points));
    } else {
      App.db.jenisPelanggaran.push({
        id_jenis: TB.store.nextID(App.db.jenisPelanggaran, 'id_jenis', 'J', 2),
        nama_pelanggaran: name,
        pengurangan_poin: Math.min(100, Math.round(points))
      });
    }
    TB.store.save(App.db);
    h.closeModal();
    App.refresh();
    h.toast(id ? 'Jenis pelanggaran diperbarui dan poin dihitung ulang.' : 'Jenis pelanggaran ditambahkan.', 'success');
  }

  function deleteViolationType(id) {
    if (!IS_ADMIN()) return;
    const type = App.db.jenisPelanggaran.find(function (item) { return item.id_jenis === id; });
    if (!type) return;
    const usage = App.db.pelanggaran.filter(function (item) { return item.id_jenis === id; }).length;
    if (usage) {
      h.toast('Jenis ini dipakai pada ' + usage + ' catatan. Hapus atau ubah catatan terkait terlebih dahulu.', 'warning');
      return;
    }
    h.confirm({
      eyebrow: 'Hapus referensi',
      title: 'Hapus jenis pelanggaran?',
      message: 'Jenis <strong>' + esc(type.nama_pelanggaran) + '</strong> akan dihapus dari daftar referensi.',
      confirmText: 'Hapus jenis',
      danger: true,
      onConfirm: function () {
        App.db = TB.store.load();
        App.db.jenisPelanggaran = App.db.jenisPelanggaran.filter(function (item) { return item.id_jenis !== id; });
        TB.store.save(App.db);
        App.refresh();
        h.toast('Jenis pelanggaran dihapus.', 'success');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Warnings                                                            */
  /* ------------------------------------------------------------------ */

  function warningCard(item, options) {
    const config = options || {};
    return '<article class="warning-card">' +
      '<div class="warning-card__head">' +
        '<div class="warning-card__identity">' + h.avatar(item.student ? item.student.nama : 'Siswa', 'md') +
          '<div><h3>' + esc(item.student ? item.student.nama : 'Siswa') + '</h3><p>' + esc(classLabel(item)) + ' · ' + esc(item.id) + '</p></div>' +
        '</div>' +
        h.badge('Teguran ke-' + item.warning.jumlah_teguran, 'coral', { icon: 'clipboard' }) +
      '</div>' +
      '<div class="warning-card__violation"><strong>' + esc(item.jenis ? item.jenis.nama_pelanggaran : 'Pelanggaran') + '</strong>' +
        '<span><span>' + h.icon('calendar', '', 11) + ' ' + h.fmtDate(item.tanggal) + '</span><span>−' + typePoints(item.jenis) + ' poin</span></span></div>' +
      '<div class="warning-card__sanction">' + h.icon('gavel', '', 14) + '<span>' + esc(item.warning.sanksi) + '</span></div>' +
      (item.warning.catatan ? '<p class="warning-card__note">' + esc(item.warning.catatan) + '</p>' : '') +
      '<div class="warning-card__footer"><span>' + h.icon('calendar', '', 11) + ' ' + h.fmtDate(item.tanggal) + '</span>' +
        (config.actions !== false
          ? '<span class="warning-card__actions">' +
            (CAN_WARN() ? '<button type="button" class="row-action" title="Edit teguran" onclick="App.openWarningForm(\'' + item.id + '\')">' + h.icon('edit', '', 14) + '</button>' : '') +
            (IS_ADMIN() ? '<button type="button" class="row-action row-action--danger" title="Hapus teguran" onclick="App.deleteWarning(\'' + item.id + '\')">' + h.icon('trash', '', 14) + '</button>' : '') +
            '</span>'
          : '') +
      '</div>' +
    '</article>';
  }

  function renderWarnings() {
    if (IS_PARENT()) return renderParentWarnings();
    const filters = state.filters.teguran;
    const all = h.visibleWarnings();
    const pending = h.pendingViolations();
    const query = filters.q.toLowerCase();
    const filtered = all.filter(function (item) {
      const haystack = [item.student ? item.student.nama : '', item.jenis ? item.jenis.nama_pelanggaran : '', item.warning.sanksi, item.warning.catatan].join(' ').toLowerCase();
      return !query || haystack.indexOf(query) !== -1;
    });

    const cards = filtered.length
      ? filtered.map(function (item) { return warningCard(item); }).join('')
      : TB.ui.emptyState('clipboard', 'Belum ada teguran', all.length ? 'Tidak ada teguran yang cocok dengan pencarian.' : 'Teguran yang dibuat PJ akan tampil di sini.', CAN_WARN() ? '<button type="button" class="btn btn-brand btn-sm" onclick="App.openWarningForm()">Buat teguran</button>' : '');

    return h.pageHead({
      eyebrow: 'Tindak lanjut',
      eyebrowIcon: 'clipboard',
      title: 'Teguran & Sanksi',
      description: 'Tindak lanjut yang tercatat membantu sekolah dan keluarga berjalan dengan arah yang sama.',
      meta: h.badge(all.length + ' teguran', 'neutral', { icon: 'clipboard' }) +
        h.badge(pending.length + ' belum ditindaklanjuti', pending.length ? 'warning' : 'success', { dot: true }),
      actions: CAN_WARN()
        ? '<button type="button" class="btn btn-brand" onclick="App.openWarningForm()"' + (pending.length ? '' : ' disabled title="Semua catatan sudah ditindaklanjuti"') + '>' + h.icon('plus', '', 15) + 'Tambah teguran</button>'
        : ''
    }) +
    '<div class="toolbar">' +
      '<div class="toolbar__left"><div class="filter-search">' + h.icon('search', '', 14) +
        '<input class="form-control" id="filter-teguran-q" type="text" value="' + esc(filters.q) + '" placeholder="Cari siswa, sanksi, catatan…" oninput="App.applyFilter(\'teguran\',\'q\',this.value)">' +
      '</div>' + clearButton('teguran', !!filters.q) + '</div>' +
      '<div class="toolbar__count"><strong>' + filtered.length + '</strong> teguran ditampilkan</div>' +
    '</div>' +
    '<div class="panel-note mb-0" style="margin-bottom:13px;">' + h.icon('heartHandshake', '', 15) + '<span>Teguran dicatat sebagai bagian dari pendampingan. Fokus pada perbaikan perilaku dan komunikasi dengan keluarga.</span></div>' +
    '<div class="warning-grid">' + cards + '</div>';
  }

  function renderParentWarnings() {
    const all = h.visibleWarnings();
    const cards = all.length
      ? all.map(function (item) { return warningCard(item, { actions: false }); }).join('')
      : TB.ui.emptyState('heartHandshake', 'Belum ada teguran', 'Kabar baik — belum ada teguran yang tercatat untuk ananda. Teruskan komunikasi hangat dengan sekolah.');

    return h.pageHead({
      eyebrow: 'Pendampingan sekolah',
      eyebrowIcon: 'heartHandshake',
      title: 'Teguran Anak',
      description: 'Teguran adalah bagian dari pendampingan. Bacalah sanksi dan catatan sebagai bahan diskusi bersama anak.',
      actions: '<button type="button" class="btn btn-white" onclick="App.go(\'pelanggaran\')">' + h.icon('alert', '', 15) + 'Riwayat pelanggaran</button>'
    }) +
    '<div class="panel-note" style="margin-bottom:13px;">' + h.icon('info', '', 15) + '<span>Jika ada hal yang perlu didiskusikan, hubungi wali kelas atau PJ kesiswaan. TumbuhBaik menyimpan catatan agar percakapan dimulai dari pemahaman yang sama.</span></div>' +
    (cards.indexOf('empty-state') !== -1 ? cards : '<div class="warning-grid">' + cards + '</div>');
  }

  function openWarningForm(id, violationId) {
    if (!CAN_WARN()) {
      h.toast('Hanya admin atau PJ kesiswaan yang dapat membuat teguran.', 'warning');
      return;
    }
    const existing = id ? App.db.teguran.find(function (item) { return item.id_teguran === id; }) : null;
    const violations = h.visibleViolations();
    const available = violations.filter(function (item) {
      return !item.warning || (existing && item.id === existing.id_pelanggaran);
    });
    if (!available.length) {
      h.modal({
        eyebrow: 'Tindak lanjut',
        title: 'Semua catatan sudah ditindaklanjuti',
        content: TB.ui.emptyState('checkCircle', 'Tidak ada catatan pending', 'Semua pelanggaran pada cakupan Anda sudah memiliki teguran.'),
        footer: '<button type="button" class="btn btn-brand" data-modal-close>Tutup</button>'
      });
      return;
    }

    const preselected = existing ? existing.id_pelanggaran : (violationId || (available[0] ? available[0].id : ''));
    const existingViolation = existing
      ? App.db.pelanggaran.find(function (item) { return item.id_pelanggaran === existing.id_pelanggaran; })
      : null;
    const warningDate = existingViolation ? existingViolation.tanggal : h.today();
    const content = '<form id="warningForm" onsubmit="App.submitWarning(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">' +
      '<div class="form-stack">' +
        '<div class="field"><label for="warningViolation">Catatan pelanggaran</label><select class="form-select" id="warningViolation" name="id_pelanggaran" onchange="App.updateWarningPreview(this.form)" required>' +
          available.map(function (item) {
            return '<option value="' + item.id + '"' + selected(preselected, item.id) + '>' + esc(studentName(item)) + ' — ' + esc(item.jenis ? item.jenis.nama_pelanggaran : 'Pelanggaran') + ' (' + h.fmtShortDate(item.tanggal) + ')</option>';
          }).join('') +
        '</select></div>' +
        '<div id="warningPreview"></div>' +
        '<div class="form-row">' +
          '<div class="field"><label for="warningNumber">Teguran ke-</label><input class="form-control" id="warningNumber" name="jumlah_teguran" type="number" min="1" max="20" value="' + (existing ? existing.jumlah_teguran : 1) + '" required></div>' +
          '<div class="field"><label for="warningDate">Tanggal catatan</label><input class="form-control" type="text" value="' + esc(h.fmtDate(warningDate, 'long')) + '" disabled></div>' +
        '</div>' +
        '<div class="field"><label for="warningSanction">Sanksi / langkah perbaikan</label><textarea class="form-control" id="warningSanction" name="sanksi" rows="3" maxlength="300" placeholder="cth. Membuat surat permohonan maaf dan mediasi bersama orang tua." required>' + esc(existing ? existing.sanksi : '') + '</textarea></div>' +
        '<div class="field"><label for="warningNote">Catatan pendampingan</label><textarea class="form-control" id="warningNote" name="catatan" rows="3" maxlength="400" placeholder="Tuliskan hasil percakapan, komitmen, atau rencana tindak lanjut.">' + esc(existing ? existing.catatan : '') + '</textarea></div>' +
        '<div class="form-note">' + h.icon('info', '', 14) + '<span>Setelah teguran disimpan, catatan pelanggaran akan berstatus <strong>ditindaklanjuti</strong>.</span></div>' +
      '</div>' +
    '</form>';

    h.modal({
      eyebrow: id ? 'Edit teguran' : 'Tindak lanjut baru',
      title: id ? 'Ubah teguran' : 'Buat teguran',
      subtitle: 'Tetapkan langkah yang mendidik dan dapat dijalankan bersama keluarga.',
      size: 'lg',
      content: content,
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="warningForm">' + h.icon('check', '', 15) + (id ? 'Simpan perubahan' : 'Simpan teguran') + '</button>',
      onMount: function () {
        const form = document.getElementById('warningForm');
        if (form) App.updateWarningPreview(form);
      }
    });
  }

  App.updateWarningPreview = function (form) {
    if (!form) return;
    const preview = document.getElementById('warningPreview');
    if (!preview) return;
    const id = form.elements.id_pelanggaran.value;
    const item = h.visibleViolations().find(function (record) { return record.id === id; });
    if (!item) {
      preview.innerHTML = '';
      return;
    }
    const score = item.student ? h.scoreOf(item.student.id_siswa) : null;
    preview.innerHTML = '<div class="detail-hero" style="padding:11px 12px;">' +
      h.avatar(studentName(item), 'sm') +
      '<div class="detail-hero__copy"><h3 style="font-size:12px;">' + esc(studentName(item)) + '</h3><p>' + esc(classLabel(item)) + ' · ' + h.fmtDate(item.tanggal) + '</p></div>' +
      '<div style="margin-left:auto;text-align:right;"><span class="deduction-badge">−' + typePoints(item.jenis) + ' poin</span><p style="font-size:8.5px;color:var(--muted);margin-top:3px;">Poin saat ini ' + (score ? score.total_poin : '—') + '</p></div>' +
    '</div>';
  };

  function submitWarning(event, id) {
    event.preventDefault();
    if (!CAN_WARN()) return;
    const data = new FormData(event.currentTarget);
    const violationId = String(data.get('id_pelanggaran') || '');
    const jumlah = Math.max(1, Math.min(20, parseInt(data.get('jumlah_teguran'), 10) || 1));
    const sanksi = String(data.get('sanksi') || '').trim();
    const catatan = String(data.get('catatan') || '').trim();
    if (!violationId || !sanksi) {
      h.toast('Catatan pelanggaran dan sanksi wajib diisi.', 'error');
      return;
    }
    App.db = TB.store.load();
    if (id) {
      const warning = App.db.teguran.find(function (item) { return item.id_teguran === id; });
      if (!warning) return;
      warning.id_pelanggaran = violationId;
      warning.jumlah_teguran = jumlah;
      warning.sanksi = sanksi;
      warning.catatan = catatan;
    } else {
      const duplicate = App.db.teguran.some(function (item) { return item.id_pelanggaran === violationId; });
      if (duplicate) {
        h.toast('Catatan ini sudah memiliki teguran.', 'warning');
        return;
      }
      App.db.teguran.push({
        id_teguran: TB.store.nextID(App.db.teguran, 'id_teguran', 'T', 3),
        id_pelanggaran: violationId,
        jumlah_teguran: jumlah,
        catatan: catatan,
        sanksi: sanksi
      });
    }
    TB.store.save(App.db);
    h.closeModal();
    App.refresh();
    h.toast(id ? 'Teguran diperbarui.' : 'Teguran berhasil dicatat.', 'success');
  }

  function deleteWarning(id) {
    if (!IS_ADMIN()) return;
    const warning = App.db.teguran.find(function (item) { return item.id_teguran === id; });
    if (!warning) return;
    h.confirm({
      eyebrow: 'Hapus teguran',
      title: 'Hapus teguran ini?',
      message: 'Teguran <strong>' + esc(warning.id_teguran) + '</strong> akan dihapus dan catatan pelanggaran kembali berstatus perlu tindak lanjut.',
      confirmText: 'Hapus teguran',
      danger: true,
      onConfirm: function () {
        App.db = TB.store.load();
        App.db.teguran = App.db.teguran.filter(function (item) { return item.id_teguran !== id; });
        TB.store.save(App.db);
        App.refresh();
        h.toast('Teguran dihapus.', 'success');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scores                                                              */
  /* ------------------------------------------------------------------ */

  function renderScores() {
    if (IS_PARENT()) return renderParentScores();
    const filters = state.filters.nilai;
    const all = h.visibleScores();
    const query = filters.q.toLowerCase();
    const filtered = all.filter(function (item) {
      const matchSearch = !query || (item.nama + ' ' + item.id + ' ' + (item.kelas ? item.kelas.nama_kelas : '')).toLowerCase().indexOf(query) !== -1;
      const matchClass = filters.kelas === 'all' || (item.kelas && item.kelas.id_kelas === filters.kelas);
      return matchSearch && matchClass;
    });
    const average = all.length ? Math.round(all.reduce(function (total, item) { return total + item.nilai_kompetensi; }, 0) / all.length) : 0;
    const active = !!filters.q || filters.kelas !== 'all';

    const rows = filtered.length
      ? filtered.map(function (item) {
          const grade = h.grade(item.nilai_kompetensi);
          return '<tr>' +
            '<td>' + h.entityCell(item.nama, item.id + ' · ' + (item.kelas ? 'Kelas ' + item.kelas.nama_kelas : '—')) + '</td>' +
            '<td><span class="cell-main">Kelas ' + esc(item.kelas ? item.kelas.nama_kelas : '—') + '</span><span class="cell-sub">' + esc(item.guru ? item.guru.nama : '—') + '</span></td>' +
            '<td><div class="points-cell"><span class="points-cell__value">' + item.nilai_kompetensi + '</span><div class="progress-bar"><span style="width:' + item.nilai_kompetensi + '%;background:var(--teal)"></span></div></div></td>' +
            '<td>' + h.badge(grade.letter + ' · ' + grade.label, grade.tone) + '</td>' +
            '<td><div class="points-cell"><span class="points-cell__value">' + item.total_poin + '</span><div class="progress-bar"><span style="width:' + item.total_poin + '%;background:' + (item.total_poin >= 85 ? 'var(--teal)' : item.total_poin >= 70 ? 'var(--yellow)' : 'var(--danger)') + '"></span></div></div></td>' +
            '<td>' + h.pointBadge(item.total_poin) + '</td>' +
            '<td>' + (CAN_EDIT_SCORE()
              ? '<button type="button" class="row-action" title="Edit nilai" onclick="App.openScoreForm(\'' + item.id + '\')">' + h.icon('edit', '', 14) + '</button>'
              : '<span class="badge-soft badge-soft--neutral">Lihat</span>') + '</td>' +
          '</tr>';
        }).join('')
      : h.emptyRow(7, 'Data nilai tidak ditemukan', 'Coba ubah filter atau kata kunci.', 'award');

    return h.pageHead({
      eyebrow: 'Perkembangan siswa',
      eyebrowIcon: 'award',
      title: 'Nilai & Poin',
      description: 'Nilai kompetensi diisi oleh guru. Poin perilaku dihitung otomatis dari seluruh catatan pelanggaran.',
      meta: h.badge('Rata-rata nilai ' + average, 'info', { icon: 'chart' }) +
        h.badge('Rata-rata poin ' + (all.length ? Math.round(all.reduce(function (total, item) { return total + item.total_poin; }, 0) / all.length) : 0), 'success', { dot: true })
    }) +
    '<div class="toolbar">' +
      '<div class="toolbar__left">' +
        '<div class="filter-search">' + h.icon('search', '', 14) +
          '<input class="form-control" id="filter-nilai-q" type="text" value="' + esc(filters.q) + '" placeholder="Cari siswa…" oninput="App.applyFilter(\'nilai\',\'q\',this.value)">' +
        '</div>' +
        '<select class="form-select" id="filter-nilai-kelas" onchange="App.applyFilter(\'nilai\',\'kelas\',this.value)">' + classFilterOptions(filters.kelas) + '</select>' +
        clearButton('nilai', active) +
      '</div>' +
      '<div class="toolbar__count"><strong>' + filtered.length + '</strong> dari ' + all.length + ' siswa</div>' +
    '</div>' +
    '<article class="panel panel--flush table-panel">' +
      '<div class="table-wrap"><table class="data-table data-table--scores">' +
        '<thead><tr><th>Siswa</th><th>Kelas &amp; wali</th><th>Nilai kompetensi</th><th>Predikat</th><th>Poin perilaku</th><th>Status</th><th></th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
      '<div class="panel__footer" style="padding:11px 17px;margin:0;border-top:1px solid var(--line);"><span class="panel__footer-note">Poin perilaku maksimal 100 dan berkurang sesuai catatan</span><span class="badge-soft badge-soft--' + (CAN_EDIT_SCORE() ? 'success' : 'neutral') + '">' + (CAN_EDIT_SCORE() ? 'Dapat diperbarui' : 'Hanya baca') + '</span></div>' +
    '</article>';
  }

  function openScoreForm(idSiswa) {
    if (!CAN_EDIT_SCORE()) {
      h.toast('Anda tidak memiliki akses untuk mengubah nilai.', 'warning');
      return;
    }
    const item = h.visibleScores().find(function (student) { return student.id === idSiswa; });
    if (!item) {
      h.toast('Data siswa tidak ditemukan.', 'error');
      return;
    }
    const grade = h.grade(item.nilai_kompetensi);
    h.modal({
      eyebrow: 'Perbarui nilai',
      title: item.nama,
      subtitle: item.id + ' · Kelas ' + (item.kelas ? item.kelas.nama_kelas : '—'),
      content: '<form id="scoreForm" onsubmit="App.submitScore(event, \'' + item.id + '\')">' +
        '<div class="detail-hero" style="margin-bottom:17px;">' + h.avatar(item.nama, 'lg') +
          '<div class="detail-hero__copy"><h3>' + esc(item.nama) + '</h3><p>' + esc(item.id) + ' · ' + (item.kelas ? 'Kelas ' + esc(item.kelas.nama_kelas) : '—') + '</p>' + h.badge(grade.letter + ' · ' + grade.label, grade.tone) + '</div>' +
        '</div>' +
        '<div class="form-grid">' +
          '<div class="field"><label for="scoreValue">Nilai kompetensi</label><input class="form-control" id="scoreValue" name="nilai_kompetensi" type="number" min="0" max="100" value="' + item.nilai_kompetensi + '" required><span class="field__hint">Rentang 0–100.</span></div>' +
          '<div class="field"><label>Poin perilaku</label><input class="form-control" type="text" value="' + item.total_poin + ' / 100" disabled><span class="field__hint">Otomatis dari catatan pelanggaran.</span></div>' +
        '</div>' +
        '<div class="point-preview mt-12"><span class="point-preview__icon">' + h.icon('award', '', 16) + '</span><div class="point-preview__copy"><strong>' + item.violationCount + ' catatan pelanggaran</strong><span>Poin perilaku saat ini ' + item.total_poin + '. Status: ' + h.pointStatus(item.total_poin).label + '.</span></div></div>' +
        '<div class="form-note mt-12">' + h.icon('info', '', 14) + '<span>Nilai kompetensi tidak memengaruhi poin perilaku. Keduanya ditampilkan terpisah agar perkembangan anak terlihat utuh.</span></div>' +
      '</form>',
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="scoreForm">' + h.icon('check', '', 15) + 'Simpan nilai</button>'
    });
  }

  function submitScore(event, idSiswa) {
    event.preventDefault();
    if (!CAN_EDIT_SCORE()) return;
    const data = new FormData(event.currentTarget);
    const value = Number(data.get('nilai_kompetensi'));
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      h.toast('Nilai kompetensi harus berada di antara 0 dan 100.', 'error');
      return;
    }
    App.db = TB.store.load();
    const score = TB.relations.getNilai(App.db, idSiswa);
    if (!score) {
      h.toast('Data nilai siswa tidak ditemukan.', 'error');
      return;
    }
    score.nilai_kompetensi = Math.round(value);
    TB.store.save(App.db);
    h.closeModal();
    App.refresh();
    h.toast('Nilai kompetensi diperbarui.', 'success');
  }

  function renderParentScores() {
    const child = h.visibleStudents()[0];
    if (!child) {
      return h.pageHead({ title: 'Nilai Anak' }) + TB.ui.emptyState('award', 'Belum ada data nilai', 'Hubungi sekolah untuk menautkan data ananda.');
    }
    const grade = h.grade(child.nilai_kompetensi);
    const history = App.monthSeries(child.violations, 6);
    const status = child.status;
    return h.pageHead({
      eyebrow: 'Perkembangan ananda',
      eyebrowIcon: 'award',
      title: 'Nilai & Poin',
      description: 'Nilai kompetensi dan poin perilaku ' + esc(child.nama) + ' pada semester ini.',
      actions: '<button type="button" class="btn btn-brand" onclick="App.go(\'pelanggaran\')">' + h.icon('activity', '', 15) + 'Lihat riwayat</button>'
    }) +
    '<div class="parent-summary">' +
      h.statCard({ icon: 'award', label: 'Nilai kompetensi', value: child.nilai_kompetensi, foot: '<strong>' + grade.letter + '</strong> · ' + grade.label, tone: 'mint' }) +
      h.statCard({ icon: 'shield', label: 'Poin perilaku', value: child.total_poin, foot: status.label, tone: child.total_poin >= 80 ? 'mint' : 'yellow' }) +
      h.statCard({ icon: 'file', label: 'Catatan pelanggaran', value: child.violationCount, foot: '<strong>' + child.warningCount + ' teguran</strong> tercatat', tone: 'coral' }) +
    '</div>' +
    '<div class="dashboard-grid">' +
      '<article class="panel">' +
        '<div class="panel__head"><div class="panel__title"><h2>Ringkasan nilai</h2><p>Perkembangan akademik dan perilaku</p></div>' + h.badge(grade.label, grade.tone) + '</div>' +
        '<div class="detail-metrics" style="grid-template-columns:repeat(2,minmax(0,1fr));">' +
          '<div class="detail-metric"><span>Nilai kompetensi</span><strong>' + child.nilai_kompetensi + ' <small>/ 100</small></strong><div class="progress-bar" style="margin-top:8px;"><span style="width:' + child.nilai_kompetensi + '%;background:var(--teal)"></span></div></div>' +
          '<div class="detail-metric"><span>Poin perilaku</span><strong>' + child.total_poin + ' <small>/ 100</small></strong><div class="progress-bar" style="margin-top:8px;"><span style="width:' + child.total_poin + '%;background:' + (child.total_poin >= 85 ? 'var(--teal)' : child.total_poin >= 70 ? 'var(--yellow)' : 'var(--danger)') + '"></span></div></div>' +
        '</div>' +
        '<div class="info-grid mt-16">' +
          '<div class="info-row"><label>Predikat</label><span class="strong">' + grade.letter + ' · ' + grade.label + '</span></div>' +
          '<div class="info-row"><label>Status perilaku</label><span class="strong">' + h.badge(status.label, status.tone, { dot: true }) + '</span></div>' +
          '<div class="info-row"><label>Kelas</label><span>' + esc(child.kelas ? child.kelas.nama_kelas : '—') + '</span></div>' +
          '<div class="info-row"><label>Wali kelas</label><span>' + esc(child.guru ? child.guru.nama : '—') + '</span></div>' +
        '</div>' +
        '<div class="panel-note mt-12">' + h.icon('info', '', 14) + '<span>Nilai kompetensi diisi oleh guru. Poin perilaku diperbarui otomatis dari catatan pelanggaran yang sudah ditindaklanjuti bersama.</span></div>' +
      '</article>' +
      '<article class="panel">' +
        '<div class="panel__head"><div class="panel__title"><h2>Tren catatan</h2><p>6 bulan terakhir</p></div></div>' +
        '<div class="chart-summary"><strong>' + history.values.reduce(function (total, value) { return total + value; }, 0) + '</strong><span>total catatan</span></div>' +
        TB.ui.lineChart({ labels: history.labels, values: history.values, color: '#F2836C', height: 210, title: 'tren catatan' }) +
        '<div class="panel-note mt-8">' + h.icon('heartHandshake', '', 14) + '<span>Angka bukan tujuan akhir. Yang terpenting adalah percakapan dan dukungan di baliknya.</span></div>' +
      '</article>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Articles                                                            */
  /* ------------------------------------------------------------------ */

  function articleIcon(index) {
    return ['book', 'heartHandshake', 'award', 'message'][index % 4];
  }

  function openArticle(id) {
    const article = App.db.artikel.find(function (item) { return item.id_artikel === id; });
    if (!article) return;
    const paragraphs = String(article.isi_artikel || '')
      .split(/\n{2,}/)
      .filter(Boolean)
      .map(function (paragraph) { return '<p>' + esc(paragraph).replace(/\n/g, '<br>') + '</p>'; })
      .join('');
    h.modal({
      eyebrow: 'Artikel sekolah',
      title: article.judul_artikel,
      subtitle: h.fmtDate(article.tanggal, 'long'),
      size: 'lg',
      content: '<div class="article-detail">' +
        '<div class="article-detail__meta">' + h.icon('calendar', '', 13) + '<span>' + h.fmtDate(article.tanggal, 'long') + '</span><span class="dot"></span><span>TumbuhBaik</span></div>' +
        '<p class="article-detail__lead">Ruang kecil untuk belajar memahami anak, bukan sekadar menilai perilakunya.</p>' +
        paragraphs +
        '</div>',
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Tutup</button>' +
        (IS_ADMIN() ? '<button type="button" class="btn btn-brand" onclick="App.openArticleForm(\'' + article.id_artikel + '\')">' + h.icon('edit', '', 14) + 'Edit artikel</button>' : '')
    });
  }

  function renderArticles() {
    const filters = state.filters.artikel;
    const articles = App.db.artikel.slice().sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
    const query = filters.q.toLowerCase();
    const filtered = articles.filter(function (item) {
      return !query || (item.judul_artikel + ' ' + item.isi_artikel).toLowerCase().indexOf(query) !== -1;
    });
    const cards = filtered.length
      ? filtered.map(function (article, index) {
          const excerpt = textExcerpt(String(article.isi_artikel || '').replace(/\n+/g, ' '), 145);
          return '<article class="article-admin-card">' +
            '<div class="article-admin-card__top"><span class="article-admin-card__icon">' + h.icon(articleIcon(index), '', 18) + '</span>' +
              '<div class="article-admin-card__headline"><h3>' + esc(article.judul_artikel) + '</h3><span>' + h.icon('calendar', '', 11) + h.fmtDate(article.tanggal) + ' · ' + esc(article.id_artikel) + '</span></div>' +
              (IS_ADMIN() ? '<div class="row-actions">' +
                '<button type="button" class="row-action" title="Edit artikel" onclick="App.openArticleForm(\'' + article.id_artikel + '\')">' + h.icon('edit', '', 14) + '</button>' +
                '<button type="button" class="row-action row-action--danger" title="Hapus artikel" onclick="App.deleteArticle(\'' + article.id_artikel + '\')">' + h.icon('trash', '', 14) + '</button>' +
              '</div>' : '') +
            '</div>' +
            '<p class="article-admin-card__excerpt">' + esc(excerpt) + '</p>' +
            '<div class="article-admin-card__footer"><span class="badge-soft badge-soft--neutral">Artikel</span>' +
              '<button type="button" class="btn btn-soft" onclick="App.openArticle(\'' + article.id_artikel + '\')">Baca artikel ' + h.icon('arrowRight', '', 12) + '</button>' +
            '</div>' +
          '</article>';
        }).join('')
      : TB.ui.emptyState('file', 'Artikel tidak ditemukan', 'Coba kata kunci lain atau tambahkan artikel baru.');

    return h.pageHead({
      eyebrow: 'Informasi sekolah',
      eyebrowIcon: 'file',
      title: 'Artikel & Kabar',
      description: 'Panduan singkat untuk guru dan orang tua. Artikel terbaru juga tampil di halaman beranda.',
      actions: IS_ADMIN() ? '<button type="button" class="btn btn-brand" onclick="App.openArticleForm()">' + h.icon('plus', '', 15) + 'Tulis artikel</button>' : ''
    }) +
    '<div class="toolbar">' +
      '<div class="toolbar__left"><div class="filter-search">' + h.icon('search', '', 14) +
        '<input class="form-control" id="filter-artikel-q" type="text" value="' + esc(filters.q) + '" placeholder="Cari artikel…" oninput="App.applyFilter(\'artikel\',\'q\',this.value)">' +
      '</div>' + clearButton('artikel', !!filters.q) + '</div>' +
      '<div class="toolbar__count"><strong>' + filtered.length + '</strong> artikel</div>' +
    '</div>' +
    '<div class="article-admin-grid">' + cards + '</div>';
  }

  function openArticleForm(id) {
    if (!IS_ADMIN()) {
      h.toast('Hanya Admin Web yang dapat menulis artikel.', 'warning');
      return;
    }
    const existing = id ? App.db.artikel.find(function (item) { return item.id_artikel === id; }) : null;
    const nextId = TB.store.nextID(App.db.artikel, 'id_artikel', 'ART', 2);
    h.modal({
      eyebrow: id ? 'Edit artikel' : 'Artikel baru',
      title: id ? 'Ubah artikel' : 'Tulis artikel',
      subtitle: 'Artikel akan tampil di dashboard dan beranda publik.',
      size: 'lg',
      content: '<form id="articleForm" onsubmit="App.submitArticle(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">' +
        '<div class="form-stack">' +
          '<div class="field"><label for="articleTitle">Judul artikel</label><input class="form-control" id="articleTitle" name="judul_artikel" value="' + esc(existing ? existing.judul_artikel : '') + '" maxlength="140" placeholder="Judul yang hangat dan jelas" required></div>' +
          '<div class="form-row"><div class="field"><label for="articleDate">Tanggal</label><input class="form-control" id="articleDate" name="tanggal" type="date" value="' + (existing ? existing.tanggal : h.today()) + '" required></div>' +
            '<div class="field"><label>ID artikel</label><input class="form-control" type="text" value="' + (existing ? existing.id_artikel : nextId) + '" disabled></div></div>' +
          '<div class="field"><label for="articleBody">Isi artikel</label><textarea class="form-control" id="articleBody" name="isi_artikel" rows="10" maxlength="4000" placeholder="Tulis dengan bahasa yang ramah. Pisahkan paragraf dengan satu baris kosong." required>' + esc(existing ? existing.isi_artikel : '') + '</textarea><span class="field__hint">Gunakan dua kali enter untuk memisahkan paragraf.</span></div>' +
        '</div>' +
      '</form>',
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="articleForm">' + h.icon('check', '', 15) + (id ? 'Simpan perubahan' : 'Terbitkan artikel') + '</button>'
    });
  }

  function submitArticle(event, id) {
    event.preventDefault();
    if (!IS_ADMIN()) return;
    const data = new FormData(event.currentTarget);
    const title = String(data.get('judul_artikel') || '').trim();
    const body = String(data.get('isi_artikel') || '').trim();
    const date = String(data.get('tanggal') || '');
    if (!title || !body || !date) {
      h.toast('Judul, isi, dan tanggal artikel wajib diisi.', 'error');
      return;
    }
    App.db = TB.store.load();
    if (id) {
      const article = App.db.artikel.find(function (item) { return item.id_artikel === id; });
      if (!article) return;
      article.judul_artikel = title;
      article.isi_artikel = body;
      article.tanggal = date;
    } else {
      App.db.artikel.push({
        id_artikel: TB.store.nextID(App.db.artikel, 'id_artikel', 'ART', 2),
        judul_artikel: title,
        isi_artikel: body,
        tanggal: date
      });
    }
    TB.store.save(App.db);
    h.closeModal();
    App.refresh();
    h.toast(id ? 'Artikel diperbarui.' : 'Artikel berhasil diterbitkan.', 'success');
  }

  function deleteArticle(id) {
    if (!IS_ADMIN()) return;
    const article = App.db.artikel.find(function (item) { return item.id_artikel === id; });
    if (!article) return;
    h.confirm({
      eyebrow: 'Hapus artikel',
      title: 'Hapus artikel ini?',
      message: 'Artikel <strong>' + esc(article.judul_artikel) + '</strong> akan dihapus dari dashboard dan beranda.',
      confirmText: 'Hapus artikel',
      danger: true,
      onConfirm: function () {
        App.db = TB.store.load();
        App.db.artikel = App.db.artikel.filter(function (item) { return item.id_artikel !== id; });
        TB.store.save(App.db);
        App.refresh();
        h.toast('Artikel dihapus.', 'success');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Web assets                                                          */
  /* ------------------------------------------------------------------ */

  function isImageAsset(url) {
    return /\.(svg|png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(String(url || ''));
  }

  function renderAssets() {
    if (!IS_ADMIN()) {
      return h.pageHead({ title: 'Akses terbatas' }) + TB.ui.emptyState('lock', 'Halaman khusus admin', 'Manajemen aset web hanya dapat diakses oleh Admin Web.');
    }
    const filters = state.filters.aset;
    const query = filters.q.toLowerCase();
    const assets = App.db.webAssets.filter(function (item) {
      return !query || (item.nama_asset + ' ' + item.file_url).toLowerCase().indexOf(query) !== -1;
    });
    const rows = assets.length
      ? assets.map(function (item) {
          const preview = isImageAsset(item.file_url)
            ? '<img src="' + esc(item.file_url) + '" alt="" class="asset-thumb" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\'"><span class="asset-thumb asset-thumb--fallback" style="display:none;">' + h.icon('image', '', 15) + '</span>'
            : '<span class="asset-thumb asset-thumb--fallback">' + h.icon('folder', '', 15) + '</span>';
          return '<tr>' +
            '<td><div class="entity-cell">' + preview + '<div class="entity-cell__copy"><strong>' + esc(item.nama_asset) + '</strong><span>' + esc(item.id_asset) + '</span></div></div></td>' +
            '<td><code class="url-code">' + esc(item.file_url) + '</code></td>' +
            '<td><span class="badge-soft badge-soft--neutral">' + (isImageAsset(item.file_url) ? 'Gambar' : 'Tautan') + '</span></td>' +
            '<td><div class="row-actions">' +
              '<button type="button" class="row-action" title="Salin URL" onclick="App.copyAssetUrl(\'' + esc(item.id_asset) + '\')">' + h.icon('copy', '', 14) + '</button>' +
              '<button type="button" class="row-action" title="Edit aset" onclick="App.openAssetForm(\'' + item.id_asset + '\')">' + h.icon('edit', '', 14) + '</button>' +
              '<button type="button" class="row-action row-action--danger" title="Hapus aset" onclick="App.deleteAsset(\'' + item.id_asset + '\')">' + h.icon('trash', '', 14) + '</button>' +
            '</div></td>' +
          '</tr>';
        }).join('')
      : h.emptyRow(4, 'Aset tidak ditemukan', 'Tambahkan aset atau ubah kata kunci.', 'image');

    return h.pageHead({
      eyebrow: 'Pengaturan situs',
      eyebrowIcon: 'image',
      title: 'Web Assets',
      description: 'Kelola gambar, logo, dan tautan yang digunakan di halaman publik TumbuhBaik.',
      actions: '<button type="button" class="btn btn-brand" onclick="App.openAssetForm()">' + h.icon('plus', '', 15) + 'Tambah aset</button>'
    }) +
    '<div class="toolbar"><div class="toolbar__left"><div class="filter-search">' + h.icon('search', '', 14) +
      '<input class="form-control" id="filter-aset-q" type="text" value="' + esc(filters.q) + '" placeholder="Cari nama atau URL…" oninput="App.applyFilter(\'aset\',\'q\',this.value)">' +
      '</div>' + clearButton('aset', !!filters.q) + '</div><div class="toolbar__count"><strong>' + assets.length + '</strong> aset</div></div>' +
    '<article class="panel panel--flush table-panel"><div class="table-wrap"><table class="data-table">' +
      '<thead><tr><th>Aset</th><th>File / URL</th><th>Jenis</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></article>';
  }

  function openAssetForm(id) {
    if (!IS_ADMIN()) return;
    const existing = id ? App.db.webAssets.find(function (item) { return item.id_asset === id; }) : null;
    const nextId = TB.store.nextID(App.db.webAssets, 'id_asset', 'AS', 2);
    const preview = existing && isImageAsset(existing.file_url)
      ? '<div style="margin-top:12px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--mint-50);"><img src="' + esc(existing.file_url) + '" alt="" style="max-height:90px;max-width:100%;"></div>'
      : '';
    h.modal({
      eyebrow: id ? 'Edit aset' : 'Aset baru',
      title: id ? 'Ubah aset web' : 'Tambah aset web',
      subtitle: 'Aset dapat berupa file gambar lokal atau URL publik.',
      content: '<form id="assetForm" onsubmit="App.submitAsset(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">' +
        '<div class="form-stack">' +
          '<div class="field"><label for="assetName">Nama aset</label><input class="form-control" id="assetName" name="nama_asset" value="' + esc(existing ? existing.nama_asset : '') + '" placeholder="cth. Logo sekolah" required></div>' +
          '<div class="field"><label for="assetUrl">File / URL</label><input class="form-control" id="assetUrl" name="file_url" value="' + esc(existing ? existing.file_url : '') + '" placeholder="assets/img/logo-mark.svg" required><span class="field__hint">Bisa berupa path relatif atau URL lengkap.</span></div>' +
          preview +
          '<div class="form-note">' + h.icon('info', '', 14) + '<span>ID aset: <strong>' + (existing ? esc(existing.id_asset) : nextId) + '</strong>. Pastikan file tersedia di folder proyek sebelum digunakan.</span></div>' +
        '</div>' +
      '</form>',
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="assetForm">' + h.icon('check', '', 15) + (id ? 'Simpan perubahan' : 'Simpan aset') + '</button>'
    });
  }

  function submitAsset(event, id) {
    event.preventDefault();
    if (!IS_ADMIN()) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('nama_asset') || '').trim();
    const url = String(data.get('file_url') || '').trim();
    if (!name || !url) {
      h.toast('Nama dan URL aset wajib diisi.', 'error');
      return;
    }
    App.db = TB.store.load();
    if (id) {
      const asset = App.db.webAssets.find(function (item) { return item.id_asset === id; });
      if (!asset) return;
      asset.nama_asset = name;
      asset.file_url = url;
    } else {
      App.db.webAssets.push({
        id_asset: TB.store.nextID(App.db.webAssets, 'id_asset', 'AS', 2),
        nama_asset: name,
        file_url: url
      });
    }
    TB.store.save(App.db);
    h.closeModal();
    App.refresh();
    h.toast(id ? 'Aset diperbarui.' : 'Aset baru ditambahkan.', 'success');
  }

  function deleteAsset(id) {
    if (!IS_ADMIN()) return;
    const asset = App.db.webAssets.find(function (item) { return item.id_asset === id; });
    if (!asset) return;
    h.confirm({
      eyebrow: 'Hapus aset',
      title: 'Hapus aset ini?',
      message: 'Referensi aset <strong>' + esc(asset.nama_asset) + '</strong> akan dihapus. File aslinya tidak ikut terhapus.',
      confirmText: 'Hapus aset',
      danger: true,
      onConfirm: function () {
        App.db = TB.store.load();
        App.db.webAssets = App.db.webAssets.filter(function (item) { return item.id_asset !== id; });
        TB.store.save(App.db);
        App.refresh();
        h.toast('Aset dihapus.', 'success');
      }
    });
  }

  App.copyAssetUrl = function (id) {
    const asset = App.db.webAssets.find(function (item) { return item.id_asset === id; });
    if (!asset) return;
    TB.ui.copyText(asset.file_url).then(function (ok) {
      h.toast(ok ? 'URL aset disalin.' : 'Tidak dapat menyalin URL.', ok ? 'success' : 'error');
    });
  };

  /* ------------------------------------------------------------------ */
  /* PJ accounts                                                         */
  /* ------------------------------------------------------------------ */

  function renderPJ() {
    if (!IS_ADMIN()) {
      return h.pageHead({ title: 'Akses terbatas' }) + TB.ui.emptyState('lock', 'Halaman khusus admin', 'Manajemen akun PJ hanya dapat diakses oleh Admin Web.');
    }
    const cards = App.db.pj.map(function (pj) {
      return '<article class="person-card">' +
        '<div class="person-card__head">' + h.avatar(pj.nama, 'lg') +
          '<div class="person-card__identity"><h3>' + esc(pj.nama) + '</h3><p>@' + esc(pj.username) + ' · <span class="cell-code">' + esc(pj.id_pj) + '</span></p></div>' +
          '<div class="person-card__actions">' +
            '<button type="button" class="row-action" title="Edit akun PJ" onclick="App.openPJForm(\'' + pj.id_pj + '\')">' + h.icon('edit', '', 14) + '</button>' +
            '<button type="button" class="row-action row-action--danger" title="Hapus akun PJ" onclick="App.deletePJ(\'' + pj.id_pj + '\')">' + h.icon('trash', '', 14) + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="person-card__tags">' + h.badge('PJ Kesiswaan', 'pj', { icon: 'clipboard' }) + h.badge('Aktif', 'success', { dot: true }) + '</div>' +
        '<div class="person-card__stats">' +
          '<div class="person-stat"><span>Username</span><strong style="font-size:10px;">@' + esc(pj.username) + '</strong></div>' +
          '<div class="person-stat"><span>ID akun</span><strong style="font-size:10px;">' + esc(pj.id_pj) + '</strong></div>' +
        '</div>' +
        '<div class="person-card__footer"><span>' + h.icon('shield', '', 11) + 'Akses pelanggaran & teguran</span>' +
          '<span class="badge-soft badge-soft--neutral">Akun demo</span>' +
        '</div>' +
      '</article>';
    }).join('');

    return h.pageHead({
      eyebrow: 'Manajemen akses',
      eyebrowIcon: 'userCheck',
      title: 'Akun PJ Kesiswaan',
      description: 'PJ meninjau catatan pelanggaran dan menetapkan teguran. Akun ini tidak dapat mengubah data induk siswa.',
      actions: '<button type="button" class="btn btn-brand" onclick="App.openPJForm()">' + h.icon('plus', '', 15) + 'Tambah akun PJ</button>'
    }) +
    '<div class="toolbar"><div class="toolbar__left"><span class="chip">' + h.icon('userCheck', '', 13) + App.db.pj.length + ' akun PJ</span>' +
      '<span class="chip">' + h.icon('lock', '', 13) + 'Akses kesiswaan</span></div><div class="toolbar__count">Kredensial dikelola oleh Admin Web</div></div>' +
    '<div class="people-grid">' + (cards || TB.ui.emptyState('userCheck', 'Belum ada akun PJ', 'Tambahkan akun PJ untuk membantu tindak lanjut kesiswaan.')) + '</div>';
  }

  function openPJForm(id) {
    if (!IS_ADMIN()) return;
    const existing = id ? App.db.pj.find(function (item) { return item.id_pj === id; }) : null;
    const nextId = TB.store.nextID(App.db.pj, 'id_pj', 'PJ', 2);
    h.modal({
      eyebrow: id ? 'Edit akun PJ' : 'Akun PJ baru',
      title: id ? 'Ubah akun PJ' : 'Tambah PJ Kesiswaan',
      subtitle: 'Akun ini digunakan untuk meninjau pelanggaran dan membuat teguran.',
      content: '<form id="pjForm" onsubmit="App.submitPJ(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">' +
        '<div class="detail-hero" style="margin-bottom:17px;">' +
          (existing ? h.avatar(existing.nama, 'lg') : '<span class="icon-tile icon-tile--lg icon-tile--yellow">' + h.icon('userCheck', '', 23) + '</span>') +
          '<div class="detail-hero__copy"><h3>' + (existing ? esc(existing.nama) : 'Akun PJ baru') + '</h3><p>' + (existing ? esc(existing.id_pj) : 'ID otomatis: ' + nextId) + '</p></div></div>' +
        '<div class="form-stack">' +
          '<div class="field"><label for="pjName">Nama lengkap</label><input class="form-control" id="pjName" name="nama" value="' + esc(existing ? existing.nama : '') + '" placeholder="Nama PJ" required></div>' +
          '<div class="form-row">' +
            '<div class="field"><label for="pjUsername">Username</label><input class="form-control" id="pjUsername" name="username" value="' + esc(existing ? existing.username : '') + '" placeholder="cth. pj.budi" autocomplete="off" required></div>' +
            '<div class="field"><label for="pjPassword">Kata sandi</label><input class="form-control" id="pjPassword" name="password" type="text" value="" placeholder="' + (existing ? 'Biarkan kosong bila tidak diubah' : 'Minimal 6 karakter') + '" autocomplete="new-password"' + (existing ? '' : ' required') + '></div>' +
          '</div>' +
          '<div class="form-note">' + h.icon('shield', '', 14) + '<span>PJ dapat melihat data siswa dan mengelola pelanggaran serta teguran. Data induk dan akun pengguna tetap menjadi kewenangan Admin Web.</span></div>' +
        '</div>' +
      '</form>',
      footer: '<button type="button" class="btn btn-ghost" data-modal-close>Batal</button>' +
        '<button type="submit" class="btn btn-brand" form="pjForm">' + h.icon('check', '', 15) + (id ? 'Simpan perubahan' : 'Simpan akun PJ') + '</button>'
    });
  }

  function submitPJ(event, id) {
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
    if (App.usernameTaken(username, 'pj', id)) {
      h.toast('Username sudah digunakan akun lain.', 'error');
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
      const pj = App.db.pj.find(function (item) { return item.id_pj === id; });
      if (!pj) return;
      pj.nama = nama;
      pj.username = username;
      if (password) pj.password = password;
    } else {
      App.db.pj.push({
        id_pj: TB.store.nextID(App.db.pj, 'id_pj', 'PJ', 2),
        nama: nama,
        username: username,
        password: password
      });
    }
    TB.store.save(App.db);
    h.closeModal();
    App.refresh();
    h.toast(id ? 'Akun PJ diperbarui.' : 'Akun PJ ditambahkan.', 'success');
  }

  function deletePJ(id) {
    if (!IS_ADMIN()) return;
    if (App.db.pj.length <= 1) {
      h.toast('Minimal satu akun PJ harus tersedia untuk alur tindak lanjut.', 'warning');
      return;
    }
    const pj = App.db.pj.find(function (item) { return item.id_pj === id; });
    if (!pj) return;
    h.confirm({
      eyebrow: 'Hapus akun',
      title: 'Hapus akun PJ?',
      message: 'Akun <strong>' + esc(pj.nama) + '</strong> akan dihapus dan tidak dapat masuk ke dashboard.',
      confirmText: 'Hapus akun',
      danger: true,
      onConfirm: function () {
        App.db = TB.store.load();
        App.db.pj = App.db.pj.filter(function (item) { return item.id_pj !== id; });
        TB.store.save(App.db);
        App.refresh();
        h.toast('Akun PJ dihapus.', 'success');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Renderer/action registration                                        */
  /* ------------------------------------------------------------------ */

  App.renderers.pelanggaran = renderViolations;
  App.renderers.jenis = renderViolationTypes;
  App.renderers.teguran = renderWarnings;
  App.renderers.nilai = renderScores;
  App.renderers.artikel = renderArticles;
  App.renderers.aset = renderAssets;
  App.renderers.pj = renderPJ;

  App.openViolationDetail = openViolationDetail;
  App.openViolationForm = openViolationForm;
  App.updateViolationPreview = App.updateViolationPreview;
  App.submitViolation = submitViolation;
  App.deleteViolation = deleteViolation;
  App.openViolationTypeForm = openViolationTypeForm;
  App.submitViolationType = submitViolationType;
  App.deleteViolationType = deleteViolationType;
  App.openWarningForm = openWarningForm;
  App.updateWarningPreview = App.updateWarningPreview;
  App.submitWarning = submitWarning;
  App.deleteWarning = deleteWarning;
  App.openScoreForm = openScoreForm;
  App.submitScore = submitScore;
  App.openArticle = openArticle;
  App.openArticleForm = openArticleForm;
  App.submitArticle = submitArticle;
  App.deleteArticle = deleteArticle;
  App.openAssetForm = openAssetForm;
  App.submitAsset = submitAsset;
  App.deleteAsset = deleteAsset;
  App.openPJForm = openPJForm;
  App.submitPJ = submitPJ;
  App.deletePJ = deletePJ;
})();
