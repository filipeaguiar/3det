// --- Armazenamento de Dados Globais ---
let playerData = [];
let bestiaryData = [];
let npcData = [];
let periciasData = {};
let vantagensData = {};
let desvantagensData = {};
let tecnicasData = {};
let campaignPages = [];
let currentPageIndex = 0;

// --- Funções de Navegação e Utilitários ---
function showSection(targetId) {
  document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(button => button.classList.remove('active'));

  const sectionToShow = document.getElementById(targetId);
  if (sectionToShow) sectionToShow.classList.add('active');

  const buttonToActivate = document.querySelector(`[data-target="${targetId}"]`);
  if (buttonToActivate) buttonToActivate.classList.add('active');
}

function rollDice(numDice) {
  const resultDiv = document.getElementById('dice-result');
  let rolls = [];
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    rolls.push(roll);
    total += roll;
  }
  const rollsString = rolls.map(r => `<span class="dice-span inline-block px-2 py-1 rounded mx-1">${r}</span>`).join(' + ');
  resultDiv.innerHTML = `<p class="text-sm text-secondary mb-2">Rolagem (${numDice}D): ${rollsString}</p><p class="text-3xl font-bold">${total}</p>`;
}

function generateNPC() {
  const npcData = {
    nomes: ["Sandro", "Niele", "Lisandra", "Tork", "Asimel", "Nidae", "Holly", "Pike", "Lucerne", "Sovnya", "Falkar", "Rin", "Shin", "Karator", "Avelle", "Ibelin", "Ketua", "Gadget", "Arturo", "Finesa", "Adran", "Akira", "Yuri", "Kenzo", "Raul", "Breno", "Kaio", "Elara", "Mila", "Zane", "Kael", "Lyra", "Orion", "Selene", "Jorah"],
    personalidade: ["Tímido/Covarde", "Otimista/Bobalhão", "Sério/Ranzinza", "Arrogante/Exibido", "Honesto/Nobre", "Misterioso/Calado"],
    peculiaridade: ["Tique nervoso", "Fala gritando", "Usa gírias estranhas", "Viciado em alguma comida", "Tem um animal de estimação exótico", "Veste-se de forma bizarra"],
    motivacao: ["Dinheiro", "Vingança", "Proteger alguém", "Glória e fama", "Conhecimento", "Apenas pelo caos"]
  };
  const resultDiv = document.getElementById('npc-result');
  const nome = npcData.nomes[Math.floor(Math.random() * npcData.nomes.length)];
  const personalidade = npcData.personalidade[Math.floor(Math.random() * npcData.personalidade.length)];
  const peculiaridade = npcData.peculiaridade[Math.floor(Math.random() * npcData.peculiaridade.length)];
  const motivacao = npcData.motivacao[Math.floor(Math.random() * npcData.motivacao.length)];
  resultDiv.innerHTML = `<div class="text-left w-full space-y-2"><p><strong>Nome:</strong> ${nome}</p><p><strong>Personalidade:</strong> ${personalidade}</p><p><strong>Peculiaridade:</strong> ${peculiaridade}</p><p><strong>Motivação:</strong> ${motivacao}</p></div>`;
}

function createAbilitySpan(ability) {
  return `<span class="ability-tag" data-tooltip="${ability.desc}">${ability.name}</span>`;
}

