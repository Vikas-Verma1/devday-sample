/* ========================================
   CampusPulse — Application Logic
   ======================================== */

(function () {
  'use strict';

  // -------- DOM References --------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const grid = $('#updates-grid');
  const emptyState = $('#empty-state');
  const searchInput = $('#search-input');
  const feedTitle = $('#feed-title');

  const modalOverlay = $('#modal-overlay');
  const openModalBtn = $('#open-modal-btn');
  const closeModalBtn = $('#modal-close');
  const form = $('#update-form');

  const navBtns = $$('.nav-btn');
  const sortBtns = $$('.sort-btn');

  const statTotal = $('#stat-total');
  const statToday = $('#stat-today');
  const statStudents = $('#stat-students');

  // -------- State --------
  let updates = loadUpdates();
  let activeFilter = 'all';
  let activeSort = 'newest';
  let searchQuery = '';

  // -------- Storage --------
  function loadUpdates() {
    try {
      const raw = localStorage.getItem('campuspulse_updates');
      return raw ? JSON.parse(raw) : getSeedData();
    } catch {
      return getSeedData();
    }
  }

  function saveUpdates() {
    localStorage.setItem('campuspulse_updates', JSON.stringify(updates));
  }

  // -------- Seed Data --------
  function getSeedData() {
    const now = Date.now();
    return [
      {
        id: crypto.randomUUID(),
        name: 'Priya Verma',
        category: 'announcement',
        title: 'Semester Exam Schedule Released',
        body: 'The final semester exam schedule for 2026 has been published on the university portal. All students must check their individual timetables and report any conflicts to the examination cell before October 10th.',
        likes: 12,
        likedByUser: false,
        timestamp: now - 3600000,
      },
      {
        id: crypto.randomUUID(),
        name: 'Rohan Mehta',
        category: 'event',
        title: 'Hackathon 2026 — Registrations Open!',
        body: 'Join the 48-hour coding hackathon happening on Oct 15-16. Prizes worth ₹50,000! Teams of 2–4 members. Register on the events page before Oct 8.',
        likes: 28,
        likedByUser: false,
        timestamp: now - 7200000,
      },
      {
        id: crypto.randomUUID(),
        name: 'Ananya Singh',
        category: 'project',
        title: 'AI Chatbot for Campus Queries',
        body: 'Our team built an AI-powered chatbot that answers common campus queries — hostel info, library hours, exam dates, and more. Check it out and give us feedback!',
        likes: 19,
        likedByUser: false,
        timestamp: now - 18000000,
      },
      {
        id: crypto.randomUUID(),
        name: 'Karthik Nair',
        category: 'general',
        title: 'Lost & Found: Blue Backpack near Canteen',
        body: 'Found a blue backpack with textbooks near the main canteen today afternoon. If it belongs to you, please contact me or visit the student affairs office to claim it.',
        likes: 5,
        likedByUser: false,
        timestamp: now - 43200000,
      },
      {
        id: crypto.randomUUID(),
        name: 'Sneha Gupta',
        category: 'announcement',
        title: 'Library Extended Hours During Exams',
        body: 'The central library will remain open until 11 PM from October 5th to October 25th to support students during the examination period. Wi-Fi and charging stations available.',
        likes: 33,
        likedByUser: false,
        timestamp: now - 86400000,
      },
      {
        id: crypto.randomUUID(),
        name: 'Aditya Joshi',
        category: 'event',
        title: 'Cultural Fest "Utsav" — Volunteer Call',
        body: 'The annual cultural fest is around the corner! We need volunteers for stage management, hospitality, and tech support. Sign up at the student council office by Oct 5.',
        likes: 15,
        likedByUser: false,
        timestamp: now - 100000000,
      },
    ];
  }

  // -------- Rendering --------
  function render() {
    let filtered = [...updates];

    // Filter by category
    if (activeFilter !== 'all') {
      filtered = filtered.filter((u) => u.category === activeFilter);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.title.toLowerCase().includes(q) ||
          u.body.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q)
      );
    }

    // Sort
    if (activeSort === 'newest') {
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else if (activeSort === 'oldest') {
      filtered.sort((a, b) => a.timestamp - b.timestamp);
    } else if (activeSort === 'liked') {
      filtered.sort((a, b) => b.likes - a.likes);
    }

    // Render cards
    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      grid.innerHTML = filtered
        .map((u, i) => cardHTML(u, i))
        .join('');
    }

    updateStats();
    saveUpdates();
  }

  function cardHTML(u, index) {
    const categoryLabels = {
      announcement: '📢 Announcement',
      event: '🎉 Event',
      project: '🚀 Project',
      general: '💬 General',
    };

    const initials = u.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const timeStr = relativeTime(u.timestamp);

    return `
      <article class="update-card" data-category="${u.category}" data-id="${u.id}" style="animation-delay:${index * 0.06}s">
        <div class="card-top">
          <span class="card-badge badge-${u.category}">${categoryLabels[u.category]}</span>
          <span class="card-date">${timeStr}</span>
        </div>
        <h3 class="card-title">${escapeHTML(u.title)}</h3>
        <p class="card-body">${escapeHTML(u.body)}</p>
        <div class="card-footer">
          <div class="card-author">
            <div class="author-avatar">${initials}</div>
            <span class="author-name">${escapeHTML(u.name)}</span>
          </div>
          <div class="card-actions">
            <button class="action-btn like-btn ${u.likedByUser ? 'liked' : ''}" data-id="${u.id}" title="Like">
              ${u.likedByUser ? '❤️' : '🤍'} <span>${u.likes}</span>
            </button>
            <button class="action-btn delete-btn" data-id="${u.id}" title="Delete">🗑️</button>
          </div>
        </div>
      </article>
    `;
  }

  // -------- Stats --------
  function updateStats() {
    statTotal.textContent = updates.length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = updates.filter((u) => u.timestamp >= todayStart.getTime()).length;
    statToday.textContent = todayCount;

    const uniqueNames = new Set(updates.map((u) => u.name.toLowerCase().trim()));
    statStudents.textContent = uniqueNames.size;

    animateCounters();
  }

  function animateCounters() {
    $$('.stat-value').forEach((el) => {
      const target = parseInt(el.textContent, 10);
      if (isNaN(target)) return;
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 20));
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(interval);
        }
        el.textContent = current;
      }, 30);
    });
  }

  // -------- Helpers --------
  function relativeTime(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  // -------- Event Listeners --------

  // Modal open/close
  openModalBtn.addEventListener('click', () => {
    modalOverlay.classList.add('open');
    $('#input-name').focus();
  });

  closeModalBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('open');
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modalOverlay.classList.remove('open');
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#input-name').value.trim();
    const category = $('#input-category').value;
    const title = $('#input-title').value.trim();
    const body = $('#input-body').value.trim();

    if (!name || !category || !title || !body) return;

    const newUpdate = {
      id: crypto.randomUUID(),
      name,
      category,
      title,
      body,
      likes: 0,
      likedByUser: false,
      timestamp: Date.now(),
    };

    updates.unshift(newUpdate);
    form.reset();
    modalOverlay.classList.remove('open');
    render();
    showToast('✅ Update published!');
  });

  // Category filter nav
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      navBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;

      const labels = {
        all: 'All Updates',
        announcement: '📢 Announcements',
        event: '🎉 Events',
        project: '🚀 Projects',
        general: '💬 General',
      };
      feedTitle.textContent = labels[activeFilter];
      render();
    });
  });

  // Sort
  sortBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      sortBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeSort = btn.dataset.sort;
      render();
    });
  });

  // Search
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    render();
  });

  // Like & Delete (event delegation)
  grid.addEventListener('click', (e) => {
    const likeBtn = e.target.closest('.like-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (likeBtn) {
      const id = likeBtn.dataset.id;
      const update = updates.find((u) => u.id === id);
      if (!update) return;
      if (update.likedByUser) {
        update.likes--;
        update.likedByUser = false;
      } else {
        update.likes++;
        update.likedByUser = true;
      }
      render();
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      updates = updates.filter((u) => u.id !== id);
      render();
      showToast('🗑️ Update deleted');
    }
  });

  // -------- Init --------
  render();
})();
