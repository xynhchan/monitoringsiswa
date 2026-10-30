/* ==========================================================================
   TumbuhBaik — landing page behaviour
   ========================================================================== */
(function () {
  'use strict';

  const TB = window.TB;
  const $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  const $$ = function (selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); };

  function hydrateIcons(scope) {
    $$('[data-icon]', scope).forEach(function (node) {
      if (node.dataset.iconReady === '1') return;
      const size = Number(node.dataset.iconSize) || 18;
      node.innerHTML = TB.ui.icon(node.dataset.icon, '', size);
      node.dataset.iconReady = '1';
    });
  }

  function setupNavigation() {
    const toggle = $('#navToggle');
    const nav = $('#siteNav');
    if (!toggle || !nav) return;

    function setToggleIcon(open) {
      const iconEl = toggle.querySelector('[data-icon]') || toggle;
      iconEl.innerHTML = TB.ui.icon(open ? 'close' : 'menu', '', 20);
      iconEl.dataset.icon = open ? 'close' : 'menu';
      iconEl.dataset.iconReady = '1';
    }

    function close() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Buka menu navigasi');
      setToggleIcon(false);
    }

    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
      setToggleIcon(open);
    });

    $$('.site-nav__link', nav).forEach(function (link) {
      link.addEventListener('click', close);
    });

    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) close();
    });
  }

  function setupReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    items.forEach(function (item) { observer.observe(item); });
  }

  function setupActiveNav() {
    const links = $$('.site-nav__link');
    const sections = links
      .map(function (link) {
        const id = link.getAttribute('href');
        if (!id || id.charAt(0) !== '#') return null;
        const section = document.getElementById(id.slice(1));
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) { link.classList.remove('is-active'); });
        const match = sections.find(function (item) { return item.section === entry.target; });
        if (match) match.link.classList.add('is-active');
      });
    }, { threshold: 0.2, rootMargin: '-25% 0px -55% 0px' });

    sections.forEach(function (item) { observer.observe(item.section); });
  }

  function articleVisualClass(index) {
    return 'article-card__visual--' + ((index % 4) + 1);
  }

  function articleIcon(index) {
    return ['book', 'heartHandshake', 'award', 'message'][index % 4];
  }

  function renderArticles() {
    const grid = $('#latestArticles');
    if (!grid) return;
    const db = TB.store.load();
    const articles = db.artikel
      .slice()
      .sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); })
      .slice(0, 3);

    if (!articles.length) {
      grid.innerHTML = TB.ui.emptyState('book', 'Belum ada artikel', 'Artikel dari admin web akan muncul di sini.');
      return;
    }

    grid.innerHTML = articles.map(function (article, index) {
      const excerpt = String(article.isi_artikel || '').split('\n')[0].slice(0, 160);
      return '' +
        '<article class="article-card reveal">' +
          '<div class="article-card__visual ' + articleVisualClass(index) + '">' +
            '<span class="article-card__pattern" aria-hidden="true"></span>' +
            '<span class="icon-tile" aria-hidden="true">' + TB.ui.icon(articleIcon(index), '', 22) + '</span>' +
          '</div>' +
          '<div class="article-card__body">' +
            '<div class="article-card__meta"><span>Artikel</span><span class="dot"></span><span>' + TB.utils.escapeHTML(TB.utils.formatRelative(article.tanggal)) + '</span></div>' +
            '<h3>' + TB.utils.escapeHTML(article.judul_artikel) + '</h3>' +
            '<p class="article-card__excerpt">' + TB.utils.escapeHTML(excerpt) + '…</p>' +
            '<button class="article-card__link" type="button" data-article="' + article.id_artikel + '">Baca artikel ' + TB.ui.icon('arrowRight', '', 15) + '</button>' +
          '</div>' +
        '</article>';
    }).join('');

    grid.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-article]');
      if (!trigger) return;
      openArticle(trigger.dataset.article);
    });

    setupReveal();
  }

  function openArticle(id) {
    const db = TB.store.load();
    const article = db.artikel.find(function (item) { return item.id_artikel === id; });
    if (!article) return;

    const paragraphs = String(article.isi_artikel || '')
      .split(/\n{2,}/)
      .filter(Boolean)
      .map(function (paragraph) { return '<p>' + TB.utils.escapeHTML(paragraph).replace(/\n/g, '<br>') + '</p>'; })
      .join('');

    TB.ui.modal({
      eyebrow: 'Artikel sekolah',
      title: article.judul_artikel,
      subtitle: TB.utils.formatDate(article.tanggal, 'long'),
      size: 'lg',
      content: '<div class="article-detail">' +
        '<div class="article-detail__meta"><span>' + TB.ui.icon('calendar', '', 14) + '</span><span>' + TB.utils.escapeHTML(TB.utils.formatDate(article.tanggal, 'long')) + '</span><span class="dot"></span><span>TumbuhBaik</span></div>' +
        '<p class="article-detail__lead">Ruang kecil untuk belajar memahami anak, bukan sekadar menilai perilakunya.</p>' +
        paragraphs +
        '</div>',
      footer: '<button class="btn btn-ghost" type="button" data-modal-close>Tutup</button>' +
        '<a class="btn btn-brand" href="login.html">Masuk ke dashboard ' + TB.ui.icon('arrowRight', '', 16) + '</a>'
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    hydrateIcons();
    setupNavigation();
    renderArticles();
    setupReveal();
    setupActiveNav();
  });
})();
