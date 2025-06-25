
// --- Global State ---
let currentUser = null;
let activeCampaignId = 1; // ID Fixo para desenvolvimento, idealmente viria de uma seleção do utilizador
let periciasData = {};
let vantagensData = {};
let desvantagensData = {};
let tecnicasData = {};
let kitsData = [];
let playerData = [];
let bestiaryData = [];
let npcData = [];

// --- FUNÇÕES DE AUTENTICAÇÃO ---
async function handleAuthStateChange() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  currentUser = session?.user || null;

  const authView = document.getElementById('auth-view');
  const appView = document.getElementById('app-view');
  const loader = document.getElementById('loader');

  if (currentUser) {
    if (authView) authView.classList.add('hidden');
    // A app-view será mostrada após os dados carregarem
  } else {
    if (authView) authView.classList.remove('hidden');
    if (appView) appView.classList.add('hidden');
    if (loader) loader.classList.add('hidden');
  }
}

// --- FUNÇÕES DE BUSCA DE DADOS (DATA FETCHING) ---
async function fetchSharedData() {
  console.log("A buscar dados partilhados (regras)...");
  const tables = ['pericias', 'vantagens', 'desvantagens', 'tecnicas'];
  const promises = tables.map(table => supabaseClient.from(table).select('*'));
  const [periciasRes, vantagensRes, desvantagensRes, tecnicasRes] = await Promise.all(promises);

  if (periciasRes.error || vantagensRes.error || desvantagensRes.error || tecnicasRes.error) {
    console.error("Erro ao buscar dados partilhados:", periciasRes.error || vantagensRes.error || desvantagensRes.error || tecnicasRes.error);
    return;
  }

  const arrayToObject = (arr) => arr.reduce((acc, item) => { acc[item.name] = item; return acc; }, {});
  periciasData = arrayToObject(periciasRes.data);
  vantagensData = arrayToObject(vantagensRes.data);
  desvantagensData = arrayToObject(desvantagensRes.data);
  tecnicasData = arrayToObject(tecnicasRes.data);

  const kitsList = vantagensRes.data.filter(v => v.name.toLowerCase().startsWith('kit:'));
  kitsData = kitsList;

  loadRules(periciasRes.data, vantagensRes.data, desvantagensRes.data, tecnicasRes.data, kitsData);
}