// --- Funções de Exibição de Fichas ---
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
      if (baseItem) return createAbilitySpan({ name: itemName, desc: baseItem.desc });
      return `<span class="ability-tag" data-tooltip="Descrição não encontrada.">${itemName}</span>`;
    }).join(', ');
  };

  let periciasHtml = createListHtml(player.pericias, periciasData);
  let vantagensHtml = createListHtml(player.vantagens, vantagensData);
  let tecnicasHtml = createListHtml(player.tecnicas, tecnicasData);
  let desvantagensHtml = createListHtml(player.desvantagens, desvantagensData);

  const iconMap = {
    "Poder": "fa-hand-fist", "Habilidade": "fa-brain", "Resistência": "fa-shield-halved",
    "Pontos de Vida": "fa-heart-pulse", "Pontos de Mana": "fa-wand-magic-sparkles", "Pontos de Ação": "fa-bolt"
  };
  const statsCardsHtml = Object.entries(player.stats).map(([statName, statValue]) => {
    const iconClass = iconMap[statName] || 'fa-question-circle';
    return `<div class="info-card p-3 rounded-lg flex items-center gap-x-3 shadow-sm"><i class="fa-solid ${iconClass} fa-fw fa-2x text-accent"></i><div><span class="block text-sm text-secondary">${statName}</span><span class="block text-xl font-bold text-primary">${statValue}</span></div></div>`;
  }).join('');

  playerDetails.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-6 items-start">
            <div class="flex-shrink-0 w-full sm:w-48"><img src="./img/${player.image}" alt="Retrato de ${player.name}" class="placeholder-img w-full h-auto object-cover rounded-lg shadow-lg" onerror="this.onerror=null; this.src='https://placehold.co/400x400/e2e8f0/475569?text=${player.name.charAt(0)}';"></div>
            <div class="flex-grow">
                <h3 class="text-2xl font-bold text-accent">${player.name}</h3>
                <p class="text-md text-secondary italic mb-2">${player.concept}</p>
                <p class="text-sm text-secondary mb-4">${player.archetype} • ${player.pontos}</p>
                <div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-list-ol fa-fw text-slate-500"></i><span>Atributos</span></h4><div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-2">${statsCardsHtml}</div></div>
                <div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-graduation-cap fa-fw text-slate-500"></i><span>Perícias</span></h4><p>${periciasHtml}</p></div>
                <div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-up fa-fw text-green-600"></i><span>Vantagens</span></h4><p>${vantagensHtml}</p></div>
                ${tecnicasHtml !== "Nenhuma" ? `<div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-wand-sparkles fa-fw text-blue-500"></i><span>Técnicas</span></h4><p>${tecnicasHtml}</p></div>` : ''}
                <div><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-down fa-fw text-red-600"></i><span>Desvantagens</span></h4><p>${desvantagensHtml}</p></div>
            </div>
        </div>`;

  document.querySelectorAll('#player-list .list-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`#player-list .list-item[data-id="${playerName}"]`).classList.add('active');
}


