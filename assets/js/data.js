/* ==========================================================================
   TumbuhBaik — data layer
   Front-end demo: seed data, localStorage persistence, scoping and auth.
   No backend is required.
   ========================================================================== */
(function () {
  'use strict';

  const TB = (window.TB = window.TB || {});
  const DB_KEY = 'tumbuhbaik.db.v1';
  const SESSION_KEY = 'tumbuhbaik.session.v1';
  const DB_VERSION = 1;

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  function pad(number) {
    return String(number).padStart(2, '0');
  }

  function toISODate(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function daysAgo(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return toISODate(date);
  }

  function monthOffset(offset) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + offset);
    return date;
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(value, style) {
    if (!value) return '—';
    const date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return value;
    if (style === 'long') {
      return date.getDate() + ' ' + MONTHS_LONG[date.getMonth()] + ' ' + date.getFullYear();
    }
    if (style === 'numeric') {
      return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear();
    }
    return date.getDate() + ' ' + MONTHS_SHORT[date.getMonth()] + ' ' + date.getFullYear();
  }

  function formatShortDate(value) {
    if (!value) return '—';
    const date = new Date(value + 'T12:00:00');
    return date.getDate() + ' ' + MONTHS_SHORT[date.getMonth()];
  }

  function formatRelative(value) {
    if (!value) return '';
    const date = new Date(value + 'T12:00:00');
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const diff = Math.round((now - date) / 86400000);
    if (diff <= 0) return 'Hari ini';
    if (diff === 1) return 'Kemarin';
    if (diff < 7) return diff + ' hari lalu';
    if (diff < 30) return Math.floor(diff / 7) + ' minggu lalu';
    return formatDate(value);
  }

  function monthKey(value) {
    const date = new Date(value + 'T12:00:00');
    return date.getFullYear() + '-' + pad(date.getMonth() + 1);
  }

  function monthLabel(date) {
    return MONTHS_SHORT[date.getMonth()];
  }

  function getInitials(name) {
    return String(name || '?')
      .replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0); })
      .join('')
      .toUpperCase() || '?';
  }

  function colorIndex(value) {
    let hash = 0;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 6) + 1;
  }

  /* ------------------------------------------------------------------ */
  /* Seed data                                                           */
  /* ------------------------------------------------------------------ */

  function makeSeed() {
    const admin = [
      { id_admin: 'A01', nama: 'Meta Lestari', username: 'admin', password: 'admin123' }
    ];

    const guru = [
      { id_guru: 'G01', nama: 'Ratna Wulandari, S.Pd.', username: 'guru.ratna', password: 'guru123' },
      { id_guru: 'G02', nama: 'Hendra Saputra, S.Pd.', username: 'guru.hendra', password: 'guru123' },
      { id_guru: 'G03', nama: 'Siti Nurhaliza, S.Pd.', username: 'guru.siti', password: 'guru123' },
      { id_guru: 'G04', nama: 'Agus Pramono, S.Pd.', username: 'guru.agus', password: 'guru123' }
    ];

    const pj = [
      { id_pj: 'PJ01', nama: 'Budi Santoso', username: 'pj.budi', password: 'pj123' },
      { id_pj: 'PJ02', nama: 'Rina Kusuma', username: 'pj.rina', password: 'pj123' }
    ];

    const kelas = [
      { id_kelas: 'K01', nama_kelas: '1A' },
      { id_kelas: 'K02', nama_kelas: '2A' },
      { id_kelas: 'K03', nama_kelas: '3A' },
      { id_kelas: 'K04', nama_kelas: '4A' },
      { id_kelas: 'K05', nama_kelas: '5A' },
      { id_kelas: 'K06', nama_kelas: '6A' }
    ];

    const siswa = [
      { id_siswa: 'S001', nama: 'Aisyah Putri', id_kelas: 'K01', id_guru: 'G02' },
      { id_siswa: 'S002', nama: 'Bima Pratama', id_kelas: 'K01', id_guru: 'G02' },
      { id_siswa: 'S003', nama: 'Citra Lestari', id_kelas: 'K01', id_guru: 'G02' },
      { id_siswa: 'S004', nama: 'Dimas Alfarizi', id_kelas: 'K01', id_guru: 'G02' },
      { id_siswa: 'S005', nama: 'Elang Samudra', id_kelas: 'K02', id_guru: 'G02' },
      { id_siswa: 'S006', nama: 'Fara Nabila', id_kelas: 'K02', id_guru: 'G02' },
      { id_siswa: 'S007', nama: 'Galih Ramadhan', id_kelas: 'K02', id_guru: 'G02' },
      { id_siswa: 'S008', nama: 'Hanin Zahra', id_kelas: 'K02', id_guru: 'G02' },
      { id_siswa: 'S009', nama: 'Intan Permata', id_kelas: 'K03', id_guru: 'G01' },
      { id_siswa: 'S010', nama: 'Joko Susilo', id_kelas: 'K03', id_guru: 'G01' },
      { id_siswa: 'S011', nama: 'Kirana Maharani', id_kelas: 'K03', id_guru: 'G01' },
      { id_siswa: 'S012', nama: 'Luthfi Hakim', id_kelas: 'K03', id_guru: 'G01' },
      { id_siswa: 'S013', nama: 'Maya Anggraini', id_kelas: 'K04', id_guru: 'G01' },
      { id_siswa: 'S014', nama: 'Naufal Rizky', id_kelas: 'K04', id_guru: 'G01' },
      { id_siswa: 'S015', nama: 'Olivia Safira', id_kelas: 'K04', id_guru: 'G01' },
      { id_siswa: 'S016', nama: 'Putra Wijaya', id_kelas: 'K04', id_guru: 'G01' },
      { id_siswa: 'S017', nama: 'Qanita Aulia', id_kelas: 'K05', id_guru: 'G03' },
      { id_siswa: 'S018', nama: 'Rafi Athallah', id_kelas: 'K05', id_guru: 'G03' },
      { id_siswa: 'S019', nama: 'Salma Kirana', id_kelas: 'K05', id_guru: 'G03' },
      { id_siswa: 'S020', nama: 'Tegar Mahendra', id_kelas: 'K05', id_guru: 'G03' },
      { id_siswa: 'S021', nama: 'Umar Faruq', id_kelas: 'K06', id_guru: 'G04' },
      { id_siswa: 'S022', nama: 'Vania Larasati', id_kelas: 'K06', id_guru: 'G04' },
      { id_siswa: 'S023', nama: 'Wibowo Jati', id_kelas: 'K06', id_guru: 'G04' },
      { id_siswa: 'S024', nama: 'Zahra Amalia', id_kelas: 'K06', id_guru: 'G04' }
    ];

    const nilaiValues = [88, 76, 91, 82, 79, 86, 74, 93, 84, 71, 90, 80, 87, 78, 92, 83, 85, 73, 89, 77, 72, 81, 86, 94];
    const nilai = siswa.map(function (student, index) {
      return {
        id_nilai: 'N' + String(index + 1).padStart(3, '0'),
        id_siswa: student.id_siswa,
        nilai_kompetensi: nilaiValues[index],
        total_poin: 100
      };
    });

    const orangTua = [
      {
        id_ortu: 'O01',
        nama: 'Ayu Anggraini',
        username: 'ortu.ayu',
        password: 'ortu123',
        id_siswa: 'S013'
      },
      {
        id_ortu: 'O02',
        nama: 'Nina Kurniasih',
        username: 'ortu.nina',
        password: 'ortu123',
        id_siswa: 'S014'
      }
    ];

    const jenisPelanggaran = [
      { id_jenis: 'J01', nama_pelanggaran: 'Terlambat masuk sekolah', pengurangan_poin: 5 },
      { id_jenis: 'J02', nama_pelanggaran: 'Tidak memakai seragam lengkap', pengurangan_poin: 10 },
      { id_jenis: 'J03', nama_pelanggaran: 'Tidak mengerjakan tugas', pengurangan_poin: 10 },
      { id_jenis: 'J04', nama_pelanggaran: 'Berkata kasar kepada teman', pengurangan_poin: 15 },
      { id_jenis: 'J05', nama_pelanggaran: 'Membully teman', pengurangan_poin: 25 },
      { id_jenis: 'J06', nama_pelanggaran: 'Bolos sekolah', pengurangan_poin: 20 },
      { id_jenis: 'J07', nama_pelanggaran: 'Membawa barang terlarang', pengurangan_poin: 30 },
      { id_jenis: 'J08', nama_pelanggaran: 'Tidak mengikuti upacara', pengurangan_poin: 5 }
    ];

    const pelanggaran = [
      { id_pelanggaran: 'V001', id_siswa: 'S013', id_jenis: 'J01', keterangan: 'Datang 15 menit setelah bel masuk dibunyikan.', tanggal: daysAgo(2) },
      { id_pelanggaran: 'V002', id_siswa: 'S009', id_jenis: 'J03', keterangan: 'Tugas matematika tidak dikumpulkan tanpa keterangan.', tanggal: daysAgo(4) },
      { id_pelanggaran: 'V003', id_siswa: 'S014', id_jenis: 'J02', keterangan: 'Tidak memakai dasi dan sepatu hitam saat apel pagi.', tanggal: daysAgo(6) },
      { id_pelanggaran: 'V004', id_siswa: 'S018', id_jenis: 'J05', keterangan: 'Mengganggu dan mengejek teman saat jam istirahat.', tanggal: daysAgo(8) },
      { id_pelanggaran: 'V005', id_siswa: 'S002', id_jenis: 'J04', keterangan: 'Berkata kasar saat menyelesaikan perselisihan di kelas.', tanggal: daysAgo(10) },
      { id_pelanggaran: 'V006', id_siswa: 'S021', id_jenis: 'J06', keterangan: 'Tidak masuk tanpa surat keterangan selama satu hari.', tanggal: daysAgo(13) },
      { id_pelanggaran: 'V007', id_siswa: 'S006', id_jenis: 'J01', keterangan: 'Terlambat karena bangun kesiangan.', tanggal: daysAgo(15) },
      { id_pelanggaran: 'V008', id_siswa: 'S018', id_jenis: 'J01', keterangan: 'Terlambat 20 menit setelah bel masuk.', tanggal: daysAgo(20) },
      { id_pelanggaran: 'V009', id_siswa: 'S010', id_jenis: 'J03', keterangan: 'Tugas Bahasa Indonesia tidak dikerjakan.', tanggal: daysAgo(24) },
      { id_pelanggaran: 'V010', id_siswa: 'S022', id_jenis: 'J02', keterangan: 'Seragam tidak lengkap saat kegiatan olahraga.', tanggal: daysAgo(28) },
      { id_pelanggaran: 'V011', id_siswa: 'S013', id_jenis: 'J03', keterangan: 'Tugas kelompok belum diselesaikan sesuai kesepakatan.', tanggal: daysAgo(33) },
      { id_pelanggaran: 'V012', id_siswa: 'S015', id_jenis: 'J07', keterangan: 'Membawa mainan yang tidak berkaitan dengan pembelajaran.', tanggal: daysAgo(38) },
      { id_pelanggaran: 'V013', id_siswa: 'S019', id_jenis: 'J01', keterangan: 'Terlambat 10 menit.', tanggal: daysAgo(42) },
      { id_pelanggaran: 'V014', id_siswa: 'S004', id_jenis: 'J04', keterangan: 'Berkata kasar kepada teman sekelas.', tanggal: daysAgo(49) },
      { id_pelanggaran: 'V015', id_siswa: 'S017', id_jenis: 'J05', keterangan: 'Mengejek nama panggilan teman secara berulang.', tanggal: daysAgo(55) },
      { id_pelanggaran: 'V016', id_siswa: 'S007', id_jenis: 'J02', keterangan: 'Tidak memakai sabuk dan kaos kaki lengkap.', tanggal: daysAgo(62) },
      { id_pelanggaran: 'V017', id_siswa: 'S012', id_jenis: 'J06', keterangan: 'Meninggalkan kelas tanpa izin guru.', tanggal: daysAgo(70) },
      { id_pelanggaran: 'V018', id_siswa: 'S020', id_jenis: 'J03', keterangan: 'Tidak mengumpulkan tugas IPS.', tanggal: daysAgo(78) },
      { id_pelanggaran: 'V019', id_siswa: 'S008', id_jenis: 'J04', keterangan: 'Berkata kasar saat bermain di lapangan.', tanggal: daysAgo(86) },
      { id_pelanggaran: 'V020', id_siswa: 'S023', id_jenis: 'J01', keterangan: 'Terlambat mengikuti kegiatan pembiasaan pagi.', tanggal: daysAgo(95) },
      { id_pelanggaran: 'V021', id_siswa: 'S005', id_jenis: 'J05', keterangan: 'Mendorong teman hingga terjatuh saat antre.', tanggal: daysAgo(104) },
      { id_pelanggaran: 'V022', id_siswa: 'S011', id_jenis: 'J02', keterangan: 'Seragam tidak lengkap pada hari Senin.', tanggal: daysAgo(118) },
      { id_pelanggaran: 'V023', id_siswa: 'S024', id_jenis: 'J03', keterangan: 'Tugas seni tidak dikumpulkan.', tanggal: daysAgo(135) },
      { id_pelanggaran: 'V024', id_siswa: 'S016', id_jenis: 'J01', keterangan: 'Terlambat karena hujan.', tanggal: daysAgo(150) }
    ];

    const teguran = [
      {
        id_teguran: 'T001',
        id_pelanggaran: 'V004',
        jumlah_teguran: 1,
        catatan: 'Mediasi dilakukan bersama siswa, wali kelas, dan orang tua. Anak menyampaikan permintaan maaf secara langsung.',
        sanksi: 'Membuat surat permohonan maaf dan mengikuti pendampingan perilaku selama tiga hari.'
      },
      {
        id_teguran: 'T002',
        id_pelanggaran: 'V006',
        jumlah_teguran: 1,
        catatan: 'Orang tua hadir ke sekolah dan menyepakati pemantauan kehadiran setiap pagi.',
        sanksi: 'Pemanggilan orang tua dan membuat komitmen kehadiran.'
      },
      {
        id_teguran: 'T003',
        id_pelanggaran: 'V002',
        jumlah_teguran: 2,
        catatan: 'Siswa sudah diberi kesempatan untuk menyelesaikan tugas, namun belum dikumpulkan.',
        sanksi: 'Menyelesaikan tugas di sekolah didampingi guru kelas.'
      },
      {
        id_teguran: 'T004',
        id_pelanggaran: 'V012',
        jumlah_teguran: 1,
        catatan: 'Barang dititipkan ke guru kelas dan dikembalikan kepada orang tua.',
        sanksi: 'Barang disita sementara dan orang tua dihubungi.'
      },
      {
        id_teguran: 'T005',
        id_pelanggaran: 'V015',
        jumlah_teguran: 2,
        catatan: 'Pendampingan konseling sebaya dan pengawasan saat jam istirahat.',
        sanksi: 'Konseling bersama guru pendamping dan tugas refleksi diri.'
      },
      {
        id_teguran: 'T006',
        id_pelanggaran: 'V018',
        jumlah_teguran: 1,
        catatan: 'Tugas dijadwalkan ulang dan orang tua diminta mendampingi belajar di rumah.',
        sanksi: 'Teguran lisan dan penjadwalan ulang pengumpulan tugas.'
      },
      {
        id_teguran: 'T007',
        id_pelanggaran: 'V011',
        jumlah_teguran: 1,
        catatan: 'Orang tua mendampingi Maya menyusun jadwal belajar di rumah. Guru kelas memantau penyelesaian tugas berikutnya.',
        sanksi: 'Menyelesaikan tugas kelompok dan membuat jadwal belajar bersama orang tua.'
      }
    ];

    const artikel = [
      {
        id_artikel: 'ART01',
        judul_artikel: 'Membangun Kebiasaan Baik Sejak Dini',
        isi_artikel: 'Kebiasaan baik tidak terbentuk dalam semalam. Di usia sekolah dasar, anak belajar memahami aturan melalui contoh, pengulangan, dan dukungan orang dewasa di sekitarnya.\n\nSekolah dan keluarga dapat menjadi tim yang kuat. Ketika guru mencatat sebuah pelanggaran, tujuannya bukan menghukum, melainkan membuka percakapan tentang apa yang bisa diperbaiki. Catatan yang rapi membantu kita melihat pola dan memberi dukungan yang tepat.\n\nMulailah dari hal kecil: hadir tepat waktu, menyapa dengan sopan, dan menyelesaikan tugas. Apresiasi setiap kemajuan, sekecil apa pun.',
        tanggal: daysAgo(4)
      },
      {
        id_artikel: 'ART02',
        judul_artikel: 'Mendampingi Anak Saat Melanggar Aturan',
        isi_artikel: 'Saat mendengar kabar bahwa anak melanggar aturan, reaksi pertama bisa berupa kaget atau kecewa. Tenangkan diri terlebih dahulu, lalu ajak anak berbicara dengan tenang.\n\nTanyakan apa yang terjadi dari sudut pandangnya. Dengarkan tanpa langsung menghakimi. Setelah itu, jelaskan mengapa aturan tersebut penting dan bantu anak menemukan cara lain untuk menghadapi situasi serupa.\n\nLibatkan sekolah. Guru dan orang tua dapat menyusun langkah perbaikan yang konsisten, misalnya pendampingan belajar atau komitmen kehadiran. Tujuannya adalah pemulihan, bukan sekadar hukuman.',
        tanggal: daysAgo(12)
      },
      {
        id_artikel: 'ART03',
        judul_artikel: 'Poin Perilaku: Bukan Sekadar Angka',
        isi_artikel: 'Poin perilaku membantu sekolah melihat perkembangan anak secara lebih utuh. Angka ini bukan label, melainkan alat komunikasi antara guru, siswa, dan orang tua.\n\nDengan data yang transparan, setiap pihak tahu hal yang perlu diperbaiki. Guru dapat merancang pendampingan, sementara orang tua dapat memberi dukungan di rumah.\n\nYang paling penting adalah percakapan di balik angka. Rayakan keberhasilan anak dalam memperbaiki diri, dan pastikan setiap catatan disertai bimbingan yang jelas.',
        tanggal: daysAgo(20)
      },
      {
        id_artikel: 'ART04',
        judul_artikel: 'Kolaborasi Sekolah dan Orang Tua',
        isi_artikel: 'Kolaborasi yang baik dimulai dari komunikasi yang terbuka. Ketika sekolah membagikan catatan secara berkala, orang tua dapat terlibat lebih cepat dan tepat.\n\nTumbuhBaik dirancang untuk membuat arus informasi ini lebih sederhana. Setiap peran memiliki akses yang sesuai, sehingga data siswa tetap aman dan terfokus.\n\nJadwalkan waktu singkat setiap minggu untuk melihat perkembangan anak. Satu percakapan hangat sering kali lebih berdampak daripada banyak teguran.',
        tanggal: daysAgo(35)
      }
    ];

    const webAssets = [
      { id_asset: 'AS01', nama_asset: 'Logo TumbuhBaik', file_url: 'assets/img/logo-mark.svg' },
      { id_asset: 'AS02', nama_asset: 'Ilustrasi Hero', file_url: 'assets/img/hero-illustration.svg' },
      { id_asset: 'AS03', nama_asset: 'Ilustrasi Komunitas', file_url: 'assets/img/community-illustration.svg' },
      { id_asset: 'AS04', nama_asset: 'Ilustrasi Login', file_url: 'assets/img/login-illustration.svg' },
      { id_asset: 'AS05', nama_asset: 'Favicon Sekolah', file_url: 'assets/img/favicon.svg' }
    ];

    return {
      meta: {
        version: DB_VERSION,
        seededAt: new Date().toISOString(),
        school: 'SD Tunas Cendekia',
        tahunAjaran: '2026/2027',
        semester: 'Ganjil'
      },
      admin: admin,
      guru: guru,
      pj: pj,
      kelas: kelas,
      siswa: siswa,
      nilai: nilai,
      orangTua: orangTua,
      jenisPelanggaran: jenisPelanggaran,
      pelanggaran: pelanggaran,
      teguran: teguran,
      artikel: artikel,
      webAssets: webAssets
    };
  }

  /* ------------------------------------------------------------------ */
  /* Persistence                                                         */
  /* ------------------------------------------------------------------ */

  function readJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('TumbuhBaik: unable to read storage', error);
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('TumbuhBaik: unable to write storage', error);
      return false;
    }
  }

  function recomputeNilai(db) {
    db.nilai.forEach(function (score) {
      const deductions = db.pelanggaran
        .filter(function (record) { return record.id_siswa === score.id_siswa; })
        .reduce(function (total, record) {
          const jenis = db.jenisPelanggaran.find(function (item) { return item.id_jenis === record.id_jenis; });
          return total + (jenis ? Number(jenis.pengurangan_poin) || 0 : 0);
        }, 0);
      score.total_poin = Math.max(0, 100 - deductions);
    });
    return db;
  }

  function normalizeDB(db) {
    if (!db || !db.meta) return null;
    db.meta.version = DB_VERSION;
    ['admin', 'guru', 'pj', 'kelas', 'siswa', 'nilai', 'orangTua', 'jenisPelanggaran', 'pelanggaran', 'teguran', 'artikel', 'webAssets'].forEach(function (key) {
      if (!Array.isArray(db[key])) db[key] = [];
    });
    recomputeNilai(db);
    return db;
  }

  function loadDB() {
    let db = readJSON(DB_KEY);
    if (!db) {
      db = makeSeed();
      recomputeNilai(db);
      writeJSON(DB_KEY, db);
    } else {
      db = normalizeDB(db);
    }
    return db;
  }

  function saveDB(db) {
    if (!db) return false;
    normalizeDB(db);
    return writeJSON(DB_KEY, db);
  }

  function resetDB() {
    const db = makeSeed();
    recomputeNilai(db);
    writeJSON(DB_KEY, db);
    return db;
  }

  function nextID(collection, field, prefix, padding) {
    const max = collection.reduce(function (highest, item) {
      const numeric = parseInt(String(item[field] || '').replace(/\D/g, ''), 10);
      return Number.isFinite(numeric) && numeric > highest ? numeric : highest;
    }, 0);
    return prefix + String(max + 1).padStart(padding || 3, '0');
  }

  /* ------------------------------------------------------------------ */
  /* Authentication                                                      */
  /* ------------------------------------------------------------------ */

  const ROLE_META = {
    admin: { label: 'Admin Web', short: 'Admin', icon: 'shield', color: 'admin' },
    guru: { label: 'Guru', short: 'Guru', icon: 'graduation', color: 'guru' },
    pj: { label: 'PJ Kesiswaan', short: 'PJ', icon: 'clipboard', color: 'pj' },
    orangtua: { label: 'Orang Tua', short: 'Orang Tua', icon: 'heart', color: 'ortu' }
  };

  function login(role, username, password) {
    const db = loadDB();
    const normalizedRole = String(role || '').toLowerCase();
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');
    let account = null;
    let collectionName = '';

    if (normalizedRole === 'admin') {
      collectionName = 'admin';
      account = db.admin.find(function (item) { return item.username.toLowerCase() === normalizedUsername; });
    } else if (normalizedRole === 'guru') {
      collectionName = 'guru';
      account = db.guru.find(function (item) { return item.username.toLowerCase() === normalizedUsername; });
    } else if (normalizedRole === 'pj') {
      collectionName = 'pj';
      account = db.pj.find(function (item) { return item.username.toLowerCase() === normalizedUsername; });
    } else if (normalizedRole === 'orangtua') {
      collectionName = 'orangTua';
      account = db.orangTua.find(function (item) { return item.username.toLowerCase() === normalizedUsername; });
    } else {
      return { ok: false, error: 'Peran tidak dikenali.' };
    }

    if (!account) {
      return { ok: false, error: 'Username tidak ditemukan untuk peran ' + (ROLE_META[normalizedRole] ? ROLE_META[normalizedRole].label : role) + '.' };
    }
    if (account.password !== normalizedPassword) {
      return { ok: false, error: 'Kata sandi belum tepat. Silakan periksa kembali.' };
    }

    const session = {
      role: normalizedRole,
      id: account['id_' + (collectionName === 'orangTua' ? 'ortu' : collectionName.replace('admin', 'admin').replace('guru', 'guru').replace('pj', 'pj'))],
      nama: account.nama,
      username: account.username,
      loginAt: new Date().toISOString()
    };

    // Keep ids explicit and stable across role names.
    if (normalizedRole === 'admin') session.id = account.id_admin;
    if (normalizedRole === 'guru') session.id = account.id_guru;
    if (normalizedRole === 'pj') session.id = account.id_pj;
    if (normalizedRole === 'orangtua') {
      session.id = account.id_ortu;
      session.id_siswa = account.id_siswa;
    }

    writeJSON(SESSION_KEY, session);
    return { ok: true, session: session };
  }

  function currentSession() {
    const session = readJSON(SESSION_KEY);
    if (!session || !session.role || !session.id) return null;
    return session;
  }

  function logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (error) { /* ignore */ }
  }

  function changePassword(oldPassword, newPassword) {
    const session = currentSession();
    if (!session) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!newPassword || String(newPassword).length < 6) return { ok: false, error: 'Kata sandi baru minimal 6 karakter.' };
    const db = loadDB();
    let account = null;
    if (session.role === 'admin') account = db.admin.find(function (item) { return item.id_admin === session.id; });
    if (session.role === 'guru') account = db.guru.find(function (item) { return item.id_guru === session.id; });
    if (session.role === 'pj') account = db.pj.find(function (item) { return item.id_pj === session.id; });
    if (session.role === 'orangtua') account = db.orangTua.find(function (item) { return item.id_ortu === session.id; });
    if (!account) return { ok: false, error: 'Akun tidak ditemukan.' };
    if (account.password !== oldPassword) return { ok: false, error: 'Kata sandi saat ini tidak cocok.' };
    account.password = String(newPassword);
    saveDB(db);
    return { ok: true };
  }

  /* ------------------------------------------------------------------ */
  /* Relations and scoping                                               */
  /* ------------------------------------------------------------------ */

  function getKelas(db, id) {
    return db.kelas.find(function (item) { return item.id_kelas === id; }) || null;
  }

  function getGuru(db, id) {
    return db.guru.find(function (item) { return item.id_guru === id; }) || null;
  }

  function getSiswa(db, id) {
    return db.siswa.find(function (item) { return item.id_siswa === id; }) || null;
  }

  function getJenis(db, id) {
    return db.jenisPelanggaran.find(function (item) { return item.id_jenis === id; }) || null;
  }

  function getNilai(db, idSiswa) {
    return db.nilai.find(function (item) { return item.id_siswa === idSiswa; }) || null;
  }

  function getPelanggaranById(db, id) {
    return db.pelanggaran.find(function (item) { return item.id_pelanggaran === id; }) || null;
  }

  function getTeguranByPelanggaran(db, id) {
    return db.teguran.find(function (item) { return item.id_pelanggaran === id; }) || null;
  }

  function getOrtuForSiswa(db, idSiswa) {
    return db.orangTua.find(function (item) { return item.id_siswa === idSiswa; }) || null;
  }

  function classesForGuru(db, idGuru) {
    const ids = new Set(
      db.siswa
        .filter(function (item) { return item.id_guru === idGuru; })
        .map(function (item) { return item.id_kelas; })
    );
    return db.kelas.filter(function (item) { return ids.has(item.id_kelas); });
  }

  function waliForKelas(db, idKelas) {
    const counts = {};
    db.siswa
      .filter(function (item) { return item.id_kelas === idKelas; })
      .forEach(function (item) {
        counts[item.id_guru] = (counts[item.id_guru] || 0) + 1;
      });
    const id = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
    return id ? getGuru(db, id) : null;
  }

  function scopedStudents(db, session) {
    if (!session) return [];
    if (session.role === 'guru') {
      return db.siswa.filter(function (item) { return item.id_guru === session.id; });
    }
    if (session.role === 'orangtua') {
      return db.siswa.filter(function (item) { return item.id_siswa === session.id_siswa; });
    }
    return db.siswa.slice();
  }

  function scopedViolations(db, session) {
    const students = scopedStudents(db, session);
    const ids = new Set(students.map(function (item) { return item.id_siswa; }));
    return db.pelanggaran.filter(function (item) { return ids.has(item.id_siswa); });
  }

  function scopedWarnings(db, session) {
    const violations = scopedViolations(db, session);
    const ids = new Set(violations.map(function (item) { return item.id_pelanggaran; }));
    return db.teguran.filter(function (item) { return ids.has(item.id_pelanggaran); });
  }

  function scopedScores(db, session) {
    const students = scopedStudents(db, session);
    const ids = new Set(students.map(function (item) { return item.id_siswa; }));
    return db.nilai.filter(function (item) { return ids.has(item.id_siswa); });
  }

  function pointStatus(points) {
    if (points >= 85) return { label: 'Sangat baik', tone: 'success', key: 'safe' };
    if (points >= 70) return { label: 'Baik', tone: 'info', key: 'good' };
    if (points >= 50) return { label: 'Perlu perhatian', tone: 'warning', key: 'attention' };
    return { label: 'Perlu pendampingan', tone: 'danger', key: 'critical' };
  }

  function violationLevel(points) {
    const value = Math.abs(Number(points) || 0);
    if (value >= 20) return { label: 'Berat', tone: 'danger' };
    if (value >= 10) return { label: 'Sedang', tone: 'warning' };
    return { label: 'Ringan', tone: 'info' };
  }

  /* ------------------------------------------------------------------ */
  /* Statistics                                                          */
  /* ------------------------------------------------------------------ */

  function monthSeries(db, violations, count) {
    const total = count || 6;
    const keys = [];
    const labels = [];
    for (let index = total - 1; index >= 0; index -= 1) {
      const date = monthOffset(-index);
      keys.push(date.getFullYear() + '-' + pad(date.getMonth() + 1));
      labels.push(MONTHS_SHORT[date.getMonth()]);
    }
    const values = keys.map(function (key) {
      return violations.filter(function (item) { return monthKey(item.tanggal) === key; }).length;
    });
    return { keys: keys, labels: labels, values: values };
  }

  function computeStats(db, session) {
    const students = scopedStudents(db, session);
    const violations = scopedViolations(db, session);
    const warnings = scopedWarnings(db, session);
    const scores = scopedScores(db, session);
    const currentKey = monthKey(toISODate(new Date()));
    const previousDate = monthOffset(-1);
    const previousKey = previousDate.getFullYear() + '-' + pad(previousDate.getMonth() + 1);
    const thisMonth = violations.filter(function (item) { return monthKey(item.tanggal) === currentKey; });
    const lastMonth = violations.filter(function (item) { return monthKey(item.tanggal) === previousKey; });
    const pending = violations.filter(function (item) {
      return !db.teguran.some(function (warning) { return warning.id_pelanggaran === item.id_pelanggaran; });
    });
    const averagePoints = scores.length
      ? Math.round(scores.reduce(function (total, item) { return total + Number(item.total_poin || 0); }, 0) / scores.length)
      : 100;
    const averageScore = scores.length
      ? Math.round(scores.reduce(function (total, item) { return total + Number(item.nilai_kompetensi || 0); }, 0) / scores.length)
      : 0;
    const trend = lastMonth.length === 0
      ? (thisMonth.length > 0 ? 100 : 0)
      : Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100);
    return {
      students: students,
      violations: violations,
      warnings: warnings,
      scores: scores,
      thisMonth: thisMonth,
      lastMonth: lastMonth,
      pending: pending,
      averagePoints: averagePoints,
      averageScore: averageScore,
      trend: trend,
      monthSeries: monthSeries(db, violations, 6)
    };
  }

  function classSummary(db) {
    return db.kelas.map(function (classItem) {
      const students = db.siswa.filter(function (student) { return student.id_kelas === classItem.id_kelas; });
      const ids = new Set(students.map(function (student) { return student.id_siswa; }));
      const scores = db.nilai.filter(function (score) { return ids.has(score.id_siswa); });
      const violations = db.pelanggaran.filter(function (record) { return ids.has(record.id_siswa); });
      const average = scores.length
        ? Math.round(scores.reduce(function (total, score) { return total + score.total_poin; }, 0) / scores.length)
        : 100;
      const wali = waliForKelas(db, classItem.id_kelas);
      return {
        kelas: classItem,
        students: students,
        count: students.length,
        average: average,
        violations: violations.length,
        wali: wali
      };
    });
  }

  function topViolationTypes(db, violations) {
    const map = {};
    violations.forEach(function (record) {
      if (!map[record.id_jenis]) map[record.id_jenis] = { count: 0, total: 0 };
      map[record.id_jenis].count += 1;
      const jenis = getJenis(db, record.id_jenis);
      map[record.id_jenis].total += jenis ? Number(jenis.pengurangan_poin) : 0;
    });
    return Object.keys(map).map(function (id) {
      return { jenis: getJenis(db, id), count: map[id].count, total: map[id].total };
    }).filter(function (item) { return item.jenis; }).sort(function (a, b) { return b.count - a.count; });
  }

  function studentTimeline(db, idSiswa) {
    const records = db.pelanggaran
      .filter(function (item) { return item.id_siswa === idSiswa; })
      .map(function (item) {
        return {
          violation: item,
          jenis: getJenis(db, item.id_jenis),
          warning: getTeguranByPelanggaran(db, item.id_pelanggaran)
        };
      })
      .sort(function (a, b) { return new Date(b.violation.tanggal) - new Date(a.violation.tanggal); });
    return records;
  }

  /* ------------------------------------------------------------------ */
  /* Exports                                                             */
  /* ------------------------------------------------------------------ */

  TB.data = {
    MONTHS_SHORT: MONTHS_SHORT,
    MONTHS_LONG: MONTHS_LONG,
    ROLE_META: ROLE_META,
    makeSeed: makeSeed
  };

  TB.store = {
    load: loadDB,
    save: saveDB,
    reset: resetDB,
    recalculate: recomputeNilai,
    nextID: nextID
  };

  TB.auth = {
    login: login,
    current: currentSession,
    logout: logout,
    changePassword: changePassword
  };

  TB.relations = {
    getKelas: getKelas,
    getGuru: getGuru,
    getSiswa: getSiswa,
    getJenis: getJenis,
    getNilai: getNilai,
    getPelanggaran: getPelanggaranById,
    getTeguran: getTeguranByPelanggaran,
    getOrtu: getOrtuForSiswa,
    classesForGuru: classesForGuru,
    waliForKelas: waliForKelas,
    scopedStudents: scopedStudents,
    scopedViolations: scopedViolations,
    scopedWarnings: scopedWarnings,
    scopedScores: scopedScores,
    studentTimeline: studentTimeline
  };

  TB.stats = {
    compute: computeStats,
    classSummary: classSummary,
    topViolationTypes: topViolationTypes
  };

  TB.utils = {
    escapeHTML: escapeHTML,
    formatDate: formatDate,
    formatShortDate: formatShortDate,
    formatRelative: formatRelative,
    monthKey: monthKey,
    monthLabel: monthLabel,
    getInitials: getInitials,
    colorIndex: colorIndex,
    pointStatus: pointStatus,
    violationLevel: violationLevel,
    toISODate: toISODate,
    daysAgo: daysAgo,
    today: function () { return toISODate(new Date()); }
  };
})();
