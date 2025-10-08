// Configurações da API
const apiKey = 'b914fa1f9f9e4047851fca7e25e614db';
const baseUrl = 'https://api.worldnewsapi.com';

// Elementos DOM
const navButtons = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');
const searchBtn = document.getElementById('search-btn');
const searchText = document.getElementById('search-text');
const languageSelect = document.getElementById('language-select');
const countrySelect = document.getElementById('country-select');
const newsCount = document.getElementById('news-count');
const searchResults = document.getElementById('search-results');
const categoryResults = document.getElementById('category-results');
const countryResults = document.getElementById('country-results');
const newsCounter = document.getElementById('news-counter');
const counterText = document.getElementById('counter-text');
const modal = document.getElementById('news-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Inicializar aplicação
 */
function initializeApp() {
    setupEventListeners();
    loadInitialNews();
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    // Navegação entre seções
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.id.replace('nav-', '');
            switchSection(targetSection);
        });
    });

    // Busca de notícias
    searchBtn.addEventListener('click', searchNews);
    searchText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchNews();
        }
    });

    // Categorias
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            searchByCategory(category);
        });
    });

    // Países
    document.querySelectorAll('.country-card').forEach(card => {
        card.addEventListener('click', () => {
            const country = card.dataset.country;
            searchByCountry(country);
        });
    });

    // Modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/**
 * Função para fazer requisições à API
 */
async function fetchFromAPI(endpoint, params = {}) {
    try {
        // Adicionar a chave da API aos parâmetros
        params['api-key'] = apiKey;
        
        // Construir URL com parâmetros
        const url = new URL(`${baseUrl}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        console.log('Fazendo requisição para:', url.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro na requisição à API:', error);
        throw error;
    }
}

/**
 * Carregar notícias iniciais
 */
async function loadInitialNews() {
    try {
        showLoading(searchResults);
        const data = await fetchFromAPI('/search-news', {
            text: 'breaking news',
            language: 'en',
            number: 10
        });
        
        displayNews(data.news, searchResults);
        updateNewsCounter(data.available || data.news.length);
        showNotification('Notícias carregadas com sucesso!', 'success');
    } catch (error) {
        showError(searchResults, 'Erro ao carregar notícias iniciais');
        showNotification('Erro ao carregar notícias', 'error');
    }
}

/**
 * Buscar notícias
 */
async function searchNews() {
    const text = searchText.value.trim();
    const language = languageSelect.value;
    const country = countrySelect.value;
    const number = parseInt(newsCount.value) || 10;

    if (!text && !language && !country) {
        showNotification('Digite um termo de busca ou selecione filtros', 'warning');
        return;
    }

    try {
        showLoading(searchResults);
        
        const params = {
            number: number
        };

        if (text) params.text = text;
        if (language) params.language = language;
        if (country) params['source-country'] = country;

        const data = await fetchFromAPI('/search-news', params);
        
        displayNews(data.news, searchResults);
        updateNewsCounter(data.available || data.news.length);
        showNotification(`${data.news.length} notícias encontradas`, 'success');
    } catch (error) {
        showError(searchResults, 'Erro ao buscar notícias');
        showNotification('Erro ao buscar notícias', 'error');
    }
}

/**
 * Buscar por categoria
 */
async function searchByCategory(category) {
    try {
        showLoading(categoryResults);
        switchSection('categories');
        
        const data = await fetchFromAPI('/search-news', {
            categories: category,
            number: 20
        });
        
        displayNews(data.news, categoryResults);
        updateNewsCounter(data.available || data.news.length);
        showNotification(`Notícias de ${translateCategory(category)} carregadas`, 'success');
    } catch (error) {
        showError(categoryResults, 'Erro ao carregar notícias da categoria');
        showNotification('Erro ao carregar categoria', 'error');
    }
}

/**
 * Buscar por país
 */
async function searchByCountry(country) {
    try {
        showLoading(countryResults);
        switchSection('countries');
        
        const data = await fetchFromAPI('/search-news', {
            'source-country': country,
            number: 20
        });
        
        displayNews(data.news, countryResults);
        updateNewsCounter(data.available || data.news.length);
        showNotification(`Notícias de ${translateCountry(country)} carregadas`, 'success');
    } catch (error) {
        showError(countryResults, 'Erro ao carregar notícias do país');
        showNotification('Erro ao carregar notícias do país', 'error');
    }
}

/**
 * Exibir notícias
 */
function displayNews(news, container) {
    if (!news || news.length === 0) {
        container.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-search"></i>
                <h3>Nenhuma notícia encontrada</h3>
                <p>Tente ajustar os filtros de busca</p>
            </div>
        `;
        return;
    }

    const newsGrid = news.map(article => {
        const publishDate = formatDate(article.publish_date);
        const imageUrl = article.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem';
        const summary = article.summary || article.text?.substring(0, 150) + '...' || 'Resumo não disponível';
        
        return `
            <div class="news-card" onclick="showNewsDetails(${JSON.stringify(article).replace(/"/g, '&quot;')})">
                <img src="${imageUrl}" alt="${article.title}" class="news-image" onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-summary">${summary}</p>
                    <div class="news-meta">
                        <div class="news-date">
                            <i class="fas fa-calendar"></i>
                            <span>${publishDate}</span>
                        </div>
                        <div class="news-source">
                            <i class="fas fa-globe"></i>
                            <span>${article.source_country?.toUpperCase() || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="news-grid">${newsGrid}</div>`;
}

/**
 * Mostrar detalhes da notícia
 */
window.showNewsDetails = function(article) {
    const publishDate = formatDate(article.publish_date);
    const imageUrl = article.image || 'https://via.placeholder.com/800x400?text=Sem+Imagem';
    const authors = article.authors && article.authors.length > 0 ? article.authors.join(', ') : 'Autor não informado';
    const category = translateCategory(article.category) || 'Geral';
    const sentiment = getSentimentText(article.sentiment);
    
    modalBody.innerHTML = `
        <img src="${imageUrl}" alt="${article.title}" class="modal-image" onerror="this.src='https://via.placeholder.com/800x400?text=Sem+Imagem'">
        <h2 class="modal-title">${article.title}</h2>
        <div class="modal-meta">
            <div class="modal-meta-item">
                <i class="fas fa-calendar"></i>
                <span>${publishDate}</span>
            </div>
            <div class="modal-meta-item">
                <i class="fas fa-user"></i>
                <span>${authors}</span>
            </div>
            <div class="modal-meta-item">
                <i class="fas fa-tag"></i>
                <span>${category}</span>
            </div>
            <div class="modal-meta-item">
                <i class="fas fa-globe"></i>
                <span>${article.source_country?.toUpperCase() || 'N/A'}</span>
            </div>
            <div class="modal-meta-item">
                <i class="fas fa-heart"></i>
                <span>${sentiment}</span>
            </div>
        </div>
        <div class="modal-text">
            ${article.text || article.summary || 'Conteúdo não disponível'}
        </div>
        ${article.url ? `<a href="${article.url}" target="_blank" class="modal-link">
            <i class="fas fa-external-link-alt"></i> Ler notícia completa
        </a>` : ''}
    `;
    
    modal.style.display = 'block';
};

/**
 * Navegação entre seções
 */
function switchSection(targetSection) {
    // Remove active de todos os botões e seções
    navButtons.forEach(btn => btn.classList.remove('active'));
    contentSections.forEach(section => section.classList.remove('active'));
    
    // Adiciona active ao botão e seção correspondentes
    document.getElementById(`nav-${targetSection}`).classList.add('active');
    document.getElementById(`${targetSection}-section`).classList.add('active');
}

/**
 * Mostrar estado de carregamento
 */
function showLoading(container) {
    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Carregando notícias...</p>
        </div>
    `;
}

/**
 * Mostrar erro
 */
function showError(container, message) {
    container.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erro</h3>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Atualizar contador de notícias
 */
function updateNewsCounter(count) {
    counterText.textContent = `${count} notícias encontradas`;
    newsCounter.classList.remove('hidden');
}

/**
 * Mostrar notificação
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.getElementById('notification-container').appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

/**
 * Formatar data
 */
function formatDate(dateString) {
    if (!dateString) return 'Data não disponível';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data inválida';
    }
}

/**
 * Traduzir categoria
 */
function translateCategory(category) {
    const translations = {
        'politics': 'Política',
        'sports': 'Esportes',
        'business': 'Negócios',
        'technology': 'Tecnologia',
        'entertainment': 'Entretenimento',
        'health': 'Saúde',
        'science': 'Ciência',
        'lifestyle': 'Estilo de Vida',
        'travel': 'Viagem',
        'culture': 'Cultura',
        'education': 'Educação',
        'environment': 'Meio Ambiente',
        'general': 'Geral',
        'other': 'Outros'
    };
    
    return translations[category] || category;
}

/**
 * Traduzir país
 */
function translateCountry(countryCode) {
    const translations = {
        'br': 'Brasil',
        'us': 'Estados Unidos',
        'gb': 'Reino Unido',
        'fr': 'França',
        'de': 'Alemanha',
        'es': 'Espanha',
        'it': 'Itália',
        'ca': 'Canadá',
        'au': 'Austrália',
        'jp': 'Japão'
    };
    
    return translations[countryCode] || countryCode?.toUpperCase();
}

/**
 * Obter texto do sentimento
 */
function getSentimentText(sentiment) {
    if (sentiment === null || sentiment === undefined) return 'Neutro';
    
    if (sentiment > 0.3) return 'Positivo';
    if (sentiment < -0.3) return 'Negativo';
    return 'Neutro';
}
