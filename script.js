// --- Estado Global ---
let periciasData = {};
let vantagensData = {};
let desvantagensData = {};
let tecnicasData = {};
let kitsData = [];
let playerData = [];
let bestiaryData = [];
let npcData = [];
let sessionData = {};
let campaignData = [];

// --- FUNÇÕES DE BUSCA DE DADOS (DATA FETCHING) ---
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status} ao carregar: ${url}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function fetchAllData() {
  console.log("A buscar todos os dados dos arquivos JSON...");
  const [
    periciasRes,
    vantagensRes,
    desvantagensRes,
    tecnicasRes,
    personagensRes,
    bestiarioRes,
    npcsRes,
    sessaoRes,
    campanhaIndexRes
  ] = await Promise.all([
    fetchData('pericias.json'),
    fetchData('vantagens.json'),
    fetchData('desvantagens.json'),
    fetchData('tecnicas.json'),
    fetchData('personagens.json'),
    fetchData('bestiario.json'),
    fetchData('npcs.json'),
    fetchData('sessao.json'),
    fetchData('Campanha/index.json')
  ]);

  const arrayToObject = (arr) => arr.reduce((acc, item) => { acc[item.name] = item; return acc; }, {});

  if (periciasRes) periciasData = arrayToObject(periciasRes);
  if (vantagensRes) {
    vantagensData = arrayToObject(vantagensRes);
    kitsData = vantagensRes.filter(v => v.name.toLowerCase().startsWith('kit:'));
  }
  if (desvantagensRes) desvantagensData = arrayToObject(desvantagensRes);
  if (tecnicasRes) tecnicasData = arrayToObject(tecnicasRes);
  if (personagensRes) playerData = personagensRes;
  if (bestiarioRes) bestiaryData = bestiarioRes;
  if (npcsRes) npcData = npcsRes;
  if (sessaoRes) sessionData = sessaoRes;

  if (campanhaIndexRes) {
    const markdownFiles = await Promise.all(
      campanhaIndexRes.map(fileName => fetch(`Campanha/${fileName}`).then(res => res.text()))
    );
    campaignData = markdownFiles;
  }


  loadRules(periciasRes || [], vantagensRes || [], desvantagensRes || [], tecnicasRes || [], kitsData);
  populatePlayerList();
  populateNpcList();
  populateBestiaryList();
  displaySessionData();
  initializeCampaignView();
}


// --- FUNÇÕES DE UI E RENDERIZAÇÃO ---

function showSection(targetId) {
  document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(button => button.classList.remove('active'));
  const sectionToShow = document.getElementById(targetId);
  if (sectionToShow) sectionToShow.classList.add('active');
  const buttonToActivate = document.querySelector(`[data-target="${targetId}"]`);
  if (buttonToActivate) buttonToActivate.classList.add('active');
}