function loadRules(pericias, vantagens, desvantagens, tecnicas) {
  const regrasNav = document.getElementById('regras-nav');
  const regrasContent = document.getElementById('regras-content');
  const searchInput = document.getElementById('regras-search-input');
  const searchResultsContainer = document.getElementById('regras-search-results');

  const ruleCategories = {
    'Perícias': { data: pericias, icon: 'fa-graduation-cap', color: 'text-slate-500' },
    'Vantagens': { data: vantagens, icon: 'fa-thumbs-up', color: 'text-green-600' },
    'Desvantagens': { data: desvantagens, icon: 'fa-thumbs-down', color: 'text-red-600' },
    'Técnicas': { data: tecnicas, icon: 'fa-wand-sparkles', color: 'text-blue-500' }
  };

  // 1. Agrega todas as regras em uma única lista para a busca, enriquecendo cada item
  const allRules = [];
  for (const categoryName in ruleCategories) {
    const category = ruleCategories[categoryName];
    category.data.forEach(item => {
      allRules.push({
        ...item, // Copia as propriedades existentes (name, desc, cost, etc.)
        categoryName: categoryName,
        icon: category.icon,
        color: category.color
      });
    });
  }

  // 2. Função de renderização atualizada para lidar com os novos formatos
  const generateRuleListHtml = (items) => {
    if (!items || items.length === 0) {
      return '<p class="text-secondary text-center mt-4">Nenhum resultado encontrado.</p>';
    }
    items.sort((a, b) => a.name.localeCompare(b.name));

    return items.map(item => {
      let detailsHtml;

      // Renderização especial e detalhada para Técnicas
      if (item.categoryName === 'Técnicas') {
        detailsHtml = `
                    <dd class="text-base text-secondary mt-1 pl-8 leading-relaxed">${item.desc}</dd>
                    <dd class="text-sm text-secondary mt-3 pl-8 leading-relaxed space-y-2">
                        ${item.requirements ? `<p><i class="fa-solid fa-check-double fa-fw text-slate-500"></i> <strong>Requisitos:</strong> ${item.requirements}</p>` : ''}
                        ${item.cost ? `<p><i class="fa-solid fa-fire-flame-curved fa-fw text-blue-500"></i> <strong>Custo:</strong> ${item.cost}</p>` : ''}
                        ${item.duration ? `<p><i class="fa-solid fa-hourglass-half fa-fw text-slate-500"></i> <strong>Duração:</strong> ${item.duration}</p>` : ''}
                    </dd>
                `;
      } else {
        // Renderização padrão para as outras categorias
        detailsHtml = `<dd class="text-base text-secondary mt-1 pl-8 leading-relaxed">${item.desc}</dd>`;
      }

      return `
                <div class="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                    <dt class="font-bold text-lg text-primary flex items-center gap-x-3">
                        <i class="fa-solid ${item.icon} fa-fw ${item.color} text-xl"></i>
                        <span>${item.name} ${item.cost && item.categoryName !== 'Técnicas' ? `(${item.cost})` : ''}</span>
                    </dt>
                    ${detailsHtml}
                </div>
            `;
    }).join('');
  };

  // 3. Lógica das abas (agora usa os dados enriquecidos de 'allRules')
  regrasNav.innerHTML = '';
  regrasContent.innerHTML = '';
  for (const categoryName in ruleCategories) {
    const category = ruleCategories[categoryName];
    const button = document.createElement('button');
    button.className = 'nav-btn px-4 py-2 rounded-lg text-sm flex items-center gap-x-2';
    button.dataset.target = `regras-${categoryName.toLowerCase()}`;
    button.innerHTML = `<i class="fa-solid ${category.icon} fa-fw ${category.color}"></i> <span>${categoryName}</span>`;
    regrasNav.appendChild(button);

    const contentDiv = document.createElement('div');
    contentDiv.id = `regras-${categoryName.toLowerCase()}`;
    contentDiv.className = 'rule-content hidden mt-6';

    // Filtra 'allRules' para obter apenas os itens desta categoria
    const categoryItems = allRules.filter(rule => rule.categoryName === categoryName);
    contentDiv.innerHTML = `<dl>${generateRuleListHtml(categoryItems)}</dl>`;
    regrasContent.appendChild(contentDiv);
  }

  // O restante da lógica para navegação e busca continua igual e funcional
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

function displayNpc(npcName) {
  const npcDetails = document.getElementById('npc-details');
  const npc = npcData.find(n => n.name === npcName);
  if (!npc) {
    npcDetails.innerHTML = `<p class="text-center text-error">NPC não encontrado.</p>`;
    return;
  }

  const createListHtml = (itemNames, masterData) => {
    if (!itemNames || itemNames.length === 0) return "Nenhuma";
    return itemNames.map(itemName => {
      const fullItem = masterData[itemName];
      if (fullItem) return createAbilitySpan(fullItem);
      const baseName = itemName.split(' (')[0];
      const baseItem = masterData[baseName];
      if (baseItem) return createAbilitySpan({ name: itemName, desc: baseItem.desc });
      return `<span class="ability-tag" data-tooltip="Descrição não encontrada.">${itemName}</span>`;
    }).join(', ');
  };

  let periciasHtml = createListHtml(npc.pericias, periciasData);
  let vantagensHtml = createListHtml(npc.vantagens, vantagensData);
  let tecnicasHtml = createListHtml(npc.tecnicas, tecnicasData);
  let desvantagensHtml = createListHtml(npc.desvantagens, desvantagensData);

  const iconMap = {
    "Poder": "fa-hand-fist", "Habilidade": "fa-brain", "Resistência": "fa-shield-halved", "Pontos de Ação": "fa-bolt",
    "Pontos de Mana": "fa-wand-magic-sparkles", "Pontos de Vida": "fa-heart-pulse"
  };
  const statsCardsHtml = Object.entries(npc.stats).map(([statName, statValue]) => {
    const iconClass = iconMap[statName] || 'fa-question-circle';
    return `<div class="info-card p-3 rounded-lg flex items-center gap-x-3 shadow-sm"><i class="fa-solid ${iconClass} fa-fw fa-2x text-accent"></i><div><span class="block text-sm text-secondary">${statName}</span><span class="block text-xl font-bold text-primary">${statValue}</span></div></div>`;
  }).join('');

  npcDetails.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-6 items-start">
            <div class="flex-shrink-0 w-full sm:w-48"><img src="./img/${npc.image}" alt="Retrato de ${npc.name}" class="placeholder-img w-full h-auto object-cover rounded-lg shadow-lg" onerror="this.onerror=null; this.src='https://placehold.co/400x400/e2e8f0/475569?text=${npc.name.charAt(0)}';"></div>
            <div class="flex-grow">
                <h3 class="text-2xl font-bold text-accent">${npc.name}</h3>
                <p class="text-md text-secondary italic mb-2">${npc.archetype} • ${npc.pontos}</p>
                <p class="text-sm text-secondary mb-4">${npc.concept}</p>
                <div class="mb-4"><div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-2">${statsCardsHtml}</div></div>
                <div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-graduation-cap fa-fw text-slate-500"></i><span>Perícias</span></h4><p>${periciasHtml}</p></div>
                <div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-up fa-fw text-green-600"></i><span>Vantagens</span></h4><p>${vantagensHtml}</p></div>
                ${tecnicasHtml !== "Nenhuma" ? `<div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-wand-sparkles fa-fw text-blue-500"></i><span>Técnicas</span></h4><p>${tecnicasHtml}</p></div>` : ''}
                <div><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-down fa-fw text-red-600"></i><span>Desvantagens</span></h4><p>${desvantagensHtml}</p></div>
            </div>
        </div>`;

  document.querySelectorAll('#npc-list .list-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`#npc-list .list-item[data-id="${npcName}"]`).classList.add('active');
}

function displayEnemy(enemyName) {
  const bestiaryDetails = document.getElementById('bestiary-details');
  const enemy = bestiaryData.find(e => e.name === enemyName);
  if (!enemy) {
    bestiaryDetails.innerHTML = `<p class="text-center text-error">Inimigo não encontrado.</p>`;
    return;
  }

  const createListHtml = (itemNames, masterData) => {
    if (!itemNames || itemNames.length === 0) return "Nenhuma";
    return itemNames.map(itemName => {
      const fullItem = masterData[itemName];
      if (fullItem) return createAbilitySpan(fullItem);
      const baseName = itemName.split(' (')[0];
      const baseItem = masterData[baseName];
      if (baseItem) return createAbilitySpan({ name: itemName, desc: baseItem.desc });
      return `<span class="ability-tag" data-tooltip="Descrição não encontrada.">${itemName}</span>`;
    }).join(', ');
  };

  let periciasHtml = createListHtml(enemy.pericias, periciasData);
  let vantagensHtml = createListHtml(enemy.vantagens, vantagensData);
  let tecnicasHtml = createListHtml(enemy.tecnicas, tecnicasData);
  let desvantagensHtml = createListHtml(enemy.desvantagens, desvantagensData);

  const iconMap = {
    "Poder": "fa-hand-fist", "Habilidade": "fa-brain", "Resistência": "fa-shield-halved",
    "Pontos de Vida": "fa-heart-pulse", "Pontos de Mana": "fa-wand-magic-sparkles", "Pontos de Ação": "fa-bolt"
  };
  const statsCardsHtml = Object.entries(enemy.stats).map(([statName, statValue]) => {
    const iconClass = iconMap[statName] || 'fa-question-circle';
    return `<div class="info-card p-3 rounded-lg flex items-center gap-x-3 shadow-sm"><i class="fa-solid ${iconClass} fa-fw fa-2x text-accent"></i><div><span class="block text-sm text-secondary">${statName}</span><span class="block text-xl font-bold text-primary">${statValue}</span></div></div>`;
  }).join('');

  bestiaryDetails.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-6 items-start">
            <div class="flex-shrink-0 w-full sm:w-48"><img src="./img/${enemy.image}" alt="Retrato de ${enemy.name}" class="placeholder-img w-full h-auto object-cover rounded-lg shadow-lg" onerror="this.onerror=null; this.src='https://placehold.co/400x400/e2e8f0/475569?text=${enemy.name.charAt(0)}';"></div>
            <div class="flex-grow">
                <h3 class="text-2xl font-bold text-accent">${enemy.name}</h3>
                <p class="text-md text-secondary italic mb-2">${enemy.archetype} • ${enemy.pontos}</p>
                <p class="text-sm text-secondary mb-4">${enemy.concept}</p>
                <div class="mb-4"><div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-2">${statsCardsHtml}</div></div>
                <div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-graduation-cap fa-fw text-slate-500"></i><span>Perícias</span></h4><p>${periciasHtml}</p></div>
                <div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-up fa-fw text-green-600"></i><span>Vantagens</span></h4><p>${vantagensHtml}</p></div>
                ${tecnicasHtml !== "Nenhuma" ? `<div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-wand-sparkles fa-fw text-blue-500"></i><span>Técnicas</span></h4><p>${tecnicasHtml}</p></div>` : ''}
                <div><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-down fa-fw text-red-600"></i><span>Desvantagens</span></h4><p>${desvantagensHtml}</p></div>
            </div>
        </div>`;

  document.querySelectorAll('#bestiary-list .list-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`#bestiary-list .list-item[data-id="${enemyName}"]`).classList.add('active');
}

// --- Funções de Conteúdo Dinâmico ---
async function loadCampaign() {
  const bookContent = document.getElementById('book-content');
  try {
    const indexResponse = await fetch('Campanha/index.json');
    if (!indexResponse.ok) throw new Error('Arquivo Campanha/index.json não encontrado.');
    const filesToLoad = await indexResponse.json();
    const pagePromises = filesToLoad.map(async (filename) => {
      try {
        const pageResponse = await fetch(`Campanha/${filename}`);
        if (pageResponse.ok) return marked.parse(await pageResponse.text());
        console.warn(`Arquivo de campanha "${filename}" não encontrado.`);
        return null;
      } catch (error) {
        console.error(`Erro ao carregar "${filename}":`, error);
        return null;
      }
    });
    campaignPages = (await Promise.all(pagePromises)).filter(p => p !== null);
    if (campaignPages.length > 0) {
      currentPageIndex = 0;
      displayCampaignPage(currentPageIndex);
    } else {
      bookContent.innerHTML = `<p class="text-secondary text-center">Nenhuma página de campanha foi carregada.</p>`;
    }
  } catch (error) {
    console.error("Erro ao carregar o índice da campanha:", error);
    bookContent.innerHTML = `<div class="text-center"><h3 class="font-bold text-error">Não foi possível carregar a campanha.</h3><p class="text-secondary mt-2">Verifique se o arquivo <strong>Campanha/index.json</strong> existe.</p></div>`;
  }
}

function displayCampaignPage(index) {
  const bookContent = document.getElementById('book-content');
  const pageIndicator = document.getElementById('page-indicator');
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  bookContent.innerHTML = campaignPages[index];
  pageIndicator.innerHTML = `<i class="fa-solid fa-file-lines fa-fw text-slate-500"></i> <span>Página ${index + 1} de ${campaignPages.length}</span>`;
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === campaignPages.length - 1;
}

async function loadSession() {
  const sessionContainer = document.getElementById('session-content');
  try {
    const response = await fetch('sessao.json');
    if (!response.ok) throw new Error('Arquivo sessao.json não encontrado.');
    const data = await response.json();
    let finalHtml = '';
    const createCard = (title, icon, content) => `<div class="info-card p-6 rounded-lg shadow"><h2 class="text-xl font-bold mb-4 text-accent flex items-center gap-x-2"><i class="fa-solid ${icon} fa-fw"></i><span>${title}</span></h2>${content}</div>`;

    finalHtml += createCard('Começo Forte', 'fa-wand-sparkles', `<p class="text-secondary leading-relaxed">${data.comecoForte}</p>`);
    finalHtml += createCard('Ganchos dos Personagens', 'fa-link', `<ul class="list-none space-y-2">${data.ganchosPersonagens.map(g => `<li class="flex items-start gap-x-2"><i class="fa-solid fa-link fa-fw mt-1 text-slate-500"></i><span>${g}</span></li>`).join('')}</ul>`);
    const locaisContent = data.locaisInteressantes.map(l => `<div class="mb-4"><h4 class="font-semibold flex items-center gap-x-2"><i class="fa-solid fa-location-dot fa-fw text-slate-500"></i><span>${l.nome}</span></h4><ul class="list-disc list-inside pl-2 text-secondary text-sm space-y-1 mt-1">${l.caracteristicas.map(c => `<li>${c}</li>`).join('')}</ul></div>`).join('');
    const npcsContent = data.npcsImportantes.map(npcName => {
      const npcFullData = npcData.find(n => n.name.includes(npcName));
      if (npcFullData) {
        const statsLineHtml = `
    <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-secondary my-1">
        <span class="flex items-center gap-x-1" title="Poder">
            <i class="fa-solid fa-hand-fist fa-fw text-slate-500"></i>
            <span>${npcFullData.stats.Poder}</span>
        </span>
        <span class="flex items-center gap-x-1" title="Habilidade">
            <i class="fa-solid fa-brain fa-fw text-slate-500"></i>
            <span>${npcFullData.stats.Habilidade}</span>
        </span>
        <span class="flex items-center gap-x-1" title="Resistência">
            <i class="fa-solid fa-shield-halved fa-fw text-slate-500"></i>
            <span>${npcFullData.stats.Resistência}</span>
        </span>
        <span class="flex items-center gap-x-1" title="Pontos de Ação">
            <i class="fa-solid fa-bolt fa-fw text-yellow-500"></i>
            <span>${npcFullData.stats['Pontos de Ação']}</span>
        </span>
        <span class="flex items-center gap-x-1" title="Pontos de Mana">
            <i class="fa-solid fa-wand-magic-sparkles fa-fw text-blue-500"></i>
            <span>${npcFullData.stats['Pontos de Mana']}</span>
        </span>
        <span class="flex items-center gap-x-1" title="Pontos de Vida">
            <i class="fa-solid fa-heart-pulse fa-fw text-red-500"></i>
            <span>${npcFullData.stats['Pontos de Vida']}</span>
        </span>
    </div>
`; const createCharacteristicList = (title, items, icon, colorClass) => { if (!items || items.length === 0) return ''; return `<p class="text-xs text-secondary my-1"><i class="fa-solid ${icon} fa-fw ${colorClass || 'text-slate-500'}"></i> <b>${title}:</b> ${items.join(', ')}</p>`; };
        const periciasLine = createCharacteristicList("Perícias", npcFullData.pericias, "fa-graduation-cap");
        const vantagensLine = createCharacteristicList("Vantagens", npcFullData.vantagens, "fa-thumbs-up", "text-green-600");
        const tecnicasLine = createCharacteristicList("Técnicas", npcFullData.tecnicas, "fa-wand-sparkles", "text-blue-500");
        const desvantagensLine = createCharacteristicList("Desvantagens", npcFullData.desvantagens, "fa-thumbs-down", "text-red-600");
        return `<div class="mb-4"><h4 class="font-semibold flex items-center gap-x-2"><i class="fa-solid fa-id-badge fa-fw text-slate-500"></i><span>${npcFullData.name}</span></h4><div class="pl-6 text-sm"><p class="text-secondary italic text-xs mb-1">${npcFullData.concept}</p>${statsLineHtml}${periciasLine}${vantagensLine}${tecnicasLine}${desvantagensLine}</div></div>`;
      }
      return `<div class="mb-4"><h4 class="font-semibold flex items-center gap-x-2"><i class="fa-solid fa-id-badge fa-fw text-slate-500"></i><span>${npcName}</span></h4></div>`;
    }).join('');
    finalHtml += `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">${createCard('Locais Interessantes', 'fa-map-location-dot', locaisContent)}${createCard('NPCs Importantes', 'fa-users-line', npcsContent)}</div>`;
    finalHtml += createCard('Objetivos da Sessão', 'fa-bullseye', `<div><h4 class="font-semibold flex items-center gap-x-2 mb-2"><i class="fa-solid fa-star fa-fw text-yellow-500"></i><span>Principal</span></h4><p class="text-secondary pl-6 mb-3">${data.objetivosSessao.principal}</p><h4 class="font-semibold flex items-center gap-x-2 mb-2"><i class="fa-solid fa-list-check fa-fw text-slate-500"></i><span>Secundários</span></h4><ul class="list-disc list-inside pl-2 text-secondary text-sm space-y-1">${data.objetivosSessao.secundarios.map(s => `<li>${s}</li>`).join('')}</ul></div>`);
    finalHtml += createCard('Segredos e Rumores', 'fa-key', `<ul class="list-none space-y-2">${data.segredosRumores.map(s => `<li class="flex items-start gap-x-2"><i class="fa-solid fa-key fa-fw mt-1 text-slate-500"></i><span>${s}</span></li>`).join('')}</ul>`);
    finalHtml += createCard('Encontros e Desafios', 'fa-gavel', data.encontrosDesafios.map(e => `<div class="mb-4"><h4 class="font-semibold flex items-center gap-x-2"><i class="fa-solid fa-skull-crossbones fa-fw text-slate-500"></i><span>${e.titulo}</span></h4><p class="text-secondary text-sm pl-6 my-1">${e.descricao}</p><p class="text-secondary text-sm pl-6 bg-slate-200 dark:bg-slate-800 p-2 rounded-md"><strong>Mecânica:</strong> ${e.mecanica}</p></div>`).join(''));

    let trackerHtml = '';
    const bestiaryMap = new Map(bestiaryData.map(m => [m.name.toLowerCase(), m]));
    const monstersToRender = [];
    if (data.encontrosDesafios) {
      const monsterPattern = /(\d+)\s*x\s*\[([^\]]+)\]/gi;
      data.encontrosDesafios.forEach(encounter => {
        let match;
        while ((match = monsterPattern.exec(encounter.mecanica)) !== null) {
          const quantity = parseInt(match[1], 10);
          const name = match[2].trim();
          const monsterData = bestiaryMap.get(name.toLowerCase());
          if (monsterData) {
            for (let i = 0; i < quantity; i++) {
              monstersToRender.push({
                uniqueId: `${monsterData.name.replace(/\s/g, '-')}-${i}`, name: monsterData.name, instance: i + 1,
                hp: monsterData.stats['Pontos de Vida'] || 0, mp: monsterData.stats['Pontos de Mana'] || 0,
                statsString: `P${monsterData.stats.Poder} H${monsterData.stats.Habilidade} R${monsterData.stats.Resistência}`,
                vantagens: monsterData.vantagens || [], desvantagens: monsterData.desvantagens || []
              });
            }
          }
        }
      });
    }
    if (monstersToRender.length > 0) {
      const encounterListHtml = monstersToRender.map(monster => {
        const statsLine = `<p class="text-xs text-secondary my-1"><i class="fa-solid fa-shield-halved fa-fw text-slate-500"></i> <b>Stats:</b> ${monster.statsString}</p>`;
        const vantagensLine = monster.vantagens.length > 0 ? `<p class="text-xs text-secondary my-1"><i class="fa-solid fa-thumbs-up fa-fw text-green-600"></i> <b>Vantagens:</b> ${monster.vantagens.join(', ')}</p>` : '';
        const desvantagensLine = monster.desvantagens.length > 0 ? `<p class="text-xs text-secondary my-1"><i class="fa-solid fa-thumbs-down fa-fw text-red-600"></i> <b>Desvantagens:</b> ${monster.desvantagens.join(', ')}</p>` : '';
        let hpMarkers = Array.from({ length: monster.hp }, (_, i) => `<div class="hp-marker"><input type="checkbox" id="${monster.uniqueId}-hp-${i + 1}"><label for="${monster.uniqueId}-hp-${i + 1}"></label></div>`).join('');
        let mpMarkers = Array.from({ length: monster.mp }, (_, i) => `<div class="mp-marker"><input type="checkbox" id="${monster.uniqueId}-mp-${i + 1}"><label for="${monster.uniqueId}-mp-${i + 1}"></label></div>`).join('');
        const showInstanceNumber = monstersToRender.filter(m => m.name === monster.name).length > 1;
        return `<div class="mb-4 border-b border-slate-200 dark:border-slate-700 pb-2"><h4 class="font-semibold">${monster.name} ${showInstanceNumber ? monster.instance : ''}</h4><div class="pl-2 pr-2">${statsLine}${vantagensLine}${desvantagensLine}</div><div class="mt-2 flex items-center flex-wrap"><span class="text-sm font-semibold text-red-700 dark:text-red-400 mr-2 w-8">PV:</span>${hpMarkers}</div><div class="mt-1 flex items-center flex-wrap"><span class="text-sm font-semibold text-blue-700 dark:text-blue-400 mr-2 w-8">PM:</span>${mpMarkers}</div></div>`;
      }).join('');
      trackerHtml = createCard('Tracker de Encontros', 'fa-swords', encounterListHtml);
    }

    finalHtml += trackerHtml;
    finalHtml += createCard('Gancho para a Próxima Aventura', 'fa-angles-right', `<p class="text-secondary leading-relaxed">${data.ganchoProximaAventura}</p>`);
    sessionContainer.innerHTML = finalHtml;

  } catch (error) {
    console.error("Erro ao carregar os dados da sessão:", error);
    sessionContainer.innerHTML = `<p class="text-center text-error">Não foi possível carregar os dados da sessão.</p>`;
  }
}

