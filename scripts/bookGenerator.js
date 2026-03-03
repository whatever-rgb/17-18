const SUBJECTS = [
	'fantasy',
	'science_fiction',
	'romance',
	'history',
	'horror',
	'love',
]

function randomItem(arr) {
	return arr[Math.floor(Math.random() * arr.length)]
}

export async function generateBooks(count = 10) {
	for (let attempt = 0; attempt < 5; attempt++) {
		const subject = randomItem(SUBJECTS)
		const url = `https://openlibrary.org/subjects/${subject}.json?limit=50`

		const response = await fetch(url)
		if (!response.ok) continue

		const data = await response.json()
		if (!data.works || !Array.isArray(data.works)) continue

		const books = data.works
			.filter(b => b.title && b.authors?.length)
			.slice(0, count)
			.map(book => ({
				id: crypto.randomUUID(),
				title: book.title,
				author: book.authors.map(a => a.name).join(', '),
				genre: subject,
				year: book.first_publish_year ?? null,
				rating: +(Math.random() * 2 + 3).toFixed(1),
			}))

		if (books.length > 0) {
			return books
		}
	}

	throw new Error('Не удалось сгенерировать книги')
}