async function fetchCampaignData(campaignId) {
  console.log(`A buscar dados da campanha ${campaignId}...`);
  const [personagensRes, npcsRes, monstrosRes] = await Promise.all([
    supabaseClient.from('personagens').select('*, pericias:personagens_pericias(*, pericias(*)), vantagens:personagens_vantagens(*, vantagens(*)), desvantagens:personagens_desvantagens(*, desvantagens(*)), tecnicas:personagens_tecnicas(*, tecnicas(*))').eq('campaign_id', campaignId),
    supabaseClient.from('npcs').select('*, pericias:npcs_pericias(*, pericias(*)), vantagens:npcs_vantagens(*, vantagens(*)), desvantagens:npcs_desvantagens(*, desvantagens(*)), tecnicas:npcs_tecnicas(*, tecnicas(*))').eq('campaign_id', campaignId),
    supabaseClient.from('monstros').select('*, pericias:monstros_pericias(*, pericias(*)), vantagens:monstros_vantagens(*, vantagens(*)), desvantagens:monstros_desvantagens(*, desvantagens(*)), tecnicas:monstros_tecnicas(*, tecnicas(*))').eq('campaign_id', campaignId)
  ]);

  if (personagensRes.error || npcsRes.error || monstrosRes.error) {
    console.error("Erro ao buscar dados da campanha:", personagensRes.error || npcsRes.error || monstrosRes.error);
    return;
  }

  const processRelatedData = (item) => {
    item.pericias = item.pericias.map(p => p.pericias ? p.pericias.name : 'inválido');
    item.vantagens = item.vantagens.map(v => v.vantagens ? v.vantagens.name : 'inválido');
    item.desvantagens = item.desvantagens.map(d => d.desvantagens ? d.desvantagens.name : 'inválido');
    item.tecnicas = item.tecnicas.map(t => t.tecnicas ? t.tecnicas.name : 'inválido');
    // Transforma o objeto 'stats' em propriedades de nível superior para consistência
    if (item.stats) {
      for (const key in item.stats) {
        item[key.replace(/ /g, '_')] = item.stats[key];
      }
    }
    return item;
  };

  playerData = personagensRes.data.map(processRelatedData);
  npcData = npcsRes.data.map(processRelatedData);
  bestiaryData = monstrosRes.data.map(processRelatedData);

  populatePlayerList();
  populateNpcList();
  populateBestiaryList();
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

function createAbilitySpan(ability) {
  if (typeof ability !== 'object' || ability === null) {
    return `<span class="ability-tag" data-tooltip="Dados inválidos.">${ability}</span>`;
  }
  const name = ability.name || 'Desconhecido';
  const desc = (ability.description || ability.desc || 'Sem descrição.').replace(/"/g, '&quot;');
  return `<span class="ability-tag" data-tooltip="${desc}">${name}</span>`;
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
    return itemNames.map(itemName => {
      const fullItem = masterData[itemName];
      if (fullItem) return createAbilitySpan(fullItem);
      const baseName = itemName.split(' (')[0];
      const baseItem = masterData[baseName];
      if (baseItem) return createAbilitySpan({ name: itemName, desc: baseItem.description });
      return `<span class="ability-tag" data-tooltip="Descrição não encontrada.">${itemName}</span>`;
    }).join(', ');
  };

  let periciasHtml = createListHtml(player.pericias, periciasData);
  let vantagensHtml = createListHtml(player.vantagens, vantagensData);
  let tecnicasHtml = createListHtml(player.tecnicas, tecnicasData);
  let desvantagensHtml = createListHtml(player.desvantagens, desvantagensData);

  const iconMap = { "Poder": "fa-hand-fist", "Habilidade": "fa-brain", "Resistência": "fa-shield-halved", "Pontos de Vida": "fa-heart-pulse", "Pontos de Mana": "fa-wand-magic-sparkles", "Pontos de Ação": "fa-bolt" };
  const stats = { "Poder": player.Poder, "Habilidade": player.Habilidade, "Resistência": player.Resistencia, "Pontos de Vida": player.Pontos_Vida, "Pontos de Mana": player.Pontos_Mana, "Pontos de Ação": player.Pontos_Acao };
  const statsCardsHtml = Object.entries(stats).map(([statName, statValue]) => {
    const iconClass = iconMap[statName] || 'fa-question-circle';
    return `<div class="info-card p-3 rounded-lg flex items-center gap-x-3 shadow-sm"><i class="fa-solid ${iconClass} fa-fw fa-2x text-accent"></i><div><span class="block text-sm text-secondary">${statName}</span><span class="block text-xl font-bold text-primary">${statValue || 0}</span></div></div>`;
  }).join('');

  playerDetails.innerHTML = `<div class="flex flex-col sm:flex-row gap-6 items-start"><div class="flex-shrink-0 w-full sm:w-48"><img src="${player.image || ''}" alt="Retrato de ${player.name}" class="placeholder-img w-full h-auto object-cover rounded-lg shadow-lg" onerror="this.onerror=null; this.src='https://placehold.co/400x400/e2e8f0/475569?text=${player.name.charAt(0)}';"></div><div class="flex-grow"><h3 class="text-2xl font-bold text-accent">${player.name}</h3><p class="text-md text-secondary italic mb-2">${player.concept}</p><p class="text-sm text-secondary mb-4">${player.archetype} • ${player.pontos}</p><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-list-ol fa-fw text-slate-500"></i><span>Atributos</span></h4><div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-2">${statsCardsHtml}</div></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-graduation-cap fa-fw text-slate-500"></i><span>Perícias</span></h4><p>${periciasHtml}</p></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-up fa-fw text-green-600"></i><span>Vantagens</span></h4><p>${vantagensHtml}</p></div>${tecnicasHtml !== "Nenhuma" ? `<div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-wand-sparkles fa-fw text-blue-500"></i><span>Técnicas</span></h4><p>${tecnicasHtml}</p></div>` : ''}<div><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-down fa-fw text-red-600"></i><span>Desvantagens</span></h4><p>${desvantagensHtml}</p></div></div></div>`;
  document.querySelectorAll('#player-list .list-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`#player-list .list-item[data-id="${player.name}"]`).classList.add('active');
}

function displayNpc(npcName) { /* ... (similar a displayPlayer, usando npcData) ... */ }
function displayEnemy(enemyName) { /* ... (similar a displayPlayer, usando bestiaryData) ... */ }

function populatePlayerList() {
  const playerList = document.getElementById('player-list');
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

  const ruleCategories = {
    'Perícias': { data: pericias, icon: 'fa-graduation-cap', color: 'text-slate-500' },
    'Vantagens': { data: vantagens, icon: 'fa-thumbs-up', color: 'text-green-600' },
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
    if (!category.data) continue;

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
      const filteredRules = allRules.filter(rule => rule.name.toLowerCase().includes(query));
      searchResultsContainer.innerHTML = generateRuleListHtml(filteredRules);
    } else {
      regrasNav.classList.remove('hidden');
      regrasContent.classList.remove('hidden');
      searchResultsContainer.classList.add('hidden');
    }
  });
}