// --- Event Listeners Globais ---
document.addEventListener('mouseover', e => {
  if (e.target.classList.contains('ability-tag')) {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = e.target.dataset.tooltip;
    tooltip.style.display = 'block';
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.classList.contains('ability-tag')) {
    document.getElementById('tooltip').style.display = 'none';
  }
});
document.addEventListener('mousemove', e => {
  const tooltip = document.getElementById('tooltip');
  if (tooltip.style.display === 'block') {
    tooltip.style.left = `${e.pageX + 15}px`;
    tooltip.style.top = `${e.pageY + 15}px`;
  }
});

document.getElementById('navigation').addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (button && button.dataset.target) {
    showSection(button.dataset.target);
  }
});

document.getElementById('prev-page-btn').addEventListener('click', () => {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    displayCampaignPage(currentPageIndex);
  }
});

document.getElementById('next-page-btn').addEventListener('click', () => {
  if (currentPageIndex < campaignPages.length - 1) {
    currentPageIndex++;
    displayCampaignPage(currentPageIndex);
  }
});

// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', () => {
  // --- FUNÇÕES DE RENDERIZAÇÃO DAS LISTAS ---
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

  // --- LÓGICA PRINCIPAL DE CARREGAMENTO ---
  const fetchAllData = () => {
    const files = [
      'personagens.json', 'bestiario.json', 'npcs.json',
      'pericias.json', 'vantagens.json', 'desvantagens.json', 'tecnicas.json'
    ];
    const promises = files.map(file =>
      fetch(file).then(res => {
        if (!res.ok) throw new Error(`Falha ao carregar ${file}`);
        return res.json();
      }).catch(err => {
        console.warn(err);
        return [];
      })
    );
    return Promise.all(promises);
  };

  fetchAllData().then(([personagens, bestiario, npcs, pericias, vantagens, desvantagens, tecnicas]) => {
    playerData = personagens;
    bestiaryData = bestiario;
    npcData = npcs;

    const arrayToObject = (arr) => arr.reduce((acc, item) => {
      acc[item.name] = item;
      return acc;
    }, {});
    periciasData = arrayToObject(pericias);
    vantagensData = arrayToObject(vantagens);
    desvantagensData = arrayToObject(desvantagens);
    tecnicasData = arrayToObject(tecnicas);

    populatePlayerList();
    populateBestiaryList();
    populateNpcList();
    loadRules(pericias, vantagens, desvantagens, tecnicas);
    loadSession();

    const urlParams = new URLSearchParams(window.location.search);
    const playerName = urlParams.get('player');
    if (playerName && playerData.some(p => p.name === playerName)) {
      showSection('personagens');
      displayPlayer(playerName);
    } else if (playerData.length > 0) {
      showSection('basico');
      displayPlayer(playerData[0].name);
    } else {
      showSection('basico');
    }

  }).catch(error => {
    console.error("Erro fatal ao carregar dados essenciais:", error);
    document.getElementById('content').innerHTML = `<p class="text-error text-center mt-8 p-4"><b>Erro fatal ao carregar dados essenciais:</b><br>${error.message}<br><br>Verifique se todos os arquivos .json estão na pasta correta e sem erros de sintaxe.</p>`;
  });

  loadCampaign();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/3det/sw.js', { scope: '/3det/' })
      .then(registration => {
        console.log('Service Worker registado com sucesso:', registration.scope);
      })
      .catch(err => {
        console.log('Falha ao registar o Service Worker:', err);
      });
  });
}

