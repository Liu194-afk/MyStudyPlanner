/* MyStudyPlanner - tasks.js
 * Handles the login gate, task add/edit/delete, validation and the
 * delete confirmation dialog. Everything stays in the browser: tasks go
 * in localStorage (per user), the login flag goes in sessionStorage so
 * the workspace locks itself again when the tab closes.
 * Demo account: student / info1012 (hard-coded on purpose, see ethics page)
 */
(function () {
  'use strict';

  var CREDENTIALS = [{ username: 'student', password: 'info1012' }];
  var SESSION_KEY = 'msp-session';
  var TASK_KEY_PREFIX = 'msp-tasks-';

  // ---------- element handles ----------
  var loginView = document.getElementById('login-view');
  var workspaceView = document.getElementById('workspace-view');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var logoutBtn = document.getElementById('logout-btn');
  var workspaceUser = document.getElementById('workspace-user');

  var taskForm = document.getElementById('task-form');
  var taskFormHeading = document.getElementById('task-form-heading');
  var submitBtn = document.getElementById('task-submit');
  var cancelBtn = document.getElementById('task-cancel');
  var tbody = document.getElementById('task-tbody');
  var table = document.getElementById('task-table');
  var emptyMsg = document.getElementById('task-empty');

  var modal = document.getElementById('confirm-modal');
  var confirmText = document.getElementById('confirm-text');
  var confirmYes = document.getElementById('confirm-yes');
  var confirmNo = document.getElementById('confirm-no');

  var fields = {
    id: document.getElementById('task-id'),
    title: document.getElementById('task-title'),
    code: document.getElementById('task-code'),
    course: document.getElementById('task-course'),
    due: document.getElementById('task-due'),
    desc: document.getElementById('task-desc'),
    notes: document.getElementById('task-notes')
  };
  var errors = {
    title: document.getElementById('error-title'),
    code: document.getElementById('error-code'),
    course: document.getElementById('error-course'),
    due: document.getElementById('error-due'),
    desc: document.getElementById('error-desc')
  };

  var pendingDeleteId = null;

  // ---------- session ----------
  function currentUser() {
    return sessionStorage.getItem(SESSION_KEY);
  }

  function showView() {
    var user = currentUser();
    if (user) {
      loginView.hidden = true;
      workspaceView.hidden = false;
      workspaceUser.textContent = 'Logged in as ' + user + ' · ';
      renderTasks();
    } else {
      loginView.hidden = false;
      workspaceView.hidden = true;
    }
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var u = document.getElementById('login-username').value.trim();
    var p = document.getElementById('login-password').value;
    var ok = CREDENTIALS.some(function (c) { return c.username === u && c.password === p; });
    if (ok) {
      loginError.hidden = true;
      sessionStorage.setItem(SESSION_KEY, u);
      loginForm.reset();
      showView();
    } else {
      loginError.textContent = 'Login failed: wrong username or password. Please try again.';
      loginError.hidden = false;
    }
  });

  logoutBtn.addEventListener('click', function () {
    sessionStorage.removeItem(SESSION_KEY);
    showView();
  });

  // ---------- storage ----------
  function taskKey() {
    return TASK_KEY_PREFIX + currentUser();
  }

  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem(taskKey())) || [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(taskKey(), JSON.stringify(tasks));
  }

  // ---------- validation ----------
  function showError(key, message) {
    errors[key].textContent = message;
    errors[key].hidden = false;
    fields[key].setAttribute('aria-invalid', 'true');
  }

  function clearErrors() {
    Object.keys(errors).forEach(function (key) {
      errors[key].hidden = true;
      errors[key].textContent = '';
      fields[key].removeAttribute('aria-invalid');
    });
  }

  function validate(data) {
    clearErrors();
    var ok = true;

    if (!data.title) { showError('title', 'Title is required.'); ok = false; }
    if (!data.code) { showError('code', 'Course code is required.'); ok = false; }
    else if (!/^[A-Za-z]{2,6}\s?\d{3,4}$/.test(data.code)) {
      showError('code', 'Course code should look like INFO1012 (letters followed by numbers).');
      ok = false;
    }
    if (!data.course) { showError('course', 'Course name is required.'); ok = false; }
    if (!data.desc) { showError('desc', 'Description is required.'); ok = false; }

    if (!data.due) {
      showError('due', 'Due date is required.');
      ok = false;
    } else {
      var parsed = new Date(data.due + 'T00:00:00');
      if (isNaN(parsed.getTime())) {
        showError('due', 'That is not a valid calendar date.');
        ok = false;
      } else {
        // blog bug 1: a past date parses fine but makes no sense, so compare
        // with today (both at 00:00, so a task due later today still passes)
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsed < today) {
          showError('due', 'Due date cannot be in the past.');
          ok = false;
        }
      }
    }
    return ok;
  }

  // ---------- CRUD ----------
  taskForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {
      title: fields.title.value.trim(),
      code: fields.code.value.trim(),
      course: fields.course.value.trim(),
      due: fields.due.value,
      desc: fields.desc.value.trim(),
      notes: fields.notes.value.trim()
    };
    if (!validate(data)) return;

    var tasks = loadTasks();
    if (fields.id.value) {
      var i = tasks.findIndex(function (t) { return t.id === fields.id.value; });
      if (i !== -1) {
        data.id = fields.id.value;
        tasks[i] = data;
      }
    } else {
      data.id = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      tasks.push(data);
    }
    saveTasks(tasks);
    resetForm();
    renderTasks();
  });

  cancelBtn.addEventListener('click', resetForm);

  function resetForm() {
    taskForm.reset();
    fields.id.value = '';
    taskFormHeading.textContent = 'Add a new task';
    submitBtn.textContent = 'Add task';
    cancelBtn.hidden = true;
    clearErrors();
  }

  function startEdit(id) {
    var task = loadTasks().find(function (t) { return t.id === id; });
    if (!task) return;
    fields.id.value = task.id;
    fields.title.value = task.title;
    fields.code.value = task.code;
    fields.course.value = task.course;
    fields.due.value = task.due;
    fields.desc.value = task.desc;
    fields.notes.value = task.notes;
    taskFormHeading.textContent = 'Update task';
    submitBtn.textContent = 'Save changes';
    cancelBtn.hidden = false;
    clearErrors();
    fields.title.focus();
  }

  // ---------- delete with custom confirmation modal ----------
  function askDelete(id) {
    var task = loadTasks().find(function (t) { return t.id === id; });
    if (!task) return;
    pendingDeleteId = id;
    confirmText.textContent = 'Delete "' + task.title + '" (' + task.code + ')? This action cannot be undone.';
    modal.hidden = false;
    confirmNo.focus();
  }

  function closeModal() {
    modal.hidden = true;
    pendingDeleteId = null;
  }

  confirmYes.addEventListener('click', function () {
    if (pendingDeleteId) {
      saveTasks(loadTasks().filter(function (t) { return t.id !== pendingDeleteId; }));
      renderTasks();
    }
    closeModal();
  });
  confirmNo.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  // ---------- rendering ----------
  function renderTasks() {
    var tasks = loadTasks().slice().sort(function (a, b) {
      return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
    });
    tbody.innerHTML = '';
    var has = tasks.length > 0;
    table.hidden = !has;
    emptyMsg.hidden = has;

    tasks.forEach(function (t) {
      var tr = document.createElement('tr');
      appendCell(tr, t.title);
      appendCell(tr, t.code + ' — ' + t.course);
      appendCell(tr, t.due);
      appendCell(tr, t.desc);
      appendCell(tr, t.notes || '—');

      var actions = document.createElement('td');
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-small';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', function () { startEdit(t.id); });

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-small btn-danger';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', function () { askDelete(t.id); });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      tr.appendChild(actions);
      tbody.appendChild(tr);
    });
  }

  function appendCell(tr, text) {
    var td = document.createElement('td');
    td.textContent = text;
    tr.appendChild(td);
  }

  // ---------- init ----------
  showView();
})();
