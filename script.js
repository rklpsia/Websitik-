document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const dateInput = document.getElementById('taskDate');
    const taskPriority = document.getElementById('taskPriority');
    const addBtn = document.getElementById('addBtn');
    const tasksContainer = document.getElementById('tasksContainer');
    const filterStatus = document.getElementById('filterStatus');
    const filterPriority = document.getElementById('filterPriority');
    const filterDate = document.getElementById('filterDate');
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const taskCount = document.getElementById('taskCount');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Восстановление задач из localStorage
    renderAllTasks();
    updateProgress();

    // При фокусе меняем на type="date" для выбора даты
    dateInput.addEventListener('focus', () => {
        dateInput.type = 'date';
    });

    // При потере фокуса, если дата не выбрана, возвращаем текст
    dateInput.addEventListener('blur', function() {
        if (!this.value) {
            dateInput.type = 'text';
            dateInput.placeholder = 'Срок выполнения';
        }
    });

    // Добавление новой задачи
    addBtn.addEventListener('click', () => {
        const title = taskInput.value.trim();
        const date = dateInput.value;
        const priority = taskPriority.value;

        if (title) {
            const task = {
                id: Date.now(),
                title,
                date,
                priority,
                completed: false
            };
            tasks.push(task);
            saveTasks();
            renderTask(task, true); // true - новая задача, добавим анимацию
            taskInput.value = '';
            dateInput.value = '';
            dateInput.type = 'text';
            dateInput.placeholder = 'Срок выполнения';
            updateProgress();
        }
    });

    // Фильтрация задач
    filterBtn.addEventListener('click', applyFilters);
    
    // Сброс фильтров
    resetBtn.addEventListener('click', () => {
        filterStatus.value = 'all';
        filterPriority.value = 'all';
        filterDate.value = '';
        renderAllTasks();
        updateProgress();
    });

    // Применение фильтров
    function applyFilters() {
        const statusFilter = filterStatus.value;
        const priorityFilter = filterPriority.value;
        const dateFilter = filterDate.value;
        
        let filteredTasks = tasks;
        
        // Фильтр по статусу
        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => 
                statusFilter === 'completed' ? task.completed : !task.completed
            );
        }
        
        // Фильтр по приоритету
        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => 
                task.priority === priorityFilter
            );
        }
        
        // Фильтр по дате
        if (dateFilter) {
            filteredTasks = filteredTasks.filter(task => 
                task.date === dateFilter
            );
        }
        
        // Очистка контейнера и отображение отфильтрованных задач
        tasksContainer.innerHTML = '';
        filteredTasks.forEach(task => renderTask(task));
        updateProgress(filteredTasks);
    }

    // Отображение всех задач
    function renderAllTasks() {
        tasksContainer.innerHTML = '';
        tasks.forEach(task => renderTask(task));
        updateProgress();
    }

    // Отображение задачи
    function renderTask(task, isNew = false) {
        const taskEl = document.createElement('div');
        taskEl.className = `task ${task.completed ? 'completed' : ''} ${isNew ? 'adding' : ''}`;
        taskEl.dataset.id = task.id;
        
        taskEl.innerHTML = `
            <div class="task-header">
                <input type="checkbox" class="status-checkbox" ${task.completed ? 'checked' : ''}>
                <h3 class="task-title">${task.title}</h3>
            </div>
            <p>Срок: ${task.date || 'Не указан'}</p>
            <p>Приоритет: ${task.priority}</p>
            <p>Статус: ${task.completed ? '✅ Завершено' : '🔄 В процессе'}</p>
            <div class="task-actions">
                <button class="edit-btn">Изменить</button>
                <button class="delete-btn">Удалить</button>
            </div>
        `;
        
        // Если задача уже существует, заменяем ее
        const existingTask = document.querySelector(`.task[data-id="${task.id}"]`);
        if (existingTask) {
            existingTask.classList.add('updating');
            setTimeout(() => {
                existingTask.replaceWith(taskEl);
                setupTaskEventListeners(taskEl, task);
            }, 300);
        } else {
            tasksContainer.appendChild(taskEl);
            setupTaskEventListeners(taskEl, task);
        }
    }

    // Настройка обработчиков событий для задачи
    function setupTaskEventListeners(taskEl, task) {
        // Обработчик для чекбокса статуса
        taskEl.querySelector('.status-checkbox').addEventListener('change', (e) => {
            task.completed = e.target.checked;
            saveTasks();
            taskEl.classList.add('updating');
            setTimeout(() => {
                renderTask(task);
                updateProgress();
            }, 300);
        });

        // Обработчик для кнопки удаления
        taskEl.querySelector('.delete-btn').addEventListener('click', () => {
            taskEl.classList.add('deleting');
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                taskEl.remove();
                updateProgress();
            }, 500);
        });

        // Обработчик для кнопки изменения
        taskEl.querySelector('.edit-btn').addEventListener('click', () => {
            editTask(task, taskEl);
        });
    }

    // Редактирование задачи
    function editTask(task, taskEl) {
        const editForm = document.createElement('div');
        editForm.className = 'edit-form';
        editForm.innerHTML = `
            <input type="text" value="${task.title}" class="edit-title">
            <input type="date" value="${task.date}" class="edit-date">
            <select class="edit-priority">
                <option value="Низкий" ${task.priority === 'Низкий' ? 'selected' : ''}>Низкий</option>
                <option value="Средний" ${task.priority === 'Средний' ? 'selected' : ''}>Средний</option>
                <option value="Высокий" ${task.priority === 'Высокий' ? 'selected' : ''}>Высокий</option>
            </select>
            <button class="save-btn">Сохранить</button>
        `;
        taskEl.innerHTML = '';
        taskEl.appendChild(editForm);

        editForm.querySelector('.save-btn').addEventListener('click', () => {
            const newTitle = editForm.querySelector('.edit-title').value.trim();
            const newDate = editForm.querySelector('.edit-date').value;
            const newPriority = editForm.querySelector('.edit-priority').value;

            if (newTitle) {
                task.title = newTitle;
                task.date = newDate;
                task.priority = newPriority;
                saveTasks();
                taskEl.classList.add('updating');
                setTimeout(() => {
                    renderTask(task);
                    updateProgress();
                }, 300);
            }
        });
    }

    // Обновление прогресса
    function updateProgress(currentTasks = tasks) {
        if (currentTasks.length === 0) {
            progressBar.style.width = '0%';
            progressText.textContent = '0% завершено (0/0)';
            taskCount.textContent = 'Всего задач: 0';
            return;
        }
        
        const completedCount = currentTasks.filter(task => task.completed).length;
        const progress = Math.round((completedCount / currentTasks.length) * 100);
        
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}% завершено (${completedCount}/${currentTasks.length})`;
        taskCount.textContent = `Всего задач: ${tasks.length}`;
    }

    // Сохранение задач в localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
});