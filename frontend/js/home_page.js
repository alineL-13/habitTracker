const API_URL =
    window.location.hostname
    === "localhost"

        ? "http://localhost:3000"

        : "https://habittracker-6e80.onrender.com";

const DOM = {
  weekCalendar: document.getElementById("calendario-semanal"),
  monthCalendar: document.getElementById("calendario-mensal"),
  managePage: document.getElementById("manage-page"),
  progressBar: document.getElementById("barra-progresso-total"),
  progressFill: document.getElementById("barra-progresso-andamento"),
  completenessText: document.getElementById("completude-porcentagem-texto"),
  infoData: document.getElementById("informacoes_data"),
  btnWeek: document.getElementById("opcoes-week"),
  btnMonth: document.getElementById("opcoes-month"),
  btnManage: document.getElementById("opcoes-manage"),
  currentDateText: document.getElementById("data-atual"),
  dataGoal: document.getElementById("data-goal"),
  weekTable: document.getElementById("tabela-semanal"),
  monthTable: document.getElementById("tabela-mensal"),
  username_text: document.getElementById("username_text"),
  logout_text: document.getElementById("button_logout"),
};

var AppState = {
  currentTab: "week",
  currentDate: new Date(),
  offset: 0,
  weekDates: [],
  monthDates: [],
};

var Habits = [];
var HabitEntries = [];

function getToken() {
  return localStorage.getItem("token");
}

function getAuthHeaders(contentType = false) {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function fetchJson(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function reloadDB() {
  const [habits, habitEntries] = await Promise.all([
    getHabits(),
    getHabitEntries(),
  ]);
  Habits = habits;
  HabitEntries = habitEntries;
  console.log(HabitEntries);
}

// ==================== FUNÇÕES DE LOGIN, AUTH E LOGOUT ====================

async function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "./index.html";
    return;
  }
  try {
    const response = await fetch(`${API_URL}/auth/checkLoggedUser`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      localStorage.removeItem("token"); //evita token falso
      window.location.href = "./index.html";
      return;
    }
    const data = await response.json();
    return data.username;
  } catch (error) {
    alert(error);
    window.location.href = "./index.html";
  }
}

DOM.logout_text.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "./index.html";
});

// ==================== FUNÇÕES DE CONEXÃO COM BD ====================
async function getHabits() {
  try {
    const data = await fetchJson("/habits", {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return data.habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      color: habit.color,
      createdAt: habit.created_at?.split("T")[0],
    }));
  } catch (error) {
    alert(error.message || error);
    return [];
  }
}

async function getHabitEntries() {
  try {
    const data = await fetchJson("/habit_entries", {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return data.habitEntries.map((entry) => {
      // normalize date to YYYY-MM-DD to avoid timezone/format mismatches
      const rawDate = entry.date;
      const dateOnly =
        rawDate && typeof rawDate === "string" && rawDate.includes("T")
          ? rawDate.split("T")[0]
          : rawDate;

      return {
        id: entry.id,
        habitId: entry.habit_id,
        date: dateOnly,
      };
    });
  } catch (error) {
    alert(error.message || error);
    return [];
  }
}

async function createHabit(name = "New Habit", color = "#000000") {
  const data = await fetchJson("/habits", {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ name, color }),
  });

  return {
    id: data.habit.id,
    name: data.habit.name,
    color: data.habit.color,
    createdAt: data.habit.created_at?.split("T")[0],
  };
}

