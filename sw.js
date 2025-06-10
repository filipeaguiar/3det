// Define o nome do cache
const CACHE_NAME = '3det-escudo-mestre-v1';

// Lista de ficheiros a serem guardados em cache
const urlsToCache = [
  '/',
  '/index.html',
  '/personagens.json',
  '/bestiario.json',
  '/pericias.json',
  '/vantagens.json',
  '/desvantagens.json',
  '/tecnicas.json',
  '/Campanha/aventura01.md',
  '/Campanha/aventura02.md',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
  // Adicione aqui os caminhos para as imagens dos personagens se elas existirem
  // Ex: '/img/joao.jpg'
];

// Evento de instalação: abre o cache e adiciona os ficheiros
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de fetch: responde com o conteúdo do cache se disponível,
// caso contrário, busca na rede.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna
        if (response) {
          return response;
        }
        // Senão, busca na rede
        return fetch(event.request);
      }
      )
  );
});
