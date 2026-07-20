const API_URL = "http://localhost:8000";

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const taskList = document.querySelector("#task-list");
const statusText = document.querySelector("#status");
const formError = document.querySelector("#form-error");
const refreshButton = document.querySelector("#refresh-button");

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {"Content-Type": "application/json", ...(options.headers || {})},
    ...options,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  return response.status === 204 ? null : response.json();
}

function renderTask(task) {
  const item = document.createElement("li");
  item.className = task.completed ? "task completed" : "task";

  const text = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = task.title;
  const description = document.createElement("p");
  description.textContent = task.description || "Sin descripción";
  text.append(title, description);

  const actions = document.createElement("div");
  actions.className = "actions";

  const toggle = document.createElement("button");
  toggle.textContent = task.completed ? "Reabrir" : "Completar";
  toggle.onclick = async () => {
    await apiRequest(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({completed: !task.completed}),
    });
    await loadTasks();
  };

  const remove = document.createElement("button");
  remove.textContent = "Eliminar";
  remove.onclick = async () => {
    await apiRequest(`/tasks/${task.id}`, {method: "DELETE"});
    await loadTasks();
  };

  actions.append(toggle, remove);
  item.append(text, actions);
  return item;
}

async function loadTasks() {
  statusText.hidden = false;
  statusText.textContent = "Cargando…";
  taskList.replaceChildren();

  try {
    const tasks = await apiRequest("/tasks");
    if (!tasks.length) {
      statusText.textContent = "Todavía no hay tareas.";
      return;
    }
    statusText.hidden = true;
    tasks.forEach(task => taskList.append(renderTask(task)));
  } catch (error) {
    statusText.textContent = `La API no está disponible: ${error.message}`;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;
  try {
    await apiRequest("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
      }),
    });
    form.reset();
    await loadTasks();
  } catch (error) {
    formError.textContent = error.message;
    formError.hidden = false;
  }
});

refreshButton.onclick = loadTasks;
loadTasks();
