
// Define o nome e a versão do cache.
// Mude a versão sempre que atualizar os arquivos para forçar o cache a se atualizar.
const CACHE_NAME = '3det-escudo-mestre-v1.1';

// Lista de arquivos essenciais da aplicação para serem cacheados na instalação.
const STATIC_ASSETS = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icons/apple-touch-icon.png',
  // Adicione aqui os caminhos para as imagens que você SEMPRE quer disponíveis offline.
  // Ex: 'img/joao.jpg', 'img/arco-iris.jpg', etc.
];

// --- FASE DE INSTALAÇÃO: Cacheia os arquivos estáticos ---
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Instalando...');

  // O service worker espera até que o cache seja completamente populado.
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[Service Worker] Cacheando arquivos estáticos...');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// --- FASE DE ATIVAÇÃO: Limpa caches antigos ---
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Ativando...');

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Se o nome do cache for diferente da versão atual, ele é deletado.
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

// --- FASE DE FETCH: Intercepta as requisições e serve do cache ---
self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);

  // Estratégia para imagens: Cache First, then Network
  // Ideal para conteúdo que não muda com frequência.
  if (requestUrl.pathname.startsWith('/img/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function(cachedResponse) {
          // Se a imagem estiver no cache, retorna a versão cacheada.
          if (cachedResponse) {
            return cachedResponse;
          }

          // Se não, busca na rede, retorna e adiciona ao cache para a próxima vez.
          return fetch(event.request).then(function(networkResponse) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Estratégia para arquivos da aplicação e JSONs: Network First, then Cache
  // Garante que o usuário sempre veja a versão mais recente dos dados, se online.
  event.respondWith(
    fetch(event.request).then(function(networkResponse) {
      // Se a requisição à rede foi bem sucedida, clona e guarda no cache.
      return caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      });
    }).catch(function() {
      // Se a rede falhar, tenta pegar a versão que está no cache.
      return caches.match(event.request);
    })
  );
});

