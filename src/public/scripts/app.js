// public/scripts/app.js - Main frontend logic

// ── GLOBAL STATE ──
const storedRole    = localStorage.getItem('role');
const currentRole   = storedRole === 'admin'
  ? 'contractor'
  : (storedRole === 'user' ? 'constructor' : (storedRole || 'constructor'));
let allUpdates      = [];
let filteredUpdates = [];
let editingId       = null;
let currentTab      = currentRole === 'contractor' ? 'contractor' : 'constructor';

// Page titles for each section
const PAGE_META = {
  dashboard: { title: 'Dashboard',       subtitle: 'Overview of all construction activity' },
  submit:    { title: 'Submit Update',   subtitle: 'Log today\'s site progress' },
  updates:   { title: 'All Updates',     subtitle: 'Browse, search and manage updates' },
  sites:     { title: 'Site Progress',   subtitle: 'Latest progress per construction site' }
};


// ── LOGOUT ──
function logout() {
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  window.location.href = '/login.html';
}


// ── SECTION NAVIGATION ──
function showSection(name) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target section
  document.getElementById('section-' + name).classList.add('active');

  // Mark nav item active
  var navBtns = document.querySelectorAll('.nav-item');
  var idx = { dashboard:0, submit:1, updates:2, sites:3 };
  if (navBtns[idx[name]]) navBtns[idx[name]].classList.add('active');

  // Update topbar title
  var meta = PAGE_META[name];
  document.getElementById('pageTitle').textContent    = meta.title;
  document.getElementById('pageSubtitle').textContent = meta.subtitle;

  // Load data when switching to a section
  if (name === 'updates')   loadUpdates();
  if (name === 'sites')     loadSiteProgress();
  if (name === 'dashboard') loadDashboard();
}


// ── ON PAGE LOAD ──
window.onload = function () {
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
  loadDashboard();

  // Hide contractor tab for constructor role
  if (currentRole !== 'contractor') {
    var contractorTab = document.getElementById('contractorTabBtn');
    if (contractorTab) contractorTab.style.display = 'none';
  }
};


// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════
async function loadDashboard() {
  try {
    var res  = await fetch('/updates');
    var data = await res.json();
    allUpdates = data;

    // ── Stat cards ──
    var totalUpdates = data.length;

    // Count unique site names
    var uniqueSites = new Set(data.map(function(u){ return u.siteName; })).size;

    // Sum all workers
    var totalWorkers = data.reduce(function(sum, u){ return sum + u.numberOfWorkers; }, 0);

    // Average progress
    var avgProgress = totalUpdates > 0
      ? Math.round(data.reduce(function(sum, u){ return sum + u.progressPercentage; }, 0) / totalUpdates)
      : 0;

    document.getElementById('stat-total').textContent   = totalUpdates;
    document.getElementById('stat-sites').textContent   = uniqueSites;
    document.getElementById('stat-workers').textContent = totalWorkers;
    document.getElementById('stat-avg').textContent     = avgProgress + '%';

    // ── Recent updates (last 5) ──
    var recent = data.slice(0, 5);
    if (recent.length === 0) {
      document.getElementById('recentUpdates').innerHTML =
        '<p class="empty-state">No updates yet. Submit your first update!</p>';
      return;
    }

    var html = '<table class="recent-table"><thead><tr>';
    html += '<th>Date</th><th>Site</th><th>Workers</th><th>Progress</th>';
    html += '</tr></thead><tbody>';

    recent.forEach(function(u) {
      html += '<tr>';
      html += '<td>' + u.date + '</td>';
      html += '<td><strong>' + u.siteName + '</strong></td>';
      html += '<td>' + u.numberOfWorkers + '</td>';
      html += '<td>' + progressPill(u.progressPercentage) + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    document.getElementById('recentUpdates').innerHTML = html;

  } catch(e) {
    document.getElementById('recentUpdates').innerHTML =
      '<p class="empty-state">Could not load data. Is the server running?</p>';
  }
}


// ════════════════════════════════════════
// FORM SUBMIT — ADD or EDIT
// Uses FormData (not JSON) so images can be sent
// ════════════════════════════════════════
document.getElementById('updateForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Use FormData instead of JSON because we have a file field
  // FormData automatically includes all form inputs + the file
  var formData = new FormData();
  formData.append('date',               document.getElementById('date').value);
  formData.append('siteName',           document.getElementById('siteName').value.trim());
  formData.append('workDone',           document.getElementById('workDone').value.trim());
  formData.append('numberOfWorkers',    document.getElementById('numberOfWorkers').value);
  formData.append('materialsUsed',      document.getElementById('materialsUsed').value.trim());
  formData.append('progressPercentage', document.getElementById('progressPercentage').value);

  // Add photo file if one was selected
  var photoFile = document.getElementById('photoInput').files[0];
  if (photoFile) formData.append('photo', photoFile);

  // Validate required text fields
  if (!formData.get('siteName') || !formData.get('workDone') || !formData.get('materialsUsed')) {
    showMessage('formMessage', 'Please fill in all required fields!', 'error');
    return;
  }

  try {
    var url    = editingId ? '/update/' + editingId : '/add-update';
    var method = editingId ? 'PUT' : 'POST';

    // NOTE: Do NOT set Content-Type header when sending FormData
    // The browser sets it automatically with the correct boundary
    var response = await fetch(url, { method: method, body: formData });
    var result   = await response.json();

    if (response.ok) {
      showMessage('formMessage', result.message, 'success');
      resetForm();
      loadDashboard(); // Refresh dashboard stats too
    } else {
      showMessage('formMessage', result.message, 'error');
    }

  } catch(err) {
    showMessage('formMessage', 'Could not connect to server.', 'error');
  }
});


// ── Photo preview before upload ──
function previewPhoto(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('previewImg').src = e.target.result;
      document.getElementById('photoPreview').classList.remove('hidden');
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function removePhoto() {
  document.getElementById('photoInput').value = '';
  document.getElementById('photoPreview').classList.add('hidden');
  document.getElementById('previewImg').src = '';
}


// ════════════════════════════════════════
// LOAD ALL UPDATES
// ════════════════════════════════════════
async function loadUpdates() {
  document.getElementById('loadingText').style.display = 'block';
  document.getElementById('updatesContainer').innerHTML = '';

  try {
    var res  = await fetch('/updates');
    allUpdates      = await res.json();
    filteredUpdates = allUpdates.slice();

    document.getElementById('loadingText').style.display = 'none';

    if (allUpdates.length === 0) {
      document.getElementById('updatesContainer').innerHTML =
        '<p class="empty-state">No updates found. Submit your first update!</p>';
      return;
    }
    renderTable();

  } catch(err) {
    document.getElementById('loadingText').textContent = 'Failed to load. Is the server running?';
  }
}


// ── SEARCH & FILTER ──
function applyFilters() {
  var search   = document.getElementById('searchSite').value.toLowerCase().trim();
  var fromDate = document.getElementById('fromDate').value;
  var toDate   = document.getElementById('toDate').value;

  filteredUpdates = allUpdates.filter(function(u) {
    var matchSite = u.siteName.toLowerCase().indexOf(search) !== -1;
    var matchFrom = fromDate ? u.date >= fromDate : true;
    var matchTo   = toDate   ? u.date <= toDate   : true;
    return matchSite && matchFrom && matchTo;
  });

  renderTable();
}

function clearFilters() {
  document.getElementById('searchSite').value = '';
  document.getElementById('fromDate').value   = '';
  document.getElementById('toDate').value     = '';
  filteredUpdates = allUpdates.slice();
  renderTable();
}


// ── RENDER TABLE ──
function renderTable() {
  var container  = document.getElementById('updatesContainer');
  var showDelete = (currentRole === 'contractor' && currentTab === 'contractor');

  if (filteredUpdates.length === 0) {
    container.innerHTML = '<p class="empty-state">No results match your search.</p>';
    return;
  }

  var html = '<table><thead><tr>';
  html += '<th>#</th><th>Date</th><th>Site</th><th>Work Done</th>';
  html += '<th>Workers</th><th>Materials</th><th>Progress</th><th>Photo</th><th>Edit</th>';
  if (showDelete) html += '<th>Delete</th>';
  html += '</tr></thead><tbody>';

  filteredUpdates.forEach(function(u, i) {
    html += '<tr>';
    html += '<td style="color:#9ca3af">' + (i+1) + '</td>';
    html += '<td style="white-space:nowrap">' + u.date + '</td>';
    html += '<td><strong>' + u.siteName + '</strong></td>';
    html += '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + u.workDone + '">' + u.workDone + '</td>';
    html += '<td style="text-align:center">' + u.numberOfWorkers + '</td>';
    html += '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + u.materialsUsed + '</td>';
    html += '<td>' + progressPill(u.progressPercentage) + '</td>';

    // Photo thumbnail — click to open lightbox
    if (u.photoPath) {
      html += '<td><img class="thumb" src="' + u.photoPath + '" alt="photo" onclick="openLightbox(\'' + u.photoPath + '\')"/></td>';
    } else {
      html += '<td><span class="no-photo">—</span></td>';
    }

    html += '<td><button class="btn-edit" onclick="startEdit(\'' + u._id + '\')">✏️ Edit</button></td>';
    if (showDelete) {
      html += '<td><button class="btn btn-danger" onclick="deleteUpdate(\'' + u._id + '\')">🗑️</button></td>';
    }
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}


// ── PROGRESS PILL helper ──
function progressPill(pct) {
  var cls = pct < 30 ? 'low' : pct < 60 ? 'mid' : pct < 100 ? 'high' : 'done';
  return '<span class="progress-pill ' + cls + '">' + pct + '%</span>';
}


// ── EDIT ──
function startEdit(id) {
  var record = allUpdates.find(function(u){ return u._id === id; });
  if (!record) return;

  document.getElementById('date').value               = record.date;
  document.getElementById('siteName').value           = record.siteName;
  document.getElementById('workDone').value           = record.workDone;
  document.getElementById('numberOfWorkers').value    = record.numberOfWorkers;
  document.getElementById('materialsUsed').value      = record.materialsUsed;
  document.getElementById('progressPercentage').value = record.progressPercentage;

  editingId = id;
  document.getElementById('formTitle').textContent = 'Edit Update';
  document.getElementById('submitBtn').textContent = '💾 Save Changes';
  document.getElementById('editBanner').classList.remove('hidden');

  showSection('submit');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() { resetForm(); }

function resetForm() {
  document.getElementById('updateForm').reset();
  removePhoto();
  editingId = null;
  document.getElementById('formTitle').textContent = 'Submit Daily Update';
  document.getElementById('submitBtn').textContent = '✅ Submit Update';
  document.getElementById('editBanner').classList.add('hidden');
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
}


// ── DELETE ──
async function deleteUpdate(id) {
  if (!confirm('Delete this update permanently?')) return;
  try {
    var res    = await fetch('/update/' + id, { method: 'DELETE' });
    var result = await res.json();
    alert(result.message);
    loadUpdates();
    loadDashboard();
  } catch(e) { alert('Could not delete.'); }
}


// ── SWITCH TAB ──
function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  if (filteredUpdates.length > 0) renderTable();
}


// ════════════════════════════════════════
// SITE PROGRESS TRACKER
// Calls GET /site-progress for latest per site
// ════════════════════════════════════════
async function loadSiteProgress() {
  document.getElementById('sitesLoadingText').style.display = 'block';
  document.getElementById('sitesContainer').innerHTML = '';

  try {
    var res   = await fetch('/site-progress');
    var sites = await res.json();

    document.getElementById('sitesLoadingText').style.display = 'none';

    if (sites.length === 0) {
      document.getElementById('sitesContainer').innerHTML =
        '<p class="empty-state">No site data yet.</p>';
      return;
    }

    var html = '<div class="sites-grid">';

    sites.forEach(function(s) {
      var pct  = s.progressPercentage;
      var done = pct >= 100;
      html += '<div class="site-card">';
      html += '<div class="site-card-name">🏗️ ' + s.siteName + '</div>';
      html += '<div class="site-card-date">Last updated: ' + s.date + '</div>';
      html += '<div class="site-card-workers">👷 ' + s.numberOfWorkers + ' workers on last log</div>';
      html += '<div class="site-progress-label"><span>Progress</span><span>' + pct + '%</span></div>';
      html += '<div class="site-progress-bar-wrap">';
      html += '<div class="site-progress-bar-fill ' + (done ? 'done' : '') + '" style="width:' + pct + '%"></div>';
      html += '</div>';
      if (done) html += '<p style="margin-top:8px;font-size:0.78rem;color:#065f46;font-weight:600">✅ Completed</p>';
      html += '</div>';
    });

    html += '</div>';
    document.getElementById('sitesContainer').innerHTML = html;

  } catch(e) {
    document.getElementById('sitesLoadingText').textContent = 'Could not load site data.';
  }
}


// ════════════════════════════════════════
// LIGHTBOX
// ════════════════════════════════════════
function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}


// ════════════════════════════════════════
// PRINT REPORT
// Builds a clean print-only HTML table and triggers browser print
// ════════════════════════════════════════
async function printReport() {
  try {
    var res  = await fetch('/updates');
    var data = await res.json();

    var rows = data.map(function(u, i) {
      return '<tr>' +
        '<td>' + (i+1) + '</td>' +
        '<td>' + u.date + '</td>' +
        '<td>' + u.siteName + '</td>' +
        '<td>' + u.workDone + '</td>' +
        '<td>' + u.numberOfWorkers + '</td>' +
        '<td>' + u.materialsUsed + '</td>' +
        '<td>' + u.progressPercentage + '%</td>' +
      '</tr>';
    }).join('');

    var now = new Date().toLocaleDateString();

    document.getElementById('printArea').innerHTML =
      '<h1>Construction Site Progress Report</h1>' +
      '<p>Generated: ' + now + ' | Total records: ' + data.length + '</p>' +
      '<table>' +
        '<thead><tr><th>#</th><th>Date</th><th>Site</th><th>Work Done</th><th>Workers</th><th>Materials</th><th>Progress</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';

    window.print();

  } catch(e) { alert('Could not generate report.'); }
}


// ── SHOW MESSAGE ──
function showMessage(id, text, type) {
  var el = document.getElementById(id);
  el.textContent = text;
  el.className   = 'message ' + type;
  setTimeout(function(){ el.className = 'message hidden'; }, 4000);
}
