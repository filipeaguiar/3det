// The Supabase client is initialized in supabase-client.js


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

// Função genérica para buscar as regras
async function fetchRules(tableName) {
  const { data, error } = await supabaseClient.from(tableName).select('*');
  if (error) {
    console.error(`Erro ao buscar ${tableName}:`, error);
    return [];
  }
  return data;
}

// Função para buscar personagens, npcs ou monstros e seus dados relacionados
async function fetchCharacterData(tableName, campaignId) {
  // Nota: O Supabase v1 usa `foreignTable` e o v2 usa a sintaxe `foreignTable(*)`.
  // Esta sintaxe é para a versão mais recente da biblioteca supabase-js.
  const selectString = `
            *,
            pericias:${tableName}_pericias(pericias(*)),
            vantagens:${tableName}_vantagens(vantagens(*)),
            desvantagens:${tableName}_desvantagens(desvantagens(*)),
            tecnicas:${tableName}_tecnicas(tecnicas(*))
        `;

  const { data, error } = await supabaseClient
    .from(tableName)
    .select(selectString)
    .eq('campaign_id', campaignId);

  if (error) {
    console.error(`Erro ao buscar ${tableName} para a campanha ${campaignId}:`, error);
    return [];
  }

  // Processa os dados para extrair os objetos aninhados
  return data.map(char => {
    return {
      ...char,
      pericias: char.pericias.map(p => p.pericias).filter(Boolean),
      vantagens: char.vantagens.map(v => v.vantagens).filter(Boolean),
      desvantagens: char.desvantagens.map(d => d.desvantagens).filter(Boolean),
      tecnicas: char.tecnicas.map(t => t.tecnicas).filter(Boolean),
      stats: {
        "Poder": char.Poder,
        "Habilidade": char.Habilidade,
        "Resistência": char.Resistencia,
        "Pontos de Ação": char.Pontos_Acao,
        "Pontos de Mana": char.Pontos_Mana,
        "Pontos de Vida": char.Pontos_Vida
      }
    };
  });
}


// Função para buscar os dados de uma sessão específica
async function fetchSessionDetails(sessionId) {
  const { data: session, error: sessionError } = await supabaseClient
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    console.error(`Erro ao buscar a sessão ${sessionId}:`, sessionError);
    return null;
  }

  const [
    { data: ganchos },
    { data: objetivos },
    { data: segredos },
    { data: tesouros },
    { data: encontros },
    { data: locais }
  ] = await Promise.all([
    supabaseClient.from('session_ganchos_personagens').select('*').eq('session_id', sessionId),
    supabaseClient.from('session_objetivos').select('*').eq('session_id', sessionId),
    supabaseClient.from('session_segredos_rumores').select('*').eq('session_id', sessionId),
    supabaseClient.from('session_tesouros_recompensas').select('*').eq('session_id', sessionId),
    supabaseClient.from('session_encontros_desafios').select('*').eq('session_id', sessionId),
    supabaseClient.from('session_locais_interessantes').select('*, caracteristicas:session_locais_caracteristicas(description)').eq('session_id', sessionId),
  ]);

  return {
    comecoForte: session.comeco_forte,
    ganchoProximaAventura: session.gancho_proxima_aventura,
    ganchosPersonagens: ganchos || [],
    objetivosSessao: {
      principal: objetivos?.find(o => o.type === 'principal')?.description || 'Nenhum',
      secundarios: objetivos?.filter(o => o.type === 'secundario').map(o => o.description) || []
    },
    segredosRumores: segredos?.map(s => s.description) || [],
    tesourosRecompensas: tesouros || [],
    locaisInteressantes: locais?.map(l => ({
      nome: l.name,
      caracteristicas: l.caracteristicas.map(c => c.description)
    })) || [],
    encontrosDesafios: encontros || []
  };
}


