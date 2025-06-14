// Define o nome e a versão do cache.
const CACHE_NAME = '3det-escudo-mestre-v1.3-gh'; 
const BASE_PATH = '/3det/';

// Arquivos da "casca" da aplicação. São cacheados na instalação.
const APP_SHELL_ASSETS = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'style.css',
    BASE_PATH + 'script.js',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'icons/apple-touch-icon.png'
];

// --- FASE DE INSTALAÇÃO: Cacheia a casca da aplicação ---
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Instalando nova versão...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[Service Worker] Cacheando a casca da aplicação...');
            return cache.addAll(APP_SHELL_ASSETS);
        })
    );
    self.skipWaiting();
});

// --- FASE DE ATIVAÇÃO: Limpa caches antigos ---
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Ativando nova versão...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// --- FASE DE FETCH: Intercepta as requisições ---
self.addEventListener('fetch', function(event) {
    const requestUrl = new URL(event.request.url);

    // Ignora requisições de outros domínios
    if (requestUrl.origin !== location.origin) {
        return;
    }

    // Estratégia: Stale-While-Revalidate para dados (JSON, MD)
    // Responde imediatamente com o cache, mas atualiza em segundo plano.
    if (requestUrl.pathname.endsWith('.json') || requestUrl.pathname.endsWith('.md')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(function(cache) {
                return cache.match(event.request).then(function(cachedResponse) {
                    const fetchPromise = fetch(event.request).then(function(networkResponse) {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    
                    // Retorna a resposta do cache imediatamente (se existir),
                    // enquanto a requisição de rede acontece em segundo plano.
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Estratégia: Cache First para o resto (App Shell, Imagens)
    // Responde com o cache. Se não encontrar, busca na rede e adiciona ao cache.
    event.respondWith(
        caches.match(event.request).then(function(cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then(function(networkResponse) {
                return caches.open(CACHE_NAME).then(function(cache) {
                    // Cacheia novas imagens e outros recursos conforme são solicitados
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});

