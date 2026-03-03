// Импортируем функцию для генерации массива книг из отдельного модуля
import { generateBooks } from './scripts/bookGenerator.js'

// Создаем пустой массив
let books = []

// Переменные(сортировка)
let currentSortColumn = '' // Хранит название колонки, по которой сейчас идет сортировка
let isAscending = true // Флаг направления сортировки (по возрастанию или убыванию)

// Получаем ссылки на DOM-элементы, с которыми будем взаимодействовать
const tableBody = document.getElementById('table-body') // Тело таблицы для вставки строк
const countEl = document.getElementById('count') // Элемент для отображения количества книг
const searchInput = document.getElementById('search') // Поле ввода для живого поиска
const form = document.getElementById('book-form') // Форма добавления/редактирования
const clearAllBtn = document.getElementById('clear-all') // Кнопка "Очистить всё"
const tableHeaders = document.querySelectorAll('th[data-sort]') // Заголовки таблицы для сортировки

// Асинхронная функция для загрузки книг из API
async function loadBooks() {
	try {
		// Ожидаем получения 10 книг от генератора и записываем их в глобальный массив
		books = await generateBooks(10)
		// Вызываем функцию отрисовки таблицы, чтобы показать загруженные данные
		render()
	} catch (error) {
		// Если произошла ошибка, выводим её в консоль
		console.error('Ошибка при загрузке книг:', error)
		// Показываем пользователю всплывающее окно с предупреждением
		alert('Не удалось загрузить книги')
	}
}

// Навешиваем обработчик клика на кнопку "Загрузить JSON", который вызывает loadBooks
document.getElementById('reload').addEventListener('click', loadBooks)

