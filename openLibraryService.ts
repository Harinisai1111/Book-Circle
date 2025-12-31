import { Book } from './types';

export const searchBooks = async (query: string): Promise<Book[]> => {
  if (!query || query.length < 3) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=15&printType=books`;

    const response = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Google Books API error: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = await response.json();

    if (!data || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: any) => {
      const volumeInfo = item.volumeInfo;
      return {
        key: item.id,
        title: volumeInfo.title,
        author_name: volumeInfo.authors || [],
        first_publish_year: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate.split('-')[0]) : undefined,
        cover_url: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || null,
        subjects: volumeInfo.categories || [],
        description: volumeInfo.description
      } as Book;
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("Google Books Search timed out");
    } else {
      console.error("Google Books Search Error:", error);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getBookDetails = async (key: string): Promise<Book | null> => {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${key}`);
    const data = await response.json();
    const volumeInfo = data.volumeInfo;
    return {
      key: data.id,
      title: volumeInfo.title,
      author_name: volumeInfo.authors || [],
      cover_url: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || null,
      description: volumeInfo.description,
      subjects: volumeInfo.categories || [],
    } as Book;
  } catch (error) {
    return null;
  }
};