function initializeInitiativeTracker(participants) {
  const list = document.getElementById('initiative-list');
  const card = document.getElementById('initiative-tracker-card');
  if (!list || !card) return;

  if (!participants || participants.length === 0) {
    card.classList.add('hidden');
    return;
  }

  card.classList.remove('hidden');
  list.innerHTML = '';

  participants.forEach(p => {
    const item = document.createElement('li');
    item.dataset.id = p.id;
    item.draggable = true;

    let iconHtml = '';
    if (p.type === 'player') iconHtml = '<i class="fa-solid fa-user fa-fw text-green-500"></i>';
    else if (p.type === 'npc') iconHtml = '<i class="fa-solid fa-id-badge fa-fw text-blue-500"></i>';
    else if (p.type === 'enemy') iconHtml = '<i class="fa-solid fa-skull fa-fw text-red-500"></i>';

    item.className = 'initiative-item p-3 rounded-md shadow-sm flex items-center gap-x-3 bg-slate-100 dark:bg-slate-800';
    item.innerHTML = iconHtml + `<span>${p.name}</span>`;
    list.appendChild(item);
  });

  let draggedItem = null;
  list.addEventListener('dragstart', (e) => {
    draggedItem = e.target;
    setTimeout(() => { e.target.classList.add('dragging'); }, 0);
  });
  list.addEventListener('dragend', () => { if (draggedItem) { draggedItem.classList.remove('dragging'); draggedItem = null; } });
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(list, e.clientY);
    const currentDragged = document.querySelector('.dragging');
    if (currentDragged) {
      if (afterElement == null) { list.appendChild(currentDragged); }
      else { list.insertBefore(currentDragged, afterElement); }
    }
  });
  list.addEventListener('touchstart', (e) => { const touchItem = e.target.closest('.initiative-item'); if (touchItem) { touchItem.classList.add('dragging'); draggedItem = touchItem; } }, { passive: true });
  list.addEventListener('touchmove', (e) => { if (!draggedItem) return; e.preventDefault(); const touch = e.touches[0]; const afterElement = getDragAfterElement(list, touch.clientY); if (afterElement == null) { list.appendChild(draggedItem); } else { list.insertBefore(draggedItem, afterElement); } }, { passive: false });
  list.addEventListener('touchend', () => { if (draggedItem) { draggedItem.classList.remove('dragging'); draggedItem = null; } });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.initiative-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else { return closest; }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
}

