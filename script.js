document.addEventListener('DOMContentLoaded', () => {
    const newsGridContainer = document.getElementById('news-grid-container');
    const loadMoreButton = document.querySelector('.news-more .button');
    let loadedNewsCount = 0;
    const newsPerPage = 5;
    
    // RSS feed sources
    const rssSources = [
        'https://habr.com/ru/rss/hub/artificial_intelligence/all/',
        'https://habr.com/ru/rss/hub/machine_learning/all/',
        'https://habr.com/ru/rss/hub/neural_networks/all/',
	'https://morss.it/:proxy:items=%7C%7C*[class=uho__link]/https://www.kommersant.ru/theme/2912'
    ];

    const createProxyUrl = (url) => {
        return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    };

    const extractImageFromContent = (content) => {
        const div = document.createElement('div');
        div.innerHTML = content;
        
        // Try to find image in content
        const img = div.querySelector('img');
        if (img && img.src) {
            return img.src;
        }
        
        // Try to find image in media:content
        const mediaContent = div.querySelector('media\\:content, content');
        if (mediaContent && mediaContent.getAttribute('url')) {
            return mediaContent.getAttribute('url');
        }
        
        return null;
    };

    const cleanHTML = (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // Remove scripts, iframes, and images (we handle images separately)
        const elementsToRemove = ['script', 'iframe', 'img'];
        elementsToRemove.forEach(tag => {
            const elements = div.getElementsByTagName(tag);
            while (elements.length) elements[0].parentNode.removeChild(elements[0]);
        });
        
        return div.textContent || div.innerText || '';
    };

    const truncateText = (text, maxWords) => {
        const words = text.split(/\s+/);
        if (words.length > maxWords) {
            return words.slice(0, maxWords).join(' ') + '...';
        }
        return text;
    };

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    async function fetchRSSFeed(url) {
        try {
            const proxyUrl = createProxyUrl(url);
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            return Array.from(xmlDoc.querySelectorAll('item')).map(item => ({
                title: item.querySelector('title')?.textContent,
                description: item.querySelector('description')?.textContent,
                link: item.querySelector('link')?.textContent,
                pubDate: item.querySelector('pubDate')?.textContent,
                image: extractImageFromContent(item.querySelector('description')?.textContent || '')
            }));
        } catch (error) {
            console.error(`Error fetching RSS feed from ${url}:`, error);
            return [];
        }
    }

    async function loadNewsFromMultipleFeeds(start = 0) {
        try {
            // Fetch all feeds concurrently
            const allFeeds = await Promise.all(rssSources.map(url => fetchRSSFeed(url)));
            
            // Combine and sort all items by date
            let allItems = allFeeds.flat().filter(item => item.title && item.description && item.link);
            allItems = shuffleArray(allItems);
            
            let newsHTML = '';
            
            for (let i = start; i < Math.min(start + newsPerPage, allItems.length); i++) {
                const item = allItems[i];
                const cleanDescription = cleanHTML(item.description);
                const truncatedDescription = truncateText(cleanDescription, 25);
                const formattedDate = formatDate(item.pubDate);
                
                newsHTML += `
                    <article class="news-card" style="--card-animation-delay: ${0.2 + i * 0.1}s">
                        ${item.image ? `
                            <div class="news-card-image-container">
                                <img src="${item.image}" alt="${item.title}" class="news-card-image" loading="lazy">
                            </div>
                        ` : ''}
                        <div class="news-card-content">
                            <h3 class="news-card-title">${item.title}</h3>
                            <p class="news-card-description">${truncatedDescription}</p>
                            <div class="news-card-footer">
                                <span class="news-card-date">${formattedDate}</span>
                                <a href="${item.link}" class="news-card-link" target="_blank">Читать далее</a>
                            </div>
                        </div>
                    </article>
                `;
            }
            
            if (start === 0) {
                newsGridContainer.innerHTML = newsHTML;
            } else {
                newsGridContainer.innerHTML += newsHTML;
            }
            
            loadedNewsCount += newsPerPage;
            loadMoreButton.style.display = loadedNewsCount >= allItems.length ? 'none' : 'inline-block';
            
        } catch (error) {
            console.error('Error loading RSS feeds:', error);
            newsGridContainer.innerHTML = '<p class="error-message">Не удалось загрузить новости. Пожалуйста, попробуйте позже.</p>';
            loadMoreButton.style.display = 'none';
        }
    }

    // Initial load
    loadNewsFromMultipleFeeds();

    // Load more button handler
    loadMoreButton.addEventListener('click', (e) => {
        e.preventDefault();
        loadNewsFromMultipleFeeds(loadedNewsCount);
    });
});
