// Japan Trip 2026 - Main JavaScript

(function() {
  'use strict';

  // ============================================
  // Mobile Navigation
  // ============================================
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function() {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!menuToggle.contains(e.target) && !siteNav.contains(e.target)) {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ============================================
  // Countdown Timer
  // ============================================
  const countdownEl = document.getElementById('countdown-days');

  if (countdownEl) {
    const tripStart = new Date('2026-07-18T00:00:00');

    function updateCountdown() {
      const now = new Date();
      const diff = tripStart - now;

      if (diff <= 0) {
        // Trip has started or passed
        const tripEnd = new Date('2026-07-30T23:59:59');
        if (now <= tripEnd) {
          // During the trip
          const dayOfTrip = Math.ceil((now - tripStart) / (1000 * 60 * 60 * 24)) + 1;
          countdownEl.textContent = 'Day ' + Math.min(dayOfTrip, 13);
          const labelEl = document.querySelector('.countdown-label');
          if (labelEl) labelEl.textContent = 'of the trip!';
        } else {
          // Trip is over
          countdownEl.textContent = '思い出';
          const labelEl = document.querySelector('.countdown-label');
          if (labelEl) labelEl.textContent = 'Memories made!';
        }
      } else {
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        countdownEl.textContent = days;
      }
    }

    updateCountdown();
    setInterval(updateCountdown, 60000); // Update every minute
  }

  // ============================================
  // Interactive Checklists (localStorage)
  // ============================================
  const checklists = document.querySelectorAll('.checklist');

  checklists.forEach(function(checklist) {
    const listId = checklist.dataset.listId || 'default';
    const storageKey = 'japan-trip-checklist-' + listId;

    // Load saved state
    let savedState = {};
    try {
      savedState = JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (e) {
      savedState = {};
    }

    const checkboxes = checklist.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(function(checkbox) {
      const itemId = checkbox.id || checkbox.value;

      // Restore saved state
      if (savedState[itemId]) {
        checkbox.checked = true;
        checkbox.closest('.checklist-item').classList.add('checked');
      }

      // Save on change
      checkbox.addEventListener('change', function() {
        savedState[itemId] = checkbox.checked;
        localStorage.setItem(storageKey, JSON.stringify(savedState));

        if (checkbox.checked) {
          checkbox.closest('.checklist-item').classList.add('checked');
        } else {
          checkbox.closest('.checklist-item').classList.remove('checked');
        }

        updateChecklistProgress(checklist);
      });
    });

    // Initial progress update
    updateChecklistProgress(checklist);
  });

  function updateChecklistProgress(checklist) {
    const total = checklist.querySelectorAll('input[type="checkbox"]').length;
    const checked = checklist.querySelectorAll('input[type="checkbox"]:checked').length;
    const progressEl = checklist.querySelector('.checklist-progress');

    if (progressEl) {
      progressEl.textContent = checked + ' / ' + total + ' complete';
      if (checked === total && total > 0) {
        progressEl.classList.add('complete');
      } else {
        progressEl.classList.remove('complete');
      }
    }
  }

  // ============================================
  // Copy to Clipboard (for Japanese text)
  // ============================================
  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const text = btn.dataset.copy || btn.previousElementSibling.textContent;

      navigator.clipboard.writeText(text).then(function() {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.disabled = true;

        setTimeout(function() {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 1500);
      });
    });
  });

  // ============================================
  // Offline Detection
  // ============================================
  function updateOnlineStatus() {
    if (navigator.onLine) {
      document.body.classList.remove('offline');
    } else {
      document.body.classList.add('offline');
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // ============================================
  // Service Worker Registration
  // ============================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('SW registered:', registration.scope);
        })
        .catch(function(error) {
          console.log('SW registration failed:', error);
        });
    });
  }

  // ============================================
  // Smooth scroll for anchor links
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ============================================
  // Gallery Lightbox
  // ============================================
  (function initGallery() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const stage = document.getElementById('lightbox-stage');
    const thumbs = Array.from(document.querySelectorAll('.gallery-thumb'));
    if (!thumbs.length) return;

    // Group thumbs by day so prev/next stays within a day.
    const byDay = {};
    thumbs.forEach(function(t) {
      const d = t.dataset.day;
      (byDay[d] = byDay[d] || []).push(t);
    });

    let currentDay = null;
    let currentIndex = 0;

    function render(thumb) {
      stage.innerHTML = '';
      const type = thumb.dataset.type;
      const src = thumb.dataset.full;
      if (type === 'video') {
        const v = document.createElement('video');
        v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
        stage.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.src = src; img.alt = thumb.querySelector('img').alt;
        stage.appendChild(img);
      }
    }

    function open(thumb) {
      currentDay = thumb.dataset.day;
      currentIndex = byDay[currentDay].indexOf(thumb);
      render(thumb);
      lightbox.hidden = false;
      document.body.classList.add('lightbox-open');
    }

    function close() {
      lightbox.hidden = true;
      stage.innerHTML = '';
      document.body.classList.remove('lightbox-open');
    }

    function step(delta) {
      const group = byDay[currentDay];
      currentIndex = (currentIndex + delta + group.length) % group.length;
      render(group[currentIndex]);
    }

    thumbs.forEach(function(t) {
      t.addEventListener('click', function() { open(t); });
    });
    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', function() { step(-1); });
    lightbox.querySelector('.lightbox-next').addEventListener('click', function() { step(1); });
    lightbox.addEventListener('click', function(e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function(e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  })();

})();