async function displaySessionData(sessionId) {
  const container = document.getElementById('session-content');
  const initiativeCard = document.getElementById('initiative-tracker-card');

  container.innerHTML = '<p class="text-secondary text-center">A carregar dados da sessão...</p>';
  if (initiativeCard) initiativeCard.classList.add('hidden');

  try {
    const { data: session, error } = await supabaseClient.from('sessions')
      .select('*, ganchos_personagens:session_ganchos_personagens(*), locais_interessantes:session_locais_interessantes(*, caracteristicas:session_locais_caracteristicas(*)), npcs_importantes:session_npcs_importantes(*, npcs(*)), objetivos:session_objetivos(*), segredos_rumores:session_segredos_rumores(*), encontros_desafios:session_encontros_desafios(*), tesouros_recompensas:session_tesouros_recompensas(*)')
      .eq('id', sessionId).single();

    if (error) throw error;

    const initiativeParticipants = [];
    playerData.forEach(p => initiativeParticipants.push({ id: p.name, name: p.name, type: 'player' }));
    if (session.npcs_importantes) {
      session.npcs_importantes.forEach(link => {
        if (link.npcs) initiativeParticipants.push({ id: link.npcs.name, name: link.npcs.name, type: 'npc' });
      });
    }

    const monstersToRender = [];
    if (session.encontros_desafios) {
      const monsterPattern = /(?:(\d+)\s*x\s*)?\[([^\]]+)\]/gi;
      session.encontros_desafios.forEach(encounter => {
        let match;
        while ((match = monsterPattern.exec(encounter.mecanica)) !== null) {
          const quantity = parseInt(match[1] || '1', 10);
          const name = match[2].trim();
          const monsterData = bestiaryData.find(m => m.name.toLowerCase() === name.toLowerCase());
          if (monsterData) {
            for (let i = 0; i < quantity; i++) {
              const uniqueName = quantity > 1 ? `${name} ${i + 1}` : name;
              initiativeParticipants.push({ id: uniqueName, name: uniqueName, type: 'enemy' });
              monstersToRender.push({
                uniqueId: `${monsterData.name.replace(/\s/g, '-')}-${i}`, name: monsterData.name, instance: i + 1,
                hp: monsterData.Pontos_Vida || 0, mp: monsterData.Pontos_Mana || 0,
                statsString: `P${monsterData.Poder} H${monsterData.Habilidade} R${monsterData.Resistencia}`,
                vantagens: monsterData.vantagens || [], desvantagens: monsterData.desvantagens || []
              });
            }
          }
        }
      });
    }

    initializeInitiativeTracker(initiativeParticipants);

    container.innerHTML = '';

    const createCard = (title, icon, content) => {
      if (!content) return null;
      const card = document.createElement('div');
      card.className = 'info-card p-6 rounded-lg shadow';
      card.innerHTML = `<h2 class="text-xl font-bold mb-4 text-accent flex items-center gap-x-2"><i class="fa-solid ${icon} fa-fw"></i><span>${title}</span></h2>${content}`;
      return card;
    };

    const listFromArray = (items, key = 'description') => {
      if (!items || items.length === 0) return '<p class="text-secondary">Nenhum.</p>';
      return `<ul class="list-disc list-inside space-y-2">${items.map(item => `<li>${item[key]}</li>`).join('')}</ul>`;
    };

    const leftCol = document.createElement('div');
    leftCol.className = 'space-y-6';
    const rightCol = document.createElement('div');
    rightCol.className = 'space-y-6';

    leftCol.appendChild(createCard('Começo Forte', 'fa-rocket', `<p class="text-secondary">${session.comeco_forte}</p>`));
    leftCol.appendChild(createCard('Objetivos da Sessão', 'fa-bullseye', `<h3 class="font-bold text-primary">Principal</h3>${listFromArray(session.objetivos.filter(o => o.type === 'principal'))}<h3 class="font-bold text-primary mt-4">Secundários</h3>${listFromArray(session.objetivos.filter(o => o.type === 'secundario'))}`));
    leftCol.appendChild(createCard('Ganchos dos Personagens', 'fa-user-pen', listFromArray(session.ganchos_personagens)));
    leftCol.appendChild(createCard('NPCs Importantes', 'fa-id-badge', listFromArray(session.npcs_importantes.map(n => ({ description: n.npcs.name })))));
    leftCol.appendChild(createCard('Segredos e Rumores', 'fa-user-secret', listFromArray(session.segredos_rumores)));

    rightCol.appendChild(createCard('Locais Interessantes', 'fa-map-signs', session.locais_interessantes.map(local => `<div class="mb-4"><h3 class="font-bold text-primary">${local.name}</h3>${listFromArray(local.caracteristicas)}</div>`).join('')));
    rightCol.appendChild(createCard('Encontros e Desafios', 'fa-dragon', session.encontros_desafios.map(desafio => `<div class="mb-4"><h3 class="font-bold text-primary">${desafio.title}</h3><p class="text-secondary">${desafio.description}</p><p class="text-sm text-accent mt-1"><strong>Mecânica:</strong> ${desafio.mecanica}</p></div>`).join('')));

    if (monstersToRender.length > 0) {
      const encounterListHtml = monstersToRender.map((monster, n) => {
        let hpMarkers = Array.from({ length: monster.hp }, (_, h) => `<div class="hp-marker"><input type="checkbox" id="hp-${n}-${h}" data-index="${h}"><label for="hp-${n}-${h}"></label></div>`).join('');
        let mpMarkers = Array.from({ length: monster.mp }, (_, p) => `<div class="mp-marker"><input type="checkbox" id="mp-${n}-${p}" data-index="${p}"><label for="mp-${n}-${p}"></label></div>`).join('');
        const totalInstances = monstersToRender.filter(m => m.name === monster.name).length;
        const vantagensHtml = monster.vantagens.length > 0 ? `<p class="text-sm"><strong class="text-green-600">Vantagens:</strong> ${monster.vantagens.join(', ')}</p>` : '';
        const desvantagensHtml = monster.desvantagens.length > 0 ? `<p class="text-sm"><strong class="text-red-600">Desvantagens:</strong> ${monster.desvantagens.join(', ')}</p>` : '';
        return `<div class="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0"><h4 class="font-bold text-lg text-primary flex items-center gap-x-2"><i class="fa-solid fa-skull fa-fw"></i> ${monster.name} ${totalInstances > 1 ? monster.instance : ''}</h4><div class="pl-6 text-secondary"><p class="text-sm"><strong>Stats:</strong> ${monster.statsString}</p>${vantagensHtml}${desvantagensHtml}<div class="flex items-center gap-x-2 mt-2"><strong class="text-sm w-8">PV:</strong><div class="flex flex-wrap gap-1 tracker-group">${hpMarkers}</div></div><div class="flex items-center gap-x-2 mt-1"><strong class="text-sm w-8">PM:</strong><div class="flex flex-wrap gap-1 tracker-group">${mpMarkers}</div></div></div></div>`;
      }).join('');
      rightCol.appendChild(createCard('Tracker de Encontros', 'fa-swords', encounterListHtml));
    }

    rightCol.appendChild(createCard('Tesouros e Recompensas', 'fa-gem', session.tesouros_recompensas.map(tesouro => `<div class="mb-4"><h3 class="font-bold text-primary">${tesouro.name}</h3><p class="text-secondary">${tesouro.description_mecanica}</p></div>`).join('')));
    rightCol.appendChild(createCard('Gancho para Próxima Aventura', 'fa-arrow-right', `<p class="text-secondary">${session.gancho_proxima_aventura}</p>`));

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6';
    grid.appendChild(leftCol);
    grid.appendChild(rightCol);
    container.appendChild(grid);

  } catch (error) {
    console.error("Erro ao carregar ou renderizar dados da sessão:", error);
    container.innerHTML = `<p class="text-center text-error">Não foi possível carregar os dados da sessão.</p>`;
    if (initiativeCard) initiativeCard.classList.add('hidden');
  }
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
  const appView = document.getElementById('app-view');
  const authView = document.getElementById('auth-view');
  const loader = document.getElementById('loader');

  if (loader) loader.classList.remove('hidden');
  if (appView) appView.classList.add('hidden');
  if (authView) authView.classList.add('hidden');

  async function initializeApp() {
    await handleAuthStateChange();
    if (!currentUser) {
      console.log("Nenhum utilizador logado.");
      if (loader) loader.classList.add('hidden');
      if (authView) authView.classList.remove('hidden');
      return;
    }

    console.log("Utilizador autenticado. A carregar dados...");
    await Promise.all([
      fetchSharedData(),
      fetchCampaignData(activeCampaignId)
    ]);

    console.log("Todos os dados carregados. A renderizar a aplicação.");
    if (loader) loader.classList.add('hidden');
    if (appView) appView.classList.remove('hidden');

    await displaySessionData(1);
    showSection('sessao');
  }

  await initializeApp();

  document.getElementById('navigation').addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button && button.dataset.target) {
      if (button.dataset.target === 'sessao') {
        displaySessionData(1);
      }
      showSection(button.dataset.target);
    }
  });

  document.getElementById('content').addEventListener('click', (e) => {
    if (e.target.matches('.tracker-group input[type="checkbox"]')) {
      const checkbox = e.target;
      const group = checkbox.closest('.tracker-group');
      if (!group) return;
      const checkboxes = Array.from(group.querySelectorAll('input[type="checkbox"]'));
      const clickedIndex = parseInt(checkbox.dataset.index, 10);
      const isChecked = checkbox.checked;
      checkboxes.forEach((cb, index) => {
        if (isChecked) { cb.checked = index <= clickedIndex; }
        else { cb.checked = index < clickedIndex; }
      });
    }
  });
});