async function updateHabitEntryFields(habitId, updates) {
  const habit = Habits.find((item) => item.id === habitId);
  if (!habit) {
    throw new Error("Habit not found");
  }

  const updatedData = {
    name: updates.name ?? habit.name,
    color: updates.color ?? habit.color,
  };

  const data = await fetchJson(`/habits/${habitId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(updatedData),
  });

  return {
    id: data.habit.id,
    name: data.habit.name,
    color: data.habit.color,
    createdAt: data.habit.created_at?.split("T")[0],
  };
}

async function deleteHabitById(habitId) {
  await fetchJson(`/habits/${habitId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

async function createNewHabit() {
  try {
    await createHabit();
    await reloadDB();
    await updateUI();
  } catch (error) {
    alert(error.message || error);
  }
}

async function saveHabitField(habitId, field, value) {
  try {
    if (field === "name" && value.trim().length === 0) {
      alert("Habit name cannot be empty.");
      await updateUI();
      return;
    }

    await updateHabitEntryFields(habitId, { [field]: value });
    await reloadDB();
    await updateUI();
  } catch (error) {
    alert(error.message || error);
  }
}

async function removeHabit(habitId) {
  try {
    if (!confirm("Deseja excluir este hábito?")) {
      return;
    }
    await deleteHabitById(habitId);
    await reloadDB();
    await updateUI();
  } catch (error) {
    alert(error.message || error);
  }
}

// ==================== FUNÇÕES DE CÁLCULO ====================

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return new Date(year, month - 1, day);
}

function getWeekDates(goalDate) {
  let date = new Date(goalDate);
  let currentDay = date.getDay();
  date.setDate(date.getDate() - currentDay);
  let weekDates = [];

  for (let i = 0; i < 7; i++) {
    let weekDate = new Date(date);
    weekDate.setDate(date.getDate() + i);
    weekDates.push(weekDate.toISOString().split("T")[0]);
  }
  return weekDates;
}

function getMonthDates(goalDate) {
  let date = new Date(goalDate);
  let year = date.getFullYear();
  let month = date.getMonth();
  let lastDay = new Date(year, month + 1, 0).getDate();
  let monthDates = [];

  for (let i = 1; i <= lastDay; i++) {
    let monthDate = new Date(year, month, i);
    monthDates.push(monthDate.toISOString().split("T")[0]);
  }
  return monthDates;
}

function isHabitCompletedOnDate(habitId, date) {
  return HabitEntries.some(
    (entry) => entry.habitId === habitId && entry.date === date,
  );
}

function calculateCompleteness() {
  const currentDates =
    AppState.currentTab === "week" ? AppState.weekDates : AppState.monthDates;

  const completions = HabitEntries.filter((entry) =>
    currentDates.includes(entry.date),
  );

  const totalPossibleCompletions = Habits.length * currentDates.length;
  const completeness =
    totalPossibleCompletions > 0
      ? (completions.length / totalPossibleCompletions) * 100
      : 0;

  return completeness;
}

function calculateHabitsStats(habit) {
  const completions = HabitEntries.filter(
    (entry) => entry.habitId === habit.id,
  );

  const completedCount = completions.length;
  const startDate = parseLocalDate(habit.createdAt);
  const today = new Date();
  const diffMs = today - startDate; //diferença em milissegundos
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const percentagem = totalDays > 0 ? (completedCount / totalDays) * 100 : 0;

  return { completedCount, totalDays, percentagem };
}

function getCurrentDateRange() {
  if (AppState.currentTab === "week") {
    const startDate = parseLocalDate(AppState.weekDates[0]);
    const endDate = parseLocalDate(AppState.weekDates[6]);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  } else {
    const startDate = parseLocalDate(AppState.monthDates[0]);
    const endDate = parseLocalDate(
      AppState.monthDates[AppState.monthDates.length - 1],
    );
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }
}

function getHabitCompletenessForPeriod(habitId, dates) {
  let completedCount = 0;
  dates.forEach((date) => {
    if (isHabitCompletedOnDate(habitId, date)) completedCount++;
  });
  return { completedCount, total: dates.length };
}

async function toggleHabitEntry(habitId, date) {
  try {
    const existingEntry = HabitEntries.find(
      (entry) => entry.habitId === habitId && entry.date === date,
    );

    if (existingEntry) {
      await fetchJson(`/habit_entries/${existingEntry.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    } else {
      await fetchJson("/habit_entries", {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          habit_id: habitId,
          date,
        }),
      });
    }

    await reloadDB();
    updateUI();
  } catch (error) {
    console.error(error);
    alert(error.message || error);
  }
}

// ==================== FUNÇÕES DE RENDER ====================

function renderWeekTable() {
  let html = `
        <table id="tabela-semanal">
            <thead>
                <tr>
                    <th class="col-habito"></th>
                    <th>Sun</th><th>Mon</th><th>Tue</th>
                    <th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                    <th class="col-completude"></th>
                </tr>
            </thead>
            <tbody>
    `;

  Habits.forEach((habit) => {
    const { completedCount, total } = getHabitCompletenessForPeriod(
      habit.id,
      AppState.weekDates,
    );

    html += `
            <tr style="--habit-color: ${habit.color};">
                <td class="col-habito">${habit.name}</td>
        `;

    AppState.weekDates.forEach((date) => {
      const done = isHabitCompletedOnDate(habit.id, date);
      html += `
                <td>
                    <div class="status_dia_semanal ${done ? "done" : ""}" onclick="toggleHabitEntry(${habit.id}, '${date}')"></div>
                </td>
            `;
    });

    html += `
                <td class="col-completude">${completedCount} / ${total}</td>
            </tr>
        `;
  });

  html += `</tbody></table>`;
  DOM.weekTable.innerHTML = html;
}

function renderMonthTable() {
  let html = `
        <table id="tabela-mensal">
            <thead>
                <tr>
                    <th class="col-habito"></th>
    `;

  AppState.monthDates.forEach((date) => {
    let day = parseLocalDate(date).getDate();
    html += `<th>${day}</th>`;
  });

  html += `</tr></thead><tbody>`;

  Habits.forEach((habit) => {
    html += `
            <tr style="--habit-color: ${habit.color};">
                <td class="col-habito">
                    <div class="habito_mensal"></div>
                </td>
        `;

    AppState.monthDates.forEach((date) => {
      let done = isHabitCompletedOnDate(habit.id, date);
      html += `
                <td>
                    <div class="status_dia_mensal ${done ? "done" : ""}" onclick="toggleHabitEntry(${habit.id}, '${date}')"></div>
                </td>
            `;
    });

    html += `</tr>`;
  });

  html += `</tbody></table>`;
  DOM.monthTable.innerHTML = html;
}

function renderAsideManage() {
  const listaAtividades = document.getElementById("lista-atividades-aside");
  let html = ``;
  Habits.forEach((habit) => {
    const done = isHabitCompletedOnDate(
      habit.id,
      AppState.currentDate.toISOString().split("T")[0],
    );
    html += `
            <li>
                <div class="atividade ${done ? "done" : ""}" style="--habit-color: ${habit.color};">
                    <div class="atividade_info">
                        <h3>${habit.name}</h3>
                        <i class="fa-regular fa-pen-to-square" onclick="switchTab('manage')"></i>
                    </div>
        `;
    if (done) {
      html += `
                     <div class="atividade_feito">
                        <p><i class="fa-solid fa-check"></i> Done</p>
                        <button onClick="toggleHabitEntry(${habit.id}, '${AppState.currentDate.toISOString().split("T")[0]}')"><i>undo</i></button>
                    </div>
            `;
    } else {
      html += `
                    <div class="atividade_acao">
                        <button class="btn_acao_atividade" onClick="toggleHabitEntry(${habit.id}, '${AppState.currentDate.toISOString().split("T")[0]}')">Done</button>
                    </div>
                </div>
            `;
    }
    html += `</li>`;
  });
  listaAtividades.innerHTML = html;
}

function renderManagePage() {
  const listaHabits = document.getElementById("lista-habits-page");

  listaHabits.innerHTML = `
    <li>
        <div class="habit_card_new">
            <button class="add_habit" onclick="createNewHabit()"><i class="fa-solid fa-plus"></i></button>
        </div>
    </li>
    `;

  Habits.forEach((habit) => {
    const li = document.createElement("li");
    const card = document.createElement("div");
    const stats = calculateHabitsStats(habit);
    card.classList.add("habit_card");
    card.style.setProperty("--habit-color", habit.color);
    card.innerHTML = `
        <input
            class="habit_name"
            type="text"
            value="${habit.name}"
            onchange="saveHabitField(${habit.id}, 'name', this.value)"
        >

        <input
            class="habit_color"
            type="color"
            value="${habit.color}"
            onchange="saveHabitField(${habit.id}, 'color', this.value)"
        >

        <div class="habit_delete" onclick="removeHabit(${habit.id})">
            <i class="fa-solid fa-trash"></i>
        </div>

        <p>Start: ${parseLocalDate(habit.createdAt).toLocaleDateString()}</p>

        <p>${stats.completedCount}/${stats.totalDays}, ${Math.round(stats.percentagem)}%</p>
    `;
    li.appendChild(card);
    listaHabits.appendChild(li);
  });
}

function renderCurrentTab() {
  switch (AppState.currentTab) {
    case "week":
      renderWeekTable();
      break;
    case "month":
      renderMonthTable();
      break;
    case "manage":
      renderManagePage();
      break;
  }
}

async function updateUI() {
  DOM.dataGoal.textContent = getCurrentDateRange();

  DOM.currentDateText.textContent = AppState.currentDate.toLocaleDateString();

  const completeness = calculateCompleteness();
  DOM.progressFill.style.width = `${completeness}%`;
  DOM.completenessText.textContent = `${Math.round(completeness)}%`;

  renderCurrentTab();
  renderAsideManage();
}

// ==================== FUNÇÕES DE NAVEGAÇÃO ====================

function updateDatesByOffset() {
  const goalDate = new Date(AppState.currentDate);

  if (AppState.currentTab === "week") {
    goalDate.setDate(AppState.currentDate.getDate() + AppState.offset * 7);
    AppState.weekDates = getWeekDates(goalDate);
  } else if (AppState.currentTab === "month") {
    goalDate.setMonth(AppState.currentDate.getMonth() + AppState.offset);
    AppState.monthDates = getMonthDates(goalDate);
  }
}

function navigate(frente) {
  frente ? AppState.offset++ : AppState.offset--;
  updateDatesByOffset();
  updateUI();
}

function switchTab(tab) {
  if (tab === AppState.currentTab) return;

  AppState.currentTab = tab;
  AppState.offset = 0;

  DOM.weekCalendar.style.display = tab === "week" ? "block" : "none";
  DOM.monthCalendar.style.display = tab === "month" ? "block" : "none";
  DOM.managePage.style.display = tab === "manage" ? "block" : "none";

  DOM.btnWeek.classList.toggle("selected", tab === "week");
  DOM.btnMonth.classList.toggle("selected", tab === "month");
  DOM.btnManage.classList.toggle("selected", tab === "manage");

  const showProgress = tab !== "manage";
  DOM.progressBar.style.display = showProgress ? "block" : "none";
  DOM.infoData.style.display = showProgress ? "flex" : "none";
  DOM.completenessText.style.display = showProgress ? "block" : "none";

  updateDatesByOffset();
  updateUI();
}

// ==================== INICIALIZAÇÃO ====================

async function init() {
  await reloadDB();
  const username = await checkAuth();

  if (username) {
    DOM.username_text.textContent = `${username}`;
  }

  AppState.weekDates = getWeekDates(AppState.currentDate);
  AppState.monthDates = getMonthDates(AppState.currentDate);

  DOM.weekCalendar.style.display = "block";
  DOM.monthCalendar.style.display = "none";
  DOM.managePage.style.display = "none";

  await updateUI();
}

init();
