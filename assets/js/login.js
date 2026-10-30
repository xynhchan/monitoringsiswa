/* ==========================================================================
   TumbuhBaik — login behaviour
   ========================================================================== */
(function () {
  'use strict';

  const TB = window.TB;
  const $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  const $$ = function (selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); };

  const ROLE_INFO = {
    admin: {
      label: 'Admin Web',
      icon: 'shield',
      button: 'Masuk sebagai Admin Web'
    },
    guru: {
      label: 'Guru',
      icon: 'graduation',
      button: 'Masuk sebagai Guru'
    },
    pj: {
      label: 'PJ Kesiswaan',
      icon: 'clipboard',
      button: 'Masuk sebagai PJ Kesiswaan'
    },
    orangtua: {
      label: 'Orang Tua',
      icon: 'heart',
      button: 'Masuk sebagai Orang Tua'
    }
  };

  const state = {
    role: 'admin',
    accounts: {},
    submitting: false
  };

  function hydrateIcons(scope) {
    $$('[data-icon]', scope).forEach(function (node) {
      if (node.dataset.iconReady === '1') return;
      const size = Number(node.dataset.iconSize) || 17;
      node.innerHTML = TB.ui.icon(node.dataset.icon, '', size);
      node.dataset.iconReady = '1';
    });
  }

  function getDemoAccounts() {
    const db = TB.store.load();
    return {
      admin: db.admin[0] || null,
      guru: db.guru[0] || null,
      pj: db.pj[0] || null,
      orangtua: db.orangTua[0] || null
    };
  }

  function renderDemoAccounts() {
    const list = $('#demoList');
    if (!list) return;
    state.accounts = getDemoAccounts();

    list.innerHTML = Object.keys(ROLE_INFO).map(function (role) {
      const info = ROLE_INFO[role];
      const account = state.accounts[role];
      const username = account ? account.username : '—';
      const password = account ? account.password : '—';
      return '' +
        '<button class="demo-account" type="button" data-demo-role="' + role + '" aria-label="Isi formulir akun ' + info.label + '">' +
          '<span class="demo-account__icon" aria-hidden="true">' + TB.ui.icon(info.icon, '', 14) + '</span>' +
          '<span class="demo-account__copy">' +
            '<span class="demo-account__role">' + info.label + '</span>' +
            '<span class="demo-account__cred">' + TB.utils.escapeHTML(username) + ' / ' + TB.utils.escapeHTML(password) + '</span>' +
          '</span>' +
          '<span class="demo-account__fill" aria-hidden="true">' + TB.ui.icon('arrowUpRight', '', 13) + '</span>' +
        '</button>';
    }).join('');

    list.addEventListener('click', function (event) {
      const button = event.target.closest('[data-demo-role]');
      if (!button) return;
      selectRole(button.dataset.demoRole, true);
      fillDemo(button.dataset.demoRole);
      const username = $('#username');
      if (username) username.focus();
    });
  }

  function setRoleUI() {
    $$('.role-option').forEach(function (option) {
      const active = option.dataset.role === state.role;
      option.classList.toggle('is-active', active);
      option.setAttribute('aria-pressed', String(active));
    });
    const submitText = $('#loginSubmitText');
    if (submitText) submitText.textContent = ROLE_INFO[state.role].button;
    const username = $('#username');
    if (username) {
      username.placeholder = state.role === 'guru'
        ? 'cth. guru.ratna'
        : state.role === 'pj'
          ? 'cth. pj.budi'
          : state.role === 'orangtua'
            ? 'cth. ortu.ayu'
            : 'cth. admin';
    }
  }

  function selectRole(role, keepValues) {
    if (!ROLE_INFO[role]) return;
    state.role = role;
    setRoleUI();
    clearError();
    if (!keepValues) fillDemo(role);
  }

  function fillDemo(role) {
    const account = state.accounts[role] || getDemoAccounts()[role];
    if (!account) return;
    state.accounts[role] = account;
    const username = $('#username');
    const password = $('#password');
    if (username) username.value = account.username;
    if (password) {
      password.value = account.password;
      password.type = 'password';
      updatePasswordToggle(false);
    }
  }

  function fillInitialForm() {
    const db = TB.store.load();
    const hash = window.location.hash.replace('#', '');
    let initialRole = 'admin';
    if (hash === 'guru' || hash === 'pj' || hash === 'orangtua') initialRole = hash;
    state.accounts = getDemoAccounts();
    state.role = initialRole;
    setRoleUI();
    fillDemo(initialRole);
  }

  function showError(message) {
    const error = $('#loginError');
    if (!error) return;
    error.textContent = message;
    error.classList.add('is-visible');
  }

  function clearError() {
    const error = $('#loginError');
    if (!error) return;
    error.textContent = '';
    error.classList.remove('is-visible');
  }

  function updatePasswordToggle(show) {
    const password = $('#password');
    const button = $('#togglePassword');
    if (!password || !button) return;
    password.type = show ? 'text' : 'password';
    button.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    button.innerHTML = TB.ui.icon(show ? 'eye' : 'eye', '', 17);
    button.style.opacity = show ? '1' : '0.65';
  }

  function setSubmitting(submitting) {
    state.submitting = submitting;
    const button = $('#loginSubmit');
    const text = $('#loginSubmitText');
    if (!button || !text) return;
    button.disabled = submitting;
    button.classList.toggle('is-loading', submitting);
    text.textContent = submitting ? 'Memeriksa akun…' : ROLE_INFO[state.role].button;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (state.submitting) return;
    clearError();

    const username = $('#username').value.trim();
    const password = $('#password').value;
    if (!username) {
      showError('Isi username terlebih dahulu.');
      $('#username').focus();
      return;
    }
    if (!password) {
      showError('Isi kata sandi terlebih dahulu.');
      $('#password').focus();
      return;
    }

    setSubmitting(true);
    window.setTimeout(function () {
      const result = TB.auth.login(state.role, username, password);
      if (!result.ok) {
        setSubmitting(false);
        showError(result.error);
        const form = $('#loginForm');
        form.classList.remove('login-shake');
        void form.offsetWidth;
        form.classList.add('login-shake');
        return;
      }
      const submitText = $('#loginSubmitText');
      if (submitText) submitText.textContent = 'Berhasil! Membuka dashboard…';
      window.setTimeout(function () {
        window.location.href = 'app.html';
      }, 320);
    }, 340);
  }

  function setupPasswordToggle() {
    const button = $('#togglePassword');
    if (!button) return;
    updatePasswordToggle(false);
    button.addEventListener('click', function () {
      const password = $('#password');
      updatePasswordToggle(password.type === 'password');
    });
  }

  function showSessionBanner() {
    const session = TB.auth.current();
    if (!session) return;
    const banner = $('#sessionBanner');
    const name = $('#sessionName');
    const role = $('#sessionRole');
    if (!banner || !name || !role) return;
    banner.classList.remove('hidden');
    name.textContent = session.nama;
    role.textContent = 'Sesi ' + (ROLE_INFO[session.role] ? ROLE_INFO[session.role].label : session.role) + ' masih aktif di perangkat ini.';
  }

  function showForgotPassword() {
    const accounts = getDemoAccounts();
    const rows = Object.keys(ROLE_INFO).map(function (role) {
      const account = accounts[role];
      return '<div class="demo-account" style="cursor: default; transform: none;">' +
        '<span class="demo-account__icon">' + TB.ui.icon(ROLE_INFO[role].icon, '', 14) + '</span>' +
        '<span class="demo-account__copy"><span class="demo-account__role">' + ROLE_INFO[role].label + '</span>' +
        '<span class="demo-account__cred">' + (account ? TB.utils.escapeHTML(account.username) + ' / ' + TB.utils.escapeHTML(account.password) : '—') + '</span></span>' +
      '</div>';
    }).join('');

    TB.ui.modal({
      eyebrow: 'Bantuan masuk',
      title: 'Lupa kata sandi?',
      subtitle: 'Halaman ini adalah demo front-end. Gunakan kredensial akun demo berikut.',
      size: 'sm',
      content: '<div style="display:grid;gap:7px;">' + rows + '</div>' +
        '<p style="margin-top:14px;color:var(--muted);font-size:11.5px;line-height:1.65;">Jika Anda mengubah kata sandi melalui halaman profil, gunakan kata sandi terbaru. Admin Web dapat mengelola akun guru dan PJ dari dashboard.</p>',
      footer: '<button class="btn btn-ghost" type="button" data-modal-close>Tutup</button>' +
        '<button class="btn btn-brand" type="button" id="fillAdminDemo">Gunakan akun Admin</button>'
    });

    const fill = document.getElementById('fillAdminDemo');
    if (fill) {
      fill.addEventListener('click', function () {
        selectRole('admin', true);
        fillDemo('admin');
        TB.ui.closeModal();
      });
    }
  }

  function setupHashBehaviour() {
    if (window.location.hash !== '#akun-demo') return;
    const list = $('#demoList');
    if (!list) return;
    window.setTimeout(function () {
      list.scrollIntoView({ behavior: 'smooth', block: 'center' });
      list.classList.add('demo-list--highlight');
    }, 450);
  }

  document.addEventListener('DOMContentLoaded', function () {
    hydrateIcons();
    renderDemoAccounts();
    fillInitialForm();
    setupPasswordToggle();
    showSessionBanner();

    $$('.role-option').forEach(function (option) {
      option.addEventListener('click', function () {
        selectRole(option.dataset.role, false);
      });
    });

    $('#loginForm').addEventListener('submit', handleSubmit);
    $('#forgotButton').addEventListener('click', showForgotPassword);
    setupHashBehaviour();

    window.addEventListener('hashchange', function () {
      if (window.location.hash === '#akun-demo') setupHashBehaviour();
    });
  });
})();