// Функция для отображения данных на странице (перерисовка интерфейса)
function render() {
	// Очищаем текущее содержимое таблицы перед новой отрисовкой
	tableBody.innerHTML = ''

	// Получаем текст из поля поиска, переводим в нижний регистр и убираем пробелы по краям
	const query = searchInput.value.toLowerCase().trim()

	// Фильтруем массив книг: оставляем только те, где название или автор содержат строку поиска
	let filtered = books.filter(
		book =>
			book.title.toLowerCase().includes(query) ||
			book.author.toLowerCase().includes(query)
	)

	// Логика сортировки массива
	if (currentSortColumn) {
		// Если выбрана колонка для сортировки, сортируем отфильтрованный массив
		filtered.sort((a, b) => {
			let valA = a[currentSortColumn] // Значение первой книги
			let valB = b[currentSortColumn] // Значение второй книги

			// Обрабатываем пустые значения, чтобы они не ломали сортировку
			if (valA === null || valA === undefined) valA = ''
			if (valB === null || valB === undefined) valB = ''

			// Если значения строковые, приводим к нижнему регистру для корректного сравнения
			if (typeof valA === 'string') valA = valA.toLowerCase()
			if (typeof valB === 'string') valB = valB.toLowerCase()

			// Сравниваем значения с учетом направления сортировки (isAscending)
			if (valA < valB) return isAscending ? -1 : 1
			if (valA > valB) return isAscending ? 1 : -1
			return 0 // Если равны, не меняем порядок
		})
	}

	// Перебираем отфильтрованный (и отсортированный) массив для создания строк таблицы
	filtered.forEach(book => {
		// Создаем новый элемент строки таблицы
		const tr = document.createElement('tr')
		// Записываем уникальный ID книги в data-атрибут строки для дальнейшей работы
		tr.dataset.id = book.id

		// Заполняем строку HTML-кодом с данными книги и кнопками действий
		tr.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.genre || ''}</td>
            <td>${book.year ?? ''}</td>
            <td>${book.rating ?? ''}</td>
            <td>
                <button class="edit">Редактировать</button>
                <button class="delete">Удалить</button>
            </td>
        `
		// Добавляем готовую строку в тело таблицы
		tableBody.appendChild(tr)
	})

	// Обновляем счетчик количества отображаемых книг на странице
	countEl.textContent = filtered.length
}

// Делегирование событий: слушаем клики на всем теле таблицы
tableBody.addEventListener('click', e => {
	// Ищем ближайшую строку (tr), по которой кликнули
	const row = e.target.closest('tr')
	// Если клик был не по строке (например, мимо), прерываем выполнение
	if (!row) return

	// Получаем ID книги из data-атрибута найденной строки
	const id = row.dataset.id

	// Если кликнули по кнопке с классом 'delete'
	if (e.target.classList.contains('delete')) {
		// Запрашиваем подтверждение у пользователя
		if (!confirm('Действительно удалить книгу?')) return

		// Перезаписываем массив books, исключая из него книгу с данным ID
		books = books.filter(book => book.id !== id)
		// Перерисовываем таблицу, чтобы изменения вступили в силу
		render()
	}

	// Если кликнули по кнопке с классом 'edit'
	if (e.target.classList.contains('edit')) {
		// Находим в массиве объект книги по её ID
		const book = books.find(b => b.id === id)
		// Если книга найдена, вызываем функцию заполнения формы её данными
		if (book) fillForm(book)
	}
})

// Функция нормализации данных из формы
function normalizeBook(data) {
	// Возвращаем новый объект на основе данных формы
	return {
		...data, // Копируем все поля
		title: data.title.trim(), // Убираем лишние пробелы в названии
		author: data.author.trim(), // Убираем лишние пробелы в авторе
		genre: data.genre.trim(), // Убираем лишние пробелы в жанре
		// Преобразуем год в число, если он есть, иначе ставим null
		year: data.year ? parseInt(data.year, 10) : null,
		// Преобразуем рейтинг в число с плавающей точкой, иначе null
		rating: data.rating ? parseFloat(data.rating) : null,
	}
}

// Обработка отправки формы
form.addEventListener('submit', e => {
	// Отменяем стандартное поведение формы
	e.preventDefault()

	// Собираем данные из формы с помощью FormData
	const formData = new FormData(form)
	// Преобразуем FormData в обычный JavaScript-объект
	const data = Object.fromEntries(formData)

	// Нормализуем полученные данные
	const bookData = normalizeBook(data)

	// Проверяем, есть ли у данных ID (если есть — это редактирование)
	if (data.id) {
		// Редактирование: ищем книгу в массиве по ID
		const book = books.find(b => b.id === data.id)
		if (book) {
			// Обновляем свойства найденной книги новыми данными из формы
			Object.assign(book, bookData)
		}
	} else {
		// Добавление новой книги
		books.push({
			// Генерируем уникальный ID для новой книги
			id: crypto.randomUUID(),
			// Разворачиваем нормализованные данные в новый объект
			...bookData,
		})
	}

	// Очищаем все поля формы после сохранения
	form.reset()
	// Очищаем поле ID, чтобы следующая отправка была добавлением
	form.querySelector('[name="id"]').value = '' 
	// Перерисовываем таблицу с обновленными данными
	render()
})

// Функция для заполнения формы данными выбранной книги (для редактирования)
function fillForm(book) {
	// Находим каждое поле по атрибуту name и присваиваем ему значение из объекта книги
	form.querySelector('[name="id"]').value = book.id
	form.querySelector('[name="title"]').value = book.title
	form.querySelector('[name="author"]').value = book.author
	// Если жанр, год или рейтинг отсутствуют, подставляем пустую строку
	form.querySelector('[name="genre"]').value = book.genre || ''
	form.querySelector('[name="year"]').value = book.year || ''
	form.querySelector('[name="rating"]').value = book.rating || ''
}

// Поиск в реальном времени: слушаем событие ввода текста в поле поиска
searchInput.addEventListener('input', render)

// Экспорт данных в JSON-файл
document.getElementById('export').addEventListener('click', () => {
	// Преобразуем массив книг в строку формата JSON с отступами (2 пробела)
	const json = JSON.stringify(books, null, 2)
	// Создаем Blob-объект (файл) типа application/json из нашей строки
	const blob = new Blob([json], { type: 'application/json' })
	// Создаем временную ссылку на этот Blob-объект в памяти браузера
	const url = URL.createObjectURL(blob)

	// Создаем невидимый элемент ссылки <a>
	const link = document.createElement('a')
	// Устанавливаем href на наш временный URL
	link.href = url
	// Задаем имя файла, под которым он будет скачан
	link.download = 'books.json'
	// Программно эмулируем клик по ссылке для старта скачивания
	link.click()

	// Удаляем временную ссылку из памяти, чтобы не было утечек
	URL.revokeObjectURL(url)
})

// Очистить всё
clearAllBtn.addEventListener('click', () => {
	// Спрашиваем подтверждение у пользователя
	if (confirm('Вы уверены, что хотите удалить все книги?')) {
		// Очищаем массив (наш источник истины)
		books = []
		// Перерисовываем интерфейс (таблица станет пустой)
		render()
	}
})

// Сортировка по клику на заголовок
tableHeaders.forEach(th => {
	// Навешиваем обработчик клика на каждый заголовок, у которого есть data-sort
	th.addEventListener('click', () => {
		// Получаем имя колонки для сортировки из data-атрибута
		const column = th.dataset.sort

		// Если кликнули по той же колонке, меняем направление сортировки
		if (currentSortColumn === column) {
			isAscending = !isAscending
		} else {
			// Если кликнули по новой колонке, запоминаем её и сортируем по возрастанию
			currentSortColumn = column
			isAscending = true
		}
		// Перерисовываем таблицу с учетом новой сортировки
		render()
	})
})

// Старт приложения: автоматически загружаем книги при открытии страницы
loadBooks();

console.log('Приложение было запущено');