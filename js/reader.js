(() => {
  'use strict';

  const TOTAL_PAGES = 34;
  const PAGE_WIDTH = 1241;
  const PAGE_HEIGHT = 1595;
  const SPREAD_GAP = 2;
  const pagePath = (n) => `pages/page-${String(n).padStart(2, '0')}.jpg`;

  const el = {
    openReaderBtn: document.getElementById('openReaderBtn'),
    readerSection: document.getElementById('revista'),
    readerShell: document.getElementById('readerShell'),
    readerCanvas: document.getElementById('readerCanvas'),
    pageStage: document.getElementById('pageStage'),
    leftSlot: document.getElementById('leftSlot'),
    rightSlot: document.getElementById('rightSlot'),
    leftPage: document.getElementById('leftPage'),
    rightPage: document.getElementById('rightPage'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageIndicator: document.getElementById('pageIndicator'),
    thumbsBtn: document.getElementById('thumbsBtn'),
    closeThumbsBtn: document.getElementById('closeThumbsBtn'),
    thumbDrawer: document.getElementById('thumbDrawer'),
    thumbGrid: document.getElementById('thumbGrid'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    fullscreenBtn: document.getElementById('fullscreenBtn')
  };

  let currentPage = 1;
  let touchStartX = null;
  let touchStartY = null;
  let animationTimer = null;

  const isSpread = () => window.matchMedia('(min-width: 901px)').matches;

  function normalizedSpreadPage(page) {
    if (!isSpread() || page === 1) return page;
    return page % 2 === 0 ? page : page - 1;
  }

  function pagesForView() {
    if (!isSpread()) return [currentPage];
    if (currentPage === 1) return [1];
    const left = normalizedSpreadPage(currentPage);
    return left < TOTAL_PAGES ? [left, left + 1] : [left];
  }

  function setImage(img, slot, pageNumber, single = false) {
    if (!pageNumber) {
      slot.hidden = true;
      img.removeAttribute('src');
      img.alt = '';
      return;
    }
    slot.hidden = false;
    slot.classList.toggle('single', single);
    img.src = pagePath(pageNumber);
    img.alt = pageNumber === 1
      ? 'Portada de Conexión Sahuayo'
      : `Página ${pageNumber} de Conexión Sahuayo`;
  }

  function updateIndicator(pages) {
    if (pages.length === 1 && pages[0] === 1) {
      el.pageIndicator.textContent = `Portada · 1 / ${TOTAL_PAGES}`;
    } else if (pages.length === 1) {
      el.pageIndicator.textContent = `${pages[0]} / ${TOTAL_PAGES}`;
    } else {
      el.pageIndicator.textContent = `${pages[0]}–${pages[1]} / ${TOTAL_PAGES}`;
    }
  }

  function updateThumbActive() {
    const visible = pagesForView();
    el.thumbGrid.querySelectorAll('.thumb').forEach((button) => {
      const n = Number(button.dataset.page);
      button.classList.toggle('active', visible.includes(n));
    });
  }

  function prefetchAround() {
    const step = isSpread() ? 2 : 1;
    [currentPage - step, currentPage + step].forEach((n) => {
      if (n >= 1 && n <= TOTAL_PAGES) {
        const img = new Image();
        img.src = pagePath(n);
      }
    });
  }

  function fitStage(pageCount) {
    const canvasStyle = window.getComputedStyle(el.readerCanvas);
    const horizontalPadding = parseFloat(canvasStyle.paddingLeft) + parseFloat(canvasStyle.paddingRight);
    const verticalPadding = parseFloat(canvasStyle.paddingTop) + parseFloat(canvasStyle.paddingBottom);

    const availableWidth = Math.max(1, el.readerCanvas.clientWidth - horizontalPadding);
    const availableHeight = Math.max(1, el.readerCanvas.clientHeight - verticalPadding);

    const naturalWidth = (PAGE_WIDTH * pageCount) + (pageCount > 1 ? SPREAD_GAP : 0);
    const naturalHeight = PAGE_HEIGHT;
    const viewRatio = naturalWidth / naturalHeight;

    let stageWidth = availableWidth;
    let stageHeight = stageWidth / viewRatio;

    if (stageHeight > availableHeight) {
      stageHeight = availableHeight;
      stageWidth = stageHeight * viewRatio;
    }

    el.pageStage.style.width = `${Math.floor(stageWidth)}px`;
    el.pageStage.style.height = `${Math.floor(stageHeight)}px`;
  }

  function render(direction = null) {
    currentPage = Math.max(1, Math.min(TOTAL_PAGES, currentPage));
    if (isSpread()) currentPage = normalizedSpreadPage(currentPage);

    const pages = pagesForView();
    const single = pages.length === 1;

    if (single) {
      setImage(el.leftPage, el.leftSlot, pages[0], true);
      setImage(el.rightPage, el.rightSlot, null);
    } else {
      setImage(el.leftPage, el.leftSlot, pages[0], false);
      setImage(el.rightPage, el.rightSlot, pages[1], false);
    }

    fitStage(pages.length);
    updateIndicator(pages);
    el.prevBtn.disabled = currentPage <= 1;
    el.nextBtn.disabled = pages[pages.length - 1] >= TOTAL_PAGES;
    updateThumbActive();
    prefetchAround();

    if (direction) {
      clearTimeout(animationTimer);
      el.pageStage.classList.remove('turn-next', 'turn-prev');
      void el.pageStage.offsetWidth;
      el.pageStage.classList.add(direction === 'next' ? 'turn-next' : 'turn-prev');
      animationTimer = setTimeout(() => el.pageStage.classList.remove('turn-next', 'turn-prev'), 380);
    }
  }

  function nextPage() {
    const pages = pagesForView();
    if (pages[pages.length - 1] >= TOTAL_PAGES) return;
    if (isSpread()) currentPage = currentPage === 1 ? 2 : currentPage + 2;
    else currentPage += 1;
    render('next');
  }

  function prevPage() {
    if (currentPage <= 1) return;
    if (isSpread()) currentPage = currentPage <= 2 ? 1 : currentPage - 2;
    else currentPage -= 1;
    render('prev');
  }

  function goToPage(n) {
    currentPage = Number(n);
    closeDrawer();
    render();
    el.readerCanvas.focus({ preventScroll: true });
  }

  function openDrawer() {
    el.thumbDrawer.classList.add('open');
    el.drawerBackdrop.classList.add('open');
    el.thumbDrawer.setAttribute('aria-hidden', 'false');
    updateThumbActive();
    const active = el.thumbGrid.querySelector('.thumb.active');
    if (active) active.scrollIntoView({ block: 'center' });
  }

  function closeDrawer() {
    el.thumbDrawer.classList.remove('open');
    el.drawerBackdrop.classList.remove('open');
    el.thumbDrawer.setAttribute('aria-hidden', 'true');
  }

  function buildThumbnails() {
    const frag = document.createDocumentFragment();
    for (let n = 1; n <= TOTAL_PAGES; n += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb';
      button.dataset.page = String(n);
      button.setAttribute('aria-label', n === 1 ? 'Ir a portada' : `Ir a página ${n}`);

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = pagePath(n);
      img.alt = '';

      const label = document.createElement('span');
      label.textContent = n === 1 ? 'Portada' : `Página ${n}`;

      button.append(img, label);
      button.addEventListener('click', () => goToPage(n));
      frag.appendChild(button);
    }
    el.thumbGrid.appendChild(frag);
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await el.readerShell.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {
      // Algunos navegadores móviles no admiten fullscreen en todos los elementos.
    }
  }

  function openReader() {
    el.readerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => el.readerCanvas.focus({ preventScroll: true }), 600);
  }

  el.openReaderBtn.addEventListener('click', openReader);
  el.prevBtn.addEventListener('click', prevPage);
  el.nextBtn.addEventListener('click', nextPage);
  el.pageIndicator.addEventListener('click', openDrawer);
  el.thumbsBtn.addEventListener('click', openDrawer);
  el.closeThumbsBtn.addEventListener('click', closeDrawer);
  el.drawerBackdrop.addEventListener('click', closeDrawer);
  el.fullscreenBtn.addEventListener('click', toggleFullscreen);

  el.readerCanvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      event.preventDefault();
      nextPage();
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      prevPage();
    } else if (event.key === 'Home') {
      event.preventDefault();
      currentPage = 1;
      render();
    } else if (event.key === 'End') {
      event.preventDefault();
      currentPage = TOTAL_PAGES;
      render();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && el.thumbDrawer.classList.contains('open')) closeDrawer();
  });

  el.readerCanvas.addEventListener('touchstart', (event) => {
    const t = event.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  el.readerCanvas.addEventListener('touchend', (event) => {
    if (touchStartX === null || touchStartY === null) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;

    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      dx < 0 ? nextPage() : prevPage();
    }
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => render(), 120);
  });

  document.addEventListener('fullscreenchange', () => {
    window.setTimeout(() => render(), 80);
  });

  buildThumbnails();
  render();
})();