function createAbilitySpan(abilityName, masterData) {
  const fullAbility = masterData[abilityName];
  if (fullAbility) {
    const desc = (fullAbility.description || fullAbility.desc || 'Sem descrição.').replace(/"/g, '&quot;');
    return `<span class="ability-tag" data-tooltip="${desc}">${fullAbility.name}</span>`;
  }
  return `<span class="ability-tag" data-tooltip="Descrição não encontrada.">${abilityName}</span>`;
}


function displayPlayer(playerName) {
  const playerDetails = document.getElementById('player-details');
  const player = playerData.find(p => p.name === playerName);
  if (!player) {
    playerDetails.innerHTML = `<p class="text-center text-error">Personagem não encontrado.</p>`;
    return;
  }

  const createListHtml = (itemNames, masterData) => {
    if (!itemNames || itemNames.length === 0) return "Nenhuma";
    return itemNames.map(itemName => createAbilitySpan(itemName, masterData)).join(', ');
  };

  let periciasHtml = createListHtml(player.pericias, periciasData);
  let vantagensHtml = createListHtml(player.vantagens, vantagensData);
  let tecnicasHtml = createListHtml(player.tecnicas, tecnicasData);
  let desvantagensHtml = createListHtml(player.desvantagens, desvantagensData);

  const iconMap = { "Poder": "fa-hand-fist", "Habilidade": "fa-brain", "Resistência": "fa-shield-halved", "Pontos de Vida": "fa-heart-pulse", "Pontos de Mana": "fa-wand-magic-sparkles", "Pontos de Ação": "fa-bolt" };
  const stats = player.stats;
  const statsCardsHtml = Object.entries(stats).map(([statName, statValue]) => {
    const iconClass = iconMap[statName] || 'fa-question-circle';
    return `<div class="info-card p-3 rounded-lg flex items-center gap-x-3 shadow-sm"><i class="fa-solid ${iconClass} fa-fw fa-2x text-accent"></i><div><span class="block text-sm text-secondary">${statName}</span><span class="block text-xl font-bold text-primary">${statValue || 0}</span></div></div>`;
  }).join('');

  playerDetails.innerHTML = `<div class="flex flex-col sm:flex-row gap-6 items-start"><div class="flex-shrink-0 w-full sm:w-48"><img src="${player.image || ''}" alt="Retrato de ${player.name}" class="placeholder-img w-full h-auto object-cover rounded-lg shadow-lg" onerror="this.onerror=null; this.src='https://placehold.co/400x400/e2e8f0/475569?text=${player.name.charAt(0)}';"></div><div class="flex-grow"><h3 class="text-2xl font-bold text-accent">${player.name}</h3><p class="text-md text-secondary italic mb-2">${player.concept}</p><p class="text-sm text-secondary mb-4">${player.archetype} • ${player.pontos}</p><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-list-ol fa-fw text-slate-500"></i><span>Atributos</span></h4><div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-2">${statsCardsHtml}</div></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-graduation-cap fa-fw text-slate-500"></i><span>Perícias</span></h4><p>${periciasHtml}</p></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-up fa-fw text-green-600"></i><span>Vantagens</span></h4><p>${vantagensHtml}</p></div>${tecnicasHtml !== "Nenhuma" ? `<div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-wand-sparkles fa-fw text-blue-500"></i><span>Técnicas</span></h4><p>${tecnicasHtml}</p></div>` : ''}<div><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-down fa-fw text-red-600"></i><span>Desvantagens</span></h4><p>${desvantagensHtml}</p></div></div></div>`;
  document.querySelectorAll('#player-list .list-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`#player-list .list-item[data-id="${player.name}"]`).classList.add('active');
}

function displayNpc(npcName) {
  const detailsContainer = document.getElementById('npc-details');
  const npc = npcData.find(n => n.name === npcName);
  if (!npc) {
    detailsContainer.innerHTML = `<p class="text-center text-error">NPC não encontrado.</p>`;
    return;
  }
  // Reutiliza a lógica de displayPlayer para consistência
  displayCharacter(npc, detailsContainer, periciasData, vantagensData, tecnicasData, desvantagensData);
  document.querySelectorAll('#npc-list .list-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`#npc-list .list-item[data-id="${npc.name}"]`).classList.add('active');
}

function displayEnemy(enemyName) {
  const detailsContainer = document.getElementById('bestiary-details');
  const enemy = bestiaryData.find(e => e.name === enemyName);
  if (!enemy) {
    detailsContainer.innerHTML = `<p class="text-center text-error">Inimigo não encontrado.</p>`;
    return;
  }
  // Reutiliza a lógica de displayPlayer para consistência
  displayCharacter(enemy, detailsContainer, periciasData, vantagensData, tecnicasData, desvantagensData);
  document.querySelectorAll('#bestiary-list .list-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`#bestiary-list .list-item[data-id="${enemy.name}"]`).classList.add('active');
}

function displayCharacter(character, container, pericias, vantagens, tecnicas, desvantagens) {
  const createListHtml = (itemNames, masterData) => {
    if (!itemNames || itemNames.length === 0) return "Nenhuma";
    return itemNames.map(itemName => createAbilitySpan(itemName, masterData)).join(', ');
  };

  let periciasHtml = createListHtml(character.pericias, pericias);
  let vantagensHtml = createListHtml(character.vantagens, vantagens);
  let tecnicasHtml = createListHtml(character.tecnicas, tecnicas);
  let desvantagensHtml = createListHtml(character.desvantagens, desvantagens);

  const iconMap = { "Poder": "fa-hand-fist", "Habilidade": "fa-brain", "Resistência": "fa-shield-halved", "Pontos de Vida": "fa-heart-pulse", "Pontos de Mana": "fa-wand-magic-sparkles", "Pontos de Ação": "fa-bolt" };
  const stats = character.stats;
  const statsCardsHtml = Object.entries(stats).map(([statName, statValue]) => {
    const iconClass = iconMap[statName] || 'fa-question-circle';
    return `<div class="info-card p-3 rounded-lg flex items-center gap-x-3 shadow-sm"><i class="fa-solid ${iconClass} fa-fw fa-2x text-accent"></i><div><span class="block text-sm text-secondary">${statName}</span><span class="block text-xl font-bold text-primary">${statValue || 0}</span></div></div>`;
  }).join('');

  container.innerHTML = `<div class="flex flex-col sm:flex-row gap-6 items-start"><div class="flex-shrink-0 w-full sm:w-48"><img src="${character.image || ''}" alt="Retrato de ${character.name}" class="placeholder-img w-full h-auto object-cover rounded-lg shadow-lg" onerror="this.onerror=null; this.src='https://placehold.co/400x400/e2e8f0/475569?text=${character.name.charAt(0)}';"></div><div class="flex-grow"><h3 class="text-2xl font-bold text-accent">${character.name}</h3><p class="text-md text-secondary italic mb-2">${character.concept}</p><p class="text-sm text-secondary mb-4">${character.archetype} • ${character.pontos}</p><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-list-ol fa-fw text-slate-500"></i><span>Atributos</span></h4><div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-2">${statsCardsHtml}</div></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-graduation-cap fa-fw text-slate-500"></i><span>Perícias</span></h4><p>${periciasHtml}</p></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-up fa-fw text-green-600"></i><span>Vantagens</span></h4><p>${vantagensHtml}</p></div>${tecnicasHtml !== "Nenhuma" ? `<div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-wand-sparkles fa-fw text-blue-500"></i><span>Técnicas</span></h4><p>${tecnicasHtml}</p></div>` : ''}<div><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-down fa-fw text-red-600"></i><span>Desvantagens</span></h4><p>${desvantagensHtml}</p></div></div></div>`;
}


function populatePlayerList() {
  const playerList = document.getElementById('player-list');
  if (!playerList) return;
  playerList.innerHTML = '';
  playerData.forEach(player => {
    const li = document.createElement('li');
    li.dataset.id = player.name;
    li.className = 'list-item p-2 rounded-md cursor-pointer flex items-center gap-x-2';
    li.innerHTML = `<i class="fa-solid fa-user fa-fw text-slate-500"></i><span>${player.name}</span>`;
    li.onclick = () => displayPlayer(player.name);
    playerList.appendChild(li);
  });
}
function populateNpcList() {
  const npcList = document.getElementById('npc-list');
  if (!npcList) return;
  npcList.innerHTML = '';
  npcData.sort((a, b) => a.name.localeCompare(b.name)).forEach(npc => {
    const li = document.createElement('li');
    li.dataset.id = npc.name;
    li.className = 'list-item p-2 rounded-md cursor-pointer flex items-center gap-x-2';
    li.innerHTML = `<i class="fa-solid fa-id-badge fa-fw text-slate-500"></i><span>${npc.name}</span>`;
    li.onclick = () => displayNpc(npc.name);
    npcList.appendChild(li);
  });
}
function populateBestiaryList() {
  const bestiaryList = document.getElementById('bestiary-list');
  if (!bestiaryList) return;
  bestiaryList.innerHTML = '';
  bestiaryData.sort((a, b) => a.name.localeCompare(b.name)).forEach(enemy => {
    const li = document.createElement('li');
    li.dataset.id = enemy.name;
    li.className = 'list-item p-2 rounded-md cursor-pointer flex items-center gap-x-2';
    li.innerHTML = `<i class="fa-solid fa-skull fa-fw text-slate-500"></i><span>${enemy.name}</span>`;
    li.onclick = () => displayEnemy(enemy.name);
    bestiaryList.appendChild(li);
  });
}

function loadRules(pericias, vantagens, desvantagens, tecnicas, kits) {
  const regrasNav = document.getElementById('regras-nav');
  const regrasContent = document.getElementById('regras-content');
  const searchInput = document.getElementById('regras-search-input');
  const searchResultsContainer = document.getElementById('regras-search-results');

  if (!regrasNav) return;

  const ruleCategories = {
    'Perícias': { data: pericias, icon: 'fa-graduation-cap', color: 'text-slate-500' },
    'Vantagens': { data: vantagens.filter(v => !v.name.toLowerCase().startsWith('kit:')), icon: 'fa-thumbs-up', color: 'text-green-600' },
    'Kits': { data: kits, icon: 'fa-box-archive', color: 'text-purple-600' },
    'Desvantagens': { data: desvantagens, icon: 'fa-thumbs-down', color: 'text-red-600' },
    'Técnicas': { data: tecnicas, icon: 'fa-wand-sparkles', color: 'text-blue-500' }
  };

  const allRules = [];
  for (const categoryName in ruleCategories) {
    const category = ruleCategories[categoryName];
    if (category.data) {
      category.data.forEach(item => {
        allRules.push({ ...item, categoryName: categoryName, icon: category.icon, color: category.color });
      });
    }
  }

  const generateRuleListHtml = (items) => {
    if (!items || items.length === 0) return '<p class="text-secondary text-center mt-4">Nenhum resultado encontrado.</p>';
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items.map(item => {
      const description = (item.description || item.desc || '').replace(/\n/g, '<br>');
      let detailsHtml;
      if (item.categoryName === 'Técnicas') {
        detailsHtml = `<dd class="text-base text-secondary mt-1 pl-8 leading-relaxed">${description}</dd><dd class="text-sm text-secondary mt-3 pl-8 leading-relaxed space-y-2">${item.requirements ? `<p><i class="fa-solid fa-check-double fa-fw text-slate-500"></i> <strong>Requisitos:</strong> ${item.requirements}</p>` : ''}${item.cost ? `<p><i class="fa-solid fa-fire-flame-curved fa-fw text-blue-500"></i> <strong>Custo:</strong> ${item.cost}</p>` : ''}${item.duration ? `<p><i class="fa-solid fa-hourglass-half fa-fw text-slate-500"></i> <strong>Duração:</strong> ${item.duration}</p>` : ''}</dd>`;
      } else {
        detailsHtml = `<dd class="text-base text-secondary mt-1 pl-8 leading-relaxed">${description}</dd>`;
      }
      return `<div class="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0"><dt class="font-bold text-lg text-primary flex items-center gap-x-3"><i class="fa-solid ${item.icon} fa-fw ${item.color} text-xl"></i><span>${item.name} ${item.cost && item.categoryName !== 'Técnicas' ? `(${item.cost})` : ''}</span></dt>${detailsHtml}</div>`;
    }).join('');
  };

  regrasNav.innerHTML = '';
  regrasContent.innerHTML = '';
  for (const categoryName in ruleCategories) {
    const category = ruleCategories[categoryName];
    if (!category.data || category.data.length === 0) continue;

    const button = document.createElement('button');
    button.className = 'nav-btn px-4 py-2 rounded-lg text-sm flex items-center gap-x-2';
    button.dataset.target = `regras-${categoryName.toLowerCase().replace(/ /g, '-')}`;
    button.innerHTML = `<i class="fa-solid ${category.icon} fa-fw ${category.color}"></i> <span>${categoryName}</span>`;
    regrasNav.appendChild(button);

    const contentDiv = document.createElement('div');
    contentDiv.id = `regras-${categoryName.toLowerCase().replace(/ /g, '-')}`;
    contentDiv.className = 'rule-content hidden mt-6';

    const categoryItems = allRules.filter(rule => rule.categoryName === categoryName);
    contentDiv.innerHTML = `<dl>${generateRuleListHtml(categoryItems)}</dl>`;
    regrasContent.appendChild(contentDiv);
  }

  regrasNav.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button) {
      regrasContent.querySelectorAll('.rule-content').forEach(div => div.classList.add('hidden'));
      regrasNav.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
      const targetId = button.dataset.target;
      const contentToShow = document.getElementById(targetId);
      if (contentToShow) {
        contentToShow.classList.remove('hidden');
        contentToShow.style.animation = 'fadeIn 0.5s ease-in-out';
      }
      button.classList.add('active');
    }
  });

  const firstButton = regrasNav.querySelector('button');
  if (firstButton) { firstButton.click(); }

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query) {
      regrasNav.classList.add('hidden');
      regrasContent.classList.add('hidden');
      searchResultsContainer.classList.remove('hidden');
      const filteredRules = allRules.filter(rule => rule.name.toLowerCase().includes(query) || (rule.desc && rule.desc.toLowerCase().includes(query)));
      searchResultsContainer.innerHTML = generateRuleListHtml(filteredRules);
    } else {
      regrasNav.classList.remove('hidden');
      regrasContent.classList.remove('hidden');
      searchResultsContainer.classList.add('hidden');
      const activeButton = regrasNav.querySelector('button.active') || regrasNav.querySelector('button');
      if (activeButton) activeButton.click();
    }
  });
}

function displaySessionData() {
  const container = document.getElementById('session-content');
  if (!container || !sessionData || Object.keys(sessionData).length === 0) {
    if (container) container.innerHTML = '<p class="text-secondary text-center">Dados da sessão não encontrados.</p>';
    return;
  }

  container.innerHTML = ''; // Limpa o conteúdo anterior

  const createCard = (title, icon, content) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return '';
    const card = document.createElement('div');
    card.className = 'info-card p-6 rounded-lg shadow';
    card.innerHTML = `<h2 class="text-xl font-bold mb-4 text-accent flex items-center gap-x-2"><i class="fa-solid ${icon} fa-fw"></i><span>${title}</span></h2>${content}`;
    return card;
  };

  const listFromArray = (items, key) => {
    if (!items || items.length === 0) return '<p class="text-secondary">Nenhum.</p>';
    return `<ul class="list-disc list-inside space-y-2">${items.map(item => `<li>${key ? item[key] : item}</li>`).join('')}</ul>`;
  };

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6';

  const leftCol = document.createElement('div');
  leftCol.className = 'space-y-6';

  leftCol.appendChild(createCard('Começo Forte', 'fa-rocket', `<p class="text-secondary">${sessionData.comecoForte}</p>`));
  leftCol.appendChild(createCard('Ganchos dos Personagens', 'fa-user-pen', listFromArray(sessionData.ganchosPersonagens)));
  leftCol.appendChild(createCard('Objetivos da Sessão', 'fa-bullseye', `
        <h3 class="font-bold text-primary">Principal</h3><p class="text-secondary mb-2">${sessionData.objetivosSessao.principal}</p>
        <h3 class="font-bold text-primary mt-4">Secundários</h3>${listFromArray(sessionData.objetivosSessao.secundarios)}
    `));
  leftCol.appendChild(createCard('Segredos e Rumores', 'fa-user-secret', listFromArray(sessionData.segredosRumores)));
  leftCol.appendChild(createCard('Tesouros e Recompensas', 'fa-gem', listFromArray(sessionData.tesourosRecompensas, 'descricaoMecanica')));

  const rightCol = document.createElement('div');
  rightCol.className = 'space-y-6';

  const locaisHtml = sessionData.locaisInteressantes.map(local => `
        <div class="mb-4">
            <h3 class="font-bold text-primary">${local.nome}</h3>
            ${listFromArray(local.caracteristicas)}
        </div>`).join('');
  rightCol.appendChild(createCard('Locais Interessantes', 'fa-map-signs', locaisHtml));

  const encontrosHtml = sessionData.encontrosDesafios.map(desafio => `
        <div class="mb-4">
            <h3 class="font-bold text-primary">${desafio.titulo}</h3>
            <p class="text-secondary">${desafio.descricao}</p>
            <p class="text-sm text-accent mt-1"><strong>Mecânica:</strong> ${desafio.mecanica}</p>
        </div>`).join('');
  rightCol.appendChild(createCard('Encontros e Desafios', 'fa-dragon', encontrosHtml));
  rightCol.appendChild(createCard('Gancho para Próxima Aventura', 'fa-arrow-right', `<p class="text-secondary">${sessionData.ganchoProximaAventura}</p>`));


  grid.appendChild(leftCol);
  grid.appendChild(rightCol);
  container.appendChild(grid);
}

function initializeCampaignView() {
  const bookContent = document.getElementById('book-content');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const pageIndicator = document.getElementById('page-indicator');

  if (!bookContent) return;

  let currentPage = 0;

  function renderPage(pageNumber) {
    if (pageNumber < 0 || pageNumber >= campaignData.length) return;

    // Usa a biblioteca 'marked' para converter Markdown para HTML
    bookContent.innerHTML = marked.parse(campaignData[pageNumber]);
    currentPage = pageNumber;

    pageIndicator.textContent = `Página ${currentPage + 1} de ${campaignData.length}`;
    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = currentPage === campaignData.length - 1;
  }

  prevPageBtn.addEventListener('click', () => renderPage(currentPage - 1));
  nextPageBtn.addEventListener('click', () => renderPage(currentPage + 1));

  // Renderiza a primeira página inicialmente
  if (campaignData.length > 0) {
    renderPage(0);
  } else {
    bookContent.innerHTML = '<p class="text-secondary">Nenhum capítulo da campanha encontrado.</p>';
    pageIndicator.textContent = 'Página 0 de 0';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
  }
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAllData();

  // Define a aba inicial para 'Testes' ('basico')
  showSection('basico');

  document.getElementById('navigation').addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button && button.dataset.target) {
      showSection(button.dataset.target);
    }
  });

  document.getElementById('content').addEventListener('mousemove', (e) => {
    const target = e.target.closest('.ability-tag');
    const tooltip = document.getElementById('tooltip');
    if (target && tooltip) {
      tooltip.style.display = 'block';
      tooltip.innerHTML = target.dataset.tooltip;
      // Posiciona o tooltip perto do cursor
      tooltip.style.left = `${e.pageX + 15}px`;
      tooltip.style.top = `${e.pageY + 15}px`;
    }
  });

  document.getElementById('content').addEventListener('mouseout', (e) => {
    const target = e.target.closest('.ability-tag');
    const tooltip = document.getElementById('tooltip');
    if (target && tooltip) {
      tooltip.style.display = 'none';
    }
  });
});

// --- Funções do Rolador de Dados ---
function rollDice(numDice) {
  const resultDiv = document.getElementById('dice-result');
  let total = 0;
  let rolls = [];
  let criticals = 0;

  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    rolls.push(roll);
    if (roll === 6) {
      criticals++;
    }
    total += roll;
  }

  const rollsHtml = rolls.map(roll => {
    const color = roll === 6 ? 'text-yellow-500' : (roll === 1 ? 'text-red-600' : 'text-primary');
    return `<span class="dice-span inline-block w-10 h-10 leading-10 text-center rounded-md font-bold text-xl ${color}">${roll}</span>`;
  }).join(' ');

  let resultText = `<div class="flex justify-center gap-2 mb-2">${rollsHtml}</div>`;
  resultText += `<p class="text-2xl font-bold">Total: ${total}</p>`;

  if (criticals > 0) {
    resultText += `<p class="text-yellow-500 font-semibold mt-1">${criticals} Acerto(s) Crítico(s)!</p>`;
  }

  if (rolls.every(roll => roll === 1)) {
    resultText += `<p class="text-red-600 font-bold mt-1">FALHA CRÍTICA!</p>`;
  }

  resultDiv.innerHTML = resultText;
}