async function fetchAllData() {
  console.log("Iniciando busca de todos os dados do Supabase...");

  

  const CAMPAIGN_ID_TO_LOAD = 1;
  const SESSION_ID_TO_LOAD = 1;

  const [
    periciasRes,
    vantagensRes,
    desvantagensRes,
    tecnicasRes,
    personagensRes,
    npcsRes,
    bestiarioRes,
    sessionRes
  ] = await Promise.all([
    fetchRules('pericias'),
    fetchRules('vantagens'),
    fetchRules('desvantagens'),
    fetchRules('tecnicas'),
    fetchCharacterData('personagens', CAMPAIGN_ID_TO_LOAD),
    fetchCharacterData('npcs', CAMPAIGN_ID_TO_LOAD),
    fetchCharacterData('monstros', CAMPAIGN_ID_TO_LOAD),
    fetchSessionDetails(SESSION_ID_TO_LOAD)
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
  if (sessionRes) sessionData = sessionRes;

  loadRules(periciasRes, vantagensRes, desvantagensRes, tecnicasRes, kitsData);
  populatePlayerList();
  populateNpcList();
  populateBestiaryList();
  displaySessionData();
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

function createAbilitySpan(abilityName, abilityDesc) {
  const desc = (abilityDesc || 'Sem descrição.').replace(/"/g, '&quot;');
  return `<span class="ability-tag" data-tooltip="${desc}">${abilityName}</span>`;
}

function displayCharacter(characterId, characterType) {
  let character;
  let detailsContainer;
  let listId;

  if (characterType === 'player') {
    character = playerData.find(p => p.id === characterId);
    detailsContainer = document.getElementById('player-details');
    listId = '#player-list';
  } else if (characterType === 'npc') {
    character = npcData.find(n => n.id === characterId);
    detailsContainer = document.getElementById('npc-details');
    listId = '#npc-list';
  } else { // bestiary
    character = bestiaryData.find(b => b.id === characterId);
    detailsContainer = document.getElementById('bestiary-details');
    listId = '#bestiary-list';
  }

  if (!character) {
    detailsContainer.innerHTML = `<p class="text-center text-error">Personagem não encontrado.</p>`;
    return;
  }

  const createListHtml = (items) => {
    if (!items || items.length === 0) return "Nenhuma";
    return items.map(item => createAbilitySpan(item.name, item.description || item.desc)).join(', ');
  };

  let periciasHtml = createListHtml(character.pericias);
  let vantagensHtml = createListHtml(character.vantagens);
  let tecnicasHtml = createListHtml(character.tecnicas);
  let desvantagensHtml = createListHtml(character.desvantagens);

  const iconMap = { "Poder": "fa-hand-fist", "Habilidade": "fa-brain", "Resistência": "fa-shield-halved", "Pontos de Vida": "fa-heart-pulse", "Pontos de Mana": "fa-wand-magic-sparkles", "Pontos de Ação": "fa-bolt" };
  const stats = character.stats;
  const statsCardsHtml = Object.entries(stats).map(([statName, statValue]) => {
    const iconClass = iconMap[statName] || 'fa-question-circle';
    return `<div class="info-card p-3 rounded-lg flex items-center gap-x-3 shadow-sm"><i class="fa-solid ${iconClass} fa-fw fa-2x text-accent"></i><div><span class="block text-sm text-secondary">${statName}</span><span class="block text-xl font-bold text-primary">${statValue || 0}</span></div></div>`;
  }).join('');

  detailsContainer.innerHTML = `<div class="flex flex-col sm:flex-row gap-6 items-start"><div class="flex-shrink-0 w-full sm:w-48"><img src="${character.image || ''}" alt="Retrato de ${character.name}" class="placeholder-img w-full h-auto object-cover rounded-lg shadow-lg" onerror="this.onerror=null; this.src='https://placehold.co/400x400/e2e8f0/475569?text=${character.name.charAt(0)}';"></div><div class="flex-grow"><h3 class="text-2xl font-bold text-accent">${character.name}</h3><p class="text-md text-secondary italic mb-2">${character.concept}</p><p class="text-sm text-secondary mb-4">${character.archetype} • ${character.pontos} pontos</p><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-list-ol fa-fw text-slate-500"></i><span>Atributos</span></h4><div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-2">${statsCardsHtml}</div></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-graduation-cap fa-fw text-slate-500"></i><span>Perícias</span></h4><p>${periciasHtml}</p></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-up fa-fw text-green-600"></i><span>Vantagens</span></h4><p>${vantagensHtml}</p></div>${tecnicasHtml !== "Nenhuma" ? `<div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-wand-sparkles fa-fw text-blue-500"></i><span>Técnicas</span></h4><p>${tecnicasHtml}</p></div>` : ''}<div><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-down fa-fw text-red-600"></i><span>Desvantagens</span></h4><p>${desvantagensHtml}</p></div></div></div>`;

  document.querySelectorAll(`${listId} .list-item`).forEach(item => item.classList.remove('active'));
  const activeListItem = document.querySelector(`${listId} .list-item[data-id="${character.id}"]`);
  if (activeListItem) activeListItem.classList.add('active');
}


function populateList(listId, data, icon, characterType, onClickHandler) { // Added characterType, moved onClickHandler
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = '';
  data.sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
    const li = document.createElement('li');
    li.dataset.id = item.id;
    li.className = 'list-item p-2 rounded-md cursor-pointer flex items-center gap-x-2';
    li.innerHTML = `<i class="fa-solid ${icon} fa-fw text-slate-500"></i><span>${item.name}</span>`;
    // Ensure onClickHandler is a function before calling it
    if (typeof onClickHandler === 'function') {
      li.onclick = () => onClickHandler(item.id, characterType); // Pass characterType here
    } else {
      console.error('Error: onClickHandler is not a function. Check populateList calls.');
    }
    list.appendChild(li);
  });
}

function populatePlayerList() {
  populateList('player-list', playerData, 'fa-user', 'player', displayCharacter);
}

function populateNpcList() {
  populateList('npc-list', npcData, 'fa-id-badge', 'npc', displayCharacter);
}

function populateBestiaryList() {
  populateList('bestiary-list', bestiaryData, 'fa-skull', 'bestiary', displayCharacter);
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
    if (container) container.innerHTML = '<p class="text-secondary text-center">Dados da sessão não encontrados. Verifique o ID da sessão e se ela existe no Supabase.</p>';
    return;
  }

  container.innerHTML = '';

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
  leftCol.appendChild(createCard('Ganchos dos Personagens', 'fa-user-pen', listFromArray(sessionData.ganchosPersonagens, 'description')));
  leftCol.appendChild(createCard('Objetivos da Sessão', 'fa-bullseye', `
        <h3 class="font-bold text-primary">Principal</h3><p class="text-secondary mb-2">${sessionData.objetivosSessao.principal}</p>
        <h3 class="font-bold text-primary mt-4">Secundários</h3>${listFromArray(sessionData.objetivosSessao.secundarios)}
    `));
  leftCol.appendChild(createCard('Segredos e Rumores', 'fa-user-secret', listFromArray(sessionData.segredosRumores)));
  leftCol.appendChild(createCard('Tesouros e Recompensas', 'fa-gem', listFromArray(sessionData.tesourosRecompensas, 'description_mecanica')));

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
            <h3 class="font-bold text-primary">${desafio.title}</h3>
            <p class="text-secondary">${desafio.description}</p>
            <p class="text-sm text-accent mt-1"><strong>Mecânica:</strong> ${desafio.mecanica}</p>
        </div>`).join('');
  rightCol.appendChild(createCard('Encontros e Desafios', 'fa-dragon', encontrosHtml));
  rightCol.appendChild(createCard('Gancho para Próxima Aventura', 'fa-arrow-right', `<p class="text-secondary">${sessionData.ganchoProximaAventura}</p>`));

  grid.appendChild(leftCol);
  grid.appendChild(rightCol);
  container.appendChild(grid);
}


// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user;
    const container = document.querySelector('.container');
    const userProfileButton = document.createElement('div');
    userProfileButton.id = 'user-profile-button';
    userProfileButton.className = 'absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8';
    container.appendChild(userProfileButton);

    if (user) {
        // Usuário está logado
        document.querySelector('[data-target="mestrando"]').style.display = 'flex';
        document.querySelector('[data-target="sessao"]').style.display = 'flex';

        userProfileButton.innerHTML = `
            <button id="user-menu-button" class="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center">
                <i class="fa-solid fa-user"></i>
            </button>
            <div id="user-menu" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-50">
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Configurações</a>
                <button id="logout-button" class="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Sair</button>
            </div>
        `;

        const userMenuButton = document.getElementById('user-menu-button');
        const userMenu = document.getElementById('user-menu');
        const logoutButton = document.getElementById('logout-button');

        userMenuButton.addEventListener('click', () => {
            userMenu.classList.toggle('hidden');
        });

        logoutButton.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = '/login.html';
        });

        // Ocultar o menu se clicar fora dele
        window.addEventListener('click', (e) => {
            if (!userProfileButton.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
        });

    } else {
        // Usuário não está logado
        document.querySelector('[data-target="mestrando"]').style.display = 'none';
        document.querySelector('[data-target="sessao"]').style.display = 'none';

        userProfileButton.innerHTML = `
            <a href="/login.html" class="w-10 h-10 bg-slate-600 text-white rounded-full flex items-center justify-center">
                <i class="fa-solid fa-right-to-bracket"></i>
            </a>
        `;
    }


  try {
    await fetchAllData();
  } catch (e) {
    console.error("Falha ao inicializar a aplicação:", e);
    const content = document.getElementById('content');
    if (content) content.innerHTML = `<div class="p-8 text-center text-red-500"><strong>Erro Crítico:</strong> Não foi possível carregar os dados. Verifique as credenciais do Supabase e a conexão com a internet. Detalhes no console.</div>`;
  }

  showSection('basico');

  document.getElementById('navigation').addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button && button.dataset.target) {
      showSection(button.dataset.target);
    }
  });

  const tooltip = document.getElementById('tooltip');
  document.getElementById('content').addEventListener('mouseover', (e) => {
    const target = e.target.closest('.ability-tag');
    if (target && tooltip) {
      tooltip.style.display = 'block';
      tooltip.innerHTML = target.dataset.tooltip;
    }
  });
  document.getElementById('content').addEventListener('mousemove', (e) => {
    if (tooltip.style.display === 'block') {
      tooltip.style.left = `${e.pageX + 15}px`;
      tooltip.style.top = `${e.pageY + 15}px`;
    }
  });
  document.getElementById('content').addEventListener('mouseout', (e) => {
    const target = e.target.closest('.ability-tag');
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