document.addEventListener('DOMContentLoaded', () => {
    // --- General Navigation & UI ---
    const burgerMenu = document.querySelector('.burger-menu');
    const nav = document.querySelector('.nav');
    const logoLinks = document.querySelectorAll('.logo'); // Select all logos

    // Burger menu toggle
    if (burgerMenu && nav) {
        burgerMenu.addEventListener('click', () => {
            burgerMenu.classList.toggle('active');
            nav.classList.toggle('open');
        });
    }

    // Close nav when a link is clicked (only if burger menu is active)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (burgerMenu && burgerMenu.classList.contains('active')) {
                 burgerMenu.classList.remove('active');
                 nav.classList.remove('open');
            }
        });
    });

    // Logo click to go to main page (apply to all found logos)
    logoLinks.forEach(logoLink => {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html'; // Ensure it always goes to index.html
        });
    });


    // --- Background Animation Toggle (Keyboard Shortcut) ---
    const backgroundAnimation = document.getElementById('background-animation');
    const svgContainer = backgroundAnimation ? backgroundAnimation.querySelector('svg') : null;
    let animationRunning = false;
    let waveRAFId = null; // To store requestAnimationFrame ID
    let wavePaths = []; // Store wave path elements
    let waveData = []; // Store wave properties

     // Function to initialize wave paths and data
     const initializeWaves = (svg) => {
         if (!svg) return;
         wavePaths = [];
         waveData = [];
         const numWaves = 4;

         // Remove existing paths if any
         svg.querySelectorAll('.wave-path').forEach(path => path.remove());

         for (let i = 0; i < numWaves; i++) {
             const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
             path.setAttribute('class', 'wave-path');
             svg.appendChild(path);
             wavePaths.push(path);
             waveData.push({
                 amplitude: 30 + i * 10,
                 frequency: 0.02 + i * 0.01,
                 phase: i * 2,
                 colorIndex: i + 1
             });
         }
     };

     // Function to draw waves
    const drawWaves = (time) => {
        if (!svgContainer || !animationRunning) {
            if (waveRAFId) cancelAnimationFrame(waveRAFId);
            waveRAFId = null;
            return;
        }

        waveData.forEach((wave, i) => {
            const path = wavePaths[i];
            if (!path) return;

            let pathD = 'M0,600 ';
            // Get actual SVG dimensions for responsiveness
            // Fallback to default values if clientWidth/clientHeight are not available
            const svgWidth = svgContainer.clientWidth > 0 ? svgContainer.clientWidth : 800;
            const svgHeight = svgContainer.clientHeight > 0 ? svgContainer.clientHeight : 600;


            for (let x = 0; x <= svgWidth; x += 10) {
                // Adjust base height relative to SVG height
                const y = svgHeight * 0.83 + wave.amplitude * Math.sin(wave.frequency * x + time / 1000 + wave.phase);
                pathD += `L${x},${y} `;
            }
            pathD += `L${svgWidth},${svgHeight} L0,${svgHeight} Z`; // Close the path

            path.setAttribute('d', pathD);
            path.setAttribute('stroke', `var(--wave-color-turquoise-${wave.colorIndex})`);
             path.setAttribute('fill', 'rgb(64 224 208 / 10%)'); // Ensure fill is set
        });

        waveRAFId = requestAnimationFrame(drawWaves);
    };


    // Initialize animation if container exists
    if (backgroundAnimation && svgContainer) {
        initializeWaves(svgContainer);
        animationRunning = true;
        requestAnimationFrame(drawWaves);

         // Optional: Re-initialize/redraw on window resize
         let resizeTimeout;
         window.addEventListener('resize', () => {
              clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(() => {
                 if (animationRunning && svgContainer) {
                     initializeWaves(svgContainer); // Recreate paths for new SVG size
                     // No need to cancel/restart RAF here, drawWaves loop continues and uses new paths
                 }
              }, 100); // Debounce resize
         });
    }


    // Toggle background on '~' key press
    document.addEventListener('keypress', (event) => {
        // Check for the "~" character or its common key code
        // event.key is more reliable than event.code or event.keyCode for characters
        // '`' key often produces '~' when Shift is held.
        if (event.key === '~' || event.key === '`') {
            // Prevent default to avoid typing '~' in inputs if focused
             if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
                event.preventDefault();
             }

            if (backgroundAnimation) {
                 backgroundAnimation.classList.toggle('hidden');

                // Manage animation loop
                 if (backgroundAnimation.classList.contains('hidden')) {
                    animationRunning = false;
                    if (waveRAFId) {
                         cancelAnimationFrame(waveRAFId);
                         waveRAFId = null;
                    }
                 } else {
                    // Restart animation - ensures paths are drawn if they were removed/cleared
                    if (svgContainer) {
                        // Re-initialize waves if they were removed (shouldn't happen with current logic)
                        if (wavePaths.length === 0) initializeWaves(svgContainer);
                        animationRunning = true; // Set flag BEFORE requesting frame
                        requestAnimationFrame(drawWaves);
                    }
                 }
            }
        }
    });

     // Handle smooth scroll for hash links on *any* page (e.g., index#about-us)
      // Note: This is separate from the tab logic's hash handling
      // Only scroll if the target element is NOT a category-content (handled by tabs)
     if (window.location.hash) {
        try {
             const targetSection = document.querySelector(window.location.hash);
             // Check if the target exists and is not a category tab content
             if (targetSection && !targetSection.classList.contains('category-content')) {
                 // Use setTimeout to allow rendering before scrolling
                 setTimeout(() => {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }, 150); // Small delay might help
             }
        } catch (e) {
            console.error("Invalid hash or element not found:", window.location.hash, e);
        }
    }


    // --- Universal Tab Switching Logic ---
    function setupTabs(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const tabs = container.querySelectorAll('.category-tab');
        const contents = container.querySelectorAll('.category-content'); // Finds all content divs

        if (tabs.length === 0 || contents.length === 0) {
             // console.warn(`Tab setup failed for ${containerSelector}: Mismatched tabs/contents or missing elements.`);
             // Exit if no tabs or content
             return;
        }

         // Map content divs by data-category for easy lookup
         const contentMap = {};
         contents.forEach(content => {
             const category = content.dataset.category;
             if (category) {
                 contentMap[category] = content;
             } else {
                  console.warn(`Content div missing data-category attribute:`, content);
             }
         });

        // Hide all contents initially and set initial opacity to 0
        contents.forEach(content => {
             content.classList.add('hidden');
             content.style.opacity = 0; // Ensure opacity is 0 when hidden
         });


        // Function to activate a tab and show its content
        const activateTab = (targetCategory) => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active-tab'));

            // Find currently active content (if any) and start fading it out
            const currentActiveContent = container.querySelector('.category-content:not(.hidden)'); // Find currently visible one
             if (currentActiveContent) {
                  currentActiveContent.style.opacity = 0; // Start fade out
                  // Add 'hidden' class after the transition finishes
                  // Use a listener or timeout
                  // Ensure we don't add multiple listeners to the same element
                   // Check if the hidden class isn't already being added after transition
                   if (!currentActiveContent.dataset.hiding) {
                       currentActiveContent.dataset.hiding = 'true'; // Mark as currently fading out
                        currentActiveContent.addEventListener('transitionend', function handler() {
                           // 'this' refers to the content element
                           // Check if the transition was indeed for opacity fading out
                           if (parseFloat(this.style.opacity) === 0) {
                               this.classList.add('hidden');
                               // this.style.removeProperty('opacity'); // Avoid removing opacity style here
                               this.dataset.hiding = ''; // Unmark
                               this.removeEventListener('transitionend', handler); // Remove listener
                           }
                        });
                   }

             } else {
                  // If no currently active content, ensure all are hidden just in case
                  contents.forEach(content => {
                      content.classList.add('hidden');
                      content.style.opacity = 0;
                  });
             }


            // Find and activate the target tab button
            const targetTabButton = container.querySelector(`.category-tab[data-category="${targetCategory}"]`);
            let finalTargetCategory = targetCategory; // Use this in case we default

            if (targetTabButton) {
                targetTabButton.classList.add('active-tab');
            } else {
                 console.warn(`Target tab button not found for category: ${targetCategory}. Defaulting to first tab.`);
                 // Default to the first tab if the requested one doesn't exist
                 if (tabs[0]) {
                     tabs[0].classList.add('active-tab');
                     finalTargetCategory = tabs[0].dataset.category; // Update category to the first one
                 } else {
                      console.error("No tabs found in container:", containerSelector);
                      // No tabs available, hide everything and exit
                      contents.forEach(content => {
                          content.classList.add('hidden');
                          content.style.opacity = 0;
                      });
                      return;
                 }
            }

             // Find and show the corresponding target content div with fade-in
            const targetContent = contentMap[finalTargetCategory];
            if (targetContent) {
                 // Clear any pending hiding state/transition on the target content
                 targetContent.dataset.hiding = '';
                 // Remove transitionend listeners related to hiding
                 // A more robust way might involve storing/managing listeners
                 // For simplicity, we'll just remove the 'hiding' flag.
                 // The previous transitionend listener will just not trigger add('hidden') if opacity is already > 0

                targetContent.classList.remove('hidden'); // Make it display: block
                 targetContent.style.opacity = 0; // Ensure it starts from 0 before fade-in

                 // Use rAF to ensure the browser registers the display change before starting the opacity transition
                 requestAnimationFrame(() => {
                     requestAnimationFrame(() => { // Double rAF for potentially better cross-browser timing
                         targetContent.style.opacity = 1; // Start fade in
                     });
                 });

            } else {
                 console.error(`Target content div not found in map for category: ${finalTargetCategory}`);
                 // If target content is missing, maybe hide all?
                 contents.forEach(content => {
                     content.classList.add('hidden');
                     content.style.opacity = 0;
                 });
            }

             // Update URL hash without page reload
             if (finalTargetCategory) {
                 // Only update hash if it's different to avoid adding to history on load if hash matches
                 if (window.location.hash !== `#${finalTargetCategory}`) {
                    // Check if pushState is supported
                    if (typeof window.history.pushState === 'function') {
                       window.history.pushState(null, '', `#${finalTargetCategory}`);
                    } else {
                       // Fallback for older browsers (causes full page reload)
                       window.location.hash = finalTargetCategory;
                    }
                 }
             } else {
                  // If defaulting and there's no category for the first tab (shouldn't happen), remove hash
                 if (window.location.hash) {
                     if (typeof window.history.pushState === 'function') {
                         window.history.pushState(null, '', window.location.pathname);
                     } else {
                          window.location.hash = '';
                     }
                 }
             }
        };

        // Determine initial category from hash or default
        const urlHash = window.location.hash.substring(1); // Remove '#'
        // Check if hash corresponds to a valid category in our content map
        const initialCategory = contentMap[urlHash] ? urlHash : (tabs[0] ? tabs[0].dataset.category : null);


         // Initial activation:
         if (initialCategory) {
             // Activate the tab corresponding to the initial category
             const initialTabButton = container.querySelector(`.category-tab[data-category="${initialCategory}"]`);
              if(initialTabButton){
                  initialTabButton.classList.add('active-tab');
              }
             // And show the content
             const initialContent = contentMap[initialCategory];
              if(initialContent){
                  initialContent.classList.remove('hidden');
                  // Set opacity immediately for initial load as there's nothing to fade out from
                  initialContent.style.opacity = 1;
              }

             // Ensure all other contents are hidden initially
             Object.values(contentMap).forEach(content => {
                 if (content !== initialContent) {
                     content.classList.add('hidden');
                     content.style.opacity = 0;
                 }
             });


         } else {
            // No initial category (no hash and no first tab), ensure nothing is shown
             contents.forEach(content => {
                 content.classList.add('hidden');
                 content.style.opacity = 0;
             });
              // Ensure no tab is active
             tabs.forEach(t => t.classList.remove('active-tab'));
         }


        // Add click listeners to tabs
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior

                const category = tab.dataset.category;
                 if (category) {
                     // Use the activateTab function for clicks
                     activateTab(category);
                 } else {
                     console.warn("Tab button missing data-category attribute:", tab);
                 }
            });
        });

         // Handle browser back/forward for hash changes
         window.addEventListener('popstate', () => {
             const newHash = window.location.hash.substring(1);
              // Determine the target category based on the new hash, defaulting to the first tab if it exists
             const targetCategory = contentMap[newHash] ? newHash : (tabs[0] ? tabs[0].dataset.category : null);

              // Only activate if the category is valid AND different from the currently active one
             const currentActiveCategoryButton = container.querySelector('.category-tab.active-tab');
             const currentActiveCategory = currentActiveCategoryButton ? currentActiveCategoryButton.dataset.category : null;

             if (targetCategory && targetCategory !== currentActiveCategory) {
                 activateTab(targetCategory);
             } else if (!targetCategory && currentActiveCategory) {
                  // If new hash is empty/invalid, but there was an active tab, deactivate it and hide content
                  tabs.forEach(t => t.classList.remove('active-tab'));
                   const currentlyVisibleContent = container.querySelector('.category-content:not(.hidden)');
                   if(currentlyVisibleContent) {
                        currentlyVisibleContent.style.opacity = 0;
                         // Add hidden class after transition IF it's not already being hidden
                         if (!currentlyVisibleContent.dataset.hiding) {
                             currentlyVisibleContent.dataset.hiding = 'true';
                             currentlyVisibleContent.addEventListener('transitionend', function handler() {
                                if (this.style.opacity === '0') {
                                    this.classList.add('hidden');
                                    // this.style.removeProperty('opacity'); // Avoid removing opacity style here
                                    this.dataset.hiding = '';
                                    this.removeEventListener('transitionend', handler);
                                }
                             });
                         }
                   }
             } else if (targetCategory === currentActiveCategory) {
                 // Hash changed but points to the already active tab - do nothing
                 // console.log("Popstate on already active tab:", targetCategory);
             }
         });

    }

     // Initialize tabs on categories.html if the container exists
    if(document.querySelector('#categories-section')) {
        setupTabs('#categories-section');
    }


     // Initialize tabs on comparison.html if the container exists
    if(document.querySelector('#comparison-section')) {
        setupTabs('#comparison-section');
    }


    // --- News Page Specific Logic (RSS Feed) ---
    // ... (rest of the news logic remains the same) ...

     const newsGridContainer = document.getElementById('news-grid-container');
    const loadMoreButton = document.querySelector('.news-more .button');

    if (newsGridContainer && loadMoreButton) { // Only run if elements exist (on news.html)

        let loadedNewsCount = 0;
        const newsPerPage = 6; // Increased slightly for potentially better grid layout
        let allNewsItems = []; // Store all fetched news items

        // RSS feed sources
        const rssSources = [
            'https://habr.com/ru/rss/hub/artificial_intelligence/all/',
            'https://habr.com/ru/rss/hub/machine_learning/all/',
            'https://habr.com/ru/rss/hub/neural_networks/all/',
        	// Using morss.it proxy is an alternative if allorigins fails, but allorigins is simpler
            // 'https://morss.it/:proxy:items=%7C%7C*[class=uho__link]/https://www.kommersant.ru/theme/2912' // Example for Kommersant, requires morss setup
            // Fetching Kommersant via AllOrigins might require different selectors if it's not standard RSS
            // Let's stick to Habr feeds for simplicity and reliability with standard RSS parsing
        ];

        const createProxyUrl = (url) => {
            // AllOrigins is less reliable now due to rate limits/blocking.
            // A server-side proxy is better, but for a client-side example, AllOrigins is used.
             // Adding a timestamp to try and avoid caching issues with proxy
            return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&_ts=${Date.now()}`;
        };

        const formatDate = (dateString) => {
             if (!dateString) return 'Дата неизвестна';
            try {
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                // Attempt to parse various date formats
                const date = new Date(dateString);
                 if (isNaN(date)) {
                     // Fallback for hard-to-parse dates (e.g., some Kommersant formats)
                     // Can add more specific parsing logic here if needed for new sources
                     return dateString.split(' ')[0] || dateString; // Simple approach: just take the date part if available
                 }
                return date.toLocaleDateString('ru-RU', options);
            } catch (e) {
                console.error("Error formatting date:", dateString, e);
                return dateString; // Return original if formatting fails
            }
        };

        const extractImageFromContent = (content) => {
            if (!content) return null;
            const div = document.createElement('div');
            div.innerHTML = content;

            // Try to find image in content
            const img = div.querySelector('img');
            if (img && img.src && img.src.startsWith('http')) { // Ensure it's a valid http(s) URL
                return img.src;
            }

            // Try to find image in media:content (requires correct namespace parsing, complex client-side)
            // Simplified approach: look for attributes on common media tags
            const mediaContent = div.querySelector('media\\:content, content'); // Escaping colon for media:content
            if (mediaContent && mediaContent.getAttribute('url') && mediaContent.getAttribute('url').startsWith('http')) {
                 return mediaContent.getAttribute('url');
             }

             // Fallback: Search for any common image link pattern in text (less reliable)
             // const imgMatch = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
             // if (imgMatch && imgMatch[1]) return imgMatch[1];

            return null;
        };

        const cleanHTML = (html) => {
            if (!html) return '';
            const div = document.createElement('div');
            div.innerHTML = html;

            // Remove scripts, iframes, and style tags
            const elementsToRemove = ['script', 'iframe', 'style'];
            elementsToRemove.forEach(tag => {
                const elements = div.getElementsByTagName(tag);
                while (elements.length) elements[0].parentNode.removeChild(elements[0]);
            });

            // Get plain text content
            let text = div.textContent || div.innerText || '';

            // Clean up excessive whitespace/newlines
             text = text.replace(/[\r\n]+/g, ' ').replace(/\s\s+/g, ' ').trim();

            return text;
        };

        const truncateText = (text, maxWords) => {
            if (!text) return '';
            const words = text.split(/\s+/);
            if (words.length > maxWords) {
                return words.slice(0, maxWords).join(' ') + '...';
            }
            return text;
        };

        const shuffleArray = (array) => {
             // Create a shallow copy before shuffling to avoid modifying the original array reference
             const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };

        async function fetchRSSFeed(url) {
            try {
                const proxyUrl = createProxyUrl(url);
                const response = await fetch(proxyUrl);
                if (!response.ok) {
                     console.warn(`Failed to fetch ${url} via proxy. Status: ${response.status}`);
                     // Fallback or error handling
                     return [];
                }

                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

                 // Check for parser errors
                const errorNode = xmlDoc.querySelector('parsererror');
                 if (errorNode) {
                     console.error(`Parser error for ${url}:`, errorNode.textContent);
                     return [];
                 }

                const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => {
                    const title = item.querySelector('title')?.textContent || 'Без заголовка';
                    // Use cdata if available, otherwise textContent for description
                    const descriptionNode = item.querySelector('description');
                    const description = descriptionNode ? (descriptionNode.firstChild && descriptionNode.firstChild.nodeType === 4 ? descriptionNode.firstChild.nodeValue : descriptionNode.textContent) : 'Нет описания';
                    const link = item.querySelector('link')?.textContent || '#';
                    const pubDateElement = item.querySelector('pubDate, dc\\:date'); // Look for common date tags
                    const pubDate = pubDateElement ? pubDateElement.textContent : 'Неизвестная дата';
                    const image = extractImageFromContent(description) ||
                                  extractImageFromContent(item.innerHTML); // Also check full item HTML

                    return { title, description, link, pubDate, image };
                }).filter(item => item.title && item.link && item.link !== '#'); // Filter out items with missing essential info

                 console.log(`Fetched ${items.length} items from ${url}`);
                return items;

            } catch (error) {
                console.error(`Error fetching RSS feed from ${url}:`, error);
                return [];
            }
        }

        async function loadAllNews() {
            if (newsGridContainer) { // Check again before clearing
               newsGridContainer.innerHTML = '<p class="loading-message">Загрузка новостей...</p>';
            }
             if (loadMoreButton) {
                 loadMoreButton.style.display = 'none'; // Hide button during initial load
             }


            try {
                // Fetch all feeds concurrently
                const allFeeds = await Promise.all(rssSources.map(url => fetchRSSFeed(url)));

                // Combine and sort all items by date (most recent first)
                let items = allFeeds.flat().filter(item => item.title && item.description && item.link);

                 // Optional: Remove duplicates based on link
                 const seenLinks = new Set();
                 items = items.filter(item => {
                     if (seenLinks.has(item.link)) {
                         return false;
                     } else {
                         seenLinks.add(item.link);
                         return true;
                     }
                 });

                // Sort by date if pubDate is available, otherwise keep original order
                 items.sort((a, b) => {
                     const dateA = new Date(a.pubDate);
                     const dateB = new Date(b.pubDate);
                     // Check if dates are valid before comparing
                     if (isNaN(dateA) && isNaN(dateB)) return 0;
                     if (isNaN(dateA)) return 1; // Push invalid dates to the end
                     if (isNaN(dateB)) return -1; // Push invalid dates to the end
                     return dateB - dateA; // Descending order (most recent first)
                 });

                allNewsItems = items; // Store the combined and sorted list
                loadedNewsCount = 0; // Reset count for initial display

                if (newsGridContainer) { // Check again before displaying
                   newsGridContainer.innerHTML = ''; // Clear loading message
                   displayNewsItems(loadedNewsCount, newsPerPage);
                }


                if (loadMoreButton) {
                   loadMoreButton.style.display = loadedNewsCount >= allNewsItems.length ? 'none' : 'inline-block';
                }


             } catch (error) {
                 console.error('Error loading RSS feeds:', error);
                 if (newsGridContainer) {
                     newsGridContainer.innerHTML = '<p class="error-message">Не удалось загрузить новости. Пожалуйста, попробуйте позже.</p>';
                 }
                 if (loadMoreButton) {
                    loadMoreButton.style.display = 'none';
                 }
             }
        }

        function displayNewsItems(start, count) {
             if (!newsGridContainer || allNewsItems.length === 0) {
                 // Display a message if no items were fetched on the very first load
                 if (start === 0 && newsGridContainer && newsGridContainer.innerHTML.trim() === '') {
                     newsGridContainer.innerHTML = '<p class="info-message">Нет доступных новостей.</p>';
                 }
                 return;
             }

            const itemsToDisplay = allNewsItems.slice(start, start + count);

            let newsHTML = '';
            itemsToDisplay.forEach((item, index) => {
                const cleanDescription = cleanHTML(item.description);
                const truncatedDescription = truncateText(cleanDescription, 25);
                const formattedDate = formatDate(item.pubDate);

                // Calculate animation delay based on overall index, not just within the slice
                 const overallIndex = start + index;

                newsHTML += `
                    <article class="news-card" style="--card-animation-delay: ${0.2 + overallIndex * 0.05}s">
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
                                <a href="${item.link}" class="news-card-link" target="_blank" rel="noopener noreferrer">Читать далее</a>
                            </div>
                        </div>
                    </article>
                `;
            });

             newsGridContainer.innerHTML += newsHTML; // Append new items

            loadedNewsCount += itemsToDisplay.length; // Update count based on how many were actually added

            if (loadMoreButton) {
              loadMoreButton.style.display = loadedNewsCount >= allNewsItems.length ? 'none' : 'inline-block';
            }
        }

        // Initial load for news page
        loadAllNews();

        // Load more button handler
        if (loadMoreButton) {
            loadMoreButton.addEventListener('click', (e) => {
                e.preventDefault();
                displayNewsItems(loadedNewsCount, newsPerPage);
            });
        }
    }

});