document.addEventListener('DOMContentLoaded', async () => {
    const characterSheetContainer = document.getElementById('character-sheet');
    const urlParams = new URLSearchParams(window.location.search);
    const characterId = urlParams.get('id');
    const characterType = urlParams.get('type');

    if (!characterId || !characterType) {
        characterSheetContainer.innerHTML = '<p class="text-center text-red-500">ID do personagem ou tipo não fornecido.</p>';
        return;
    }

    const { data, error } = await supabaseClient
        .from(characterType)
        .select(`
            *,
            pericias:${characterType}_pericias(pericias(*)),
            vantagens:${characterType}_vantagens(vantagens(*)),
            desvantagens:${characterType}_desvantagens(desvantagens(*)),
            tecnicas:${characterType}_tecnicas(tecnicas(*))
        `)
        .eq('id', characterId)
        .single();

    if (error || !data) {
        characterSheetContainer.innerHTML = `<p class="text-center text-red-500">Erro ao buscar personagem: ${error?.message || 'Personagem não encontrado.'}</p>`;
        console.error('Erro ao buscar personagem:', error);
        return;
    }

    const character = {
        ...data,
        pericias: data.pericias.map(p => p.pericias).filter(Boolean),
        vantagens: data.vantagens.map(v => v.vantagens).filter(Boolean),
        desvantagens: data.desvantagens.map(d => d.desvantagens).filter(Boolean),
        tecnicas: data.tecnicas.map(t => t.tecnicas).filter(Boolean),
        stats: {
            "Poder": data.Poder,
            "Habilidade": data.Habilidade,
            "Resistência": data.Resistencia,
            "Pontos de Ação": data.Pontos_Acao,
            "Pontos de Mana": data.Pontos_Mana,
            "Pontos de Vida": data.Pontos_Vida
        }
    };

    const createListHtml = (items) => {
        if (!items || items.length === 0) return "Nenhuma";
        return items.map(item => `<span class="ability-tag">${item.name}</span>`).join(', ');
    };

    const periciasHtml = createListHtml(character.pericias);
    const vantagensHtml = createListHtml(character.vantagens);
    const tecnicasHtml = createListHtml(character.tecnicas);
    const desvantagensHtml = createListHtml(character.desvantagens);

    const iconMap = { "Poder": "fa-hand-fist", "Habilidade": "fa-brain", "Resistência": "fa-shield-halved", "Pontos de Vida": "fa-heart-pulse", "Pontos de Mana": "fa-wand-magic-sparkles", "Pontos de Ação": "fa-bolt" };
    const stats = character.stats;
    const statsCardsHtml = Object.entries(stats).map(([statName, statValue]) => {
        const iconClass = iconMap[statName] || 'fa-question-circle';
        return `<div class="info-card p-3 rounded-lg flex items-center gap-x-3 shadow-sm"><i class="fa-solid ${iconClass} fa-fw fa-2x text-accent"></i><div><span class="block text-sm text-secondary">${statName}</span><span class="block text-xl font-bold text-primary">${statValue || 0}</span></div></div>`;
    }).join('');

    characterSheetContainer.innerHTML = `<div class="flex flex-col sm:flex-row gap-6 items-start"><div class="flex-shrink-0 w-full sm:w-48 relative group"><img src="${character.image || ''}" alt="Retrato de ${character.name}" class="placeholder-img w-full h-auto object-cover rounded-lg shadow-lg"><div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><button id="upload-button" class="text-white text-lg">Trocar Imagem</button></div></div><div class="flex-grow"><h3 class="text-2xl font-bold text-accent">${character.name}</h3><p class="text-md text-secondary italic mb-2">${character.concept}</p><p class="text-sm text-secondary mb-4">${character.archetype} • ${character.pontos} pontos</p><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-list-ol fa-fw text-slate-500"></i><span>Atributos</span></h4><div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-2">${statsCardsHtml}</div></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-graduation-cap fa-fw text-slate-500"></i><span>Perícias</span></h4><p>${periciasHtml}</p></div><div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-up fa-fw text-green-600"></i><span>Vantagens</span></h4><p>${vantagensHtml}</p></div>${tecnicasHtml !== "Nenhuma" ? `<div class="mb-4"><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-wand-sparkles fa-fw text-blue-500"></i><span>Técnicas</span></h4><p>${tecnicasHtml}</p></div>` : ''}<div><h4 class="font-bold mb-1 flex items-center gap-x-2"><i class="fa-solid fa-thumbs-down fa-fw text-red-600"></i><span>Desvantagens</span></h4><p>${desvantagensHtml}</p></div></div></div>`;

    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadCharacterImage(characterType, characterId, file);
        }
    });
});

async function uploadCharacterImage(characterType, characterId, file) {
    if (!file) {
        console.error("Nenhum arquivo selecionado.");
        return;
    }

    const fileExtension = file.name.split('.').pop();
    const filePath = `public/${characterType}/${characterId}-${Date.now()}.${fileExtension}`;

    try {
        const { error: uploadError } = await supabaseClient.storage
            .from('imagens-personagens')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabaseClient.storage
            .from('imagens-personagens')
            .getPublicUrl(filePath);

        if (!publicUrl) {
            throw new Error("Não foi possível obter a URL pública da imagem.");
        }

        const { error: dbError } = await supabaseClient
            .from(characterType)
            .update({ image: publicUrl })
            .eq('id', characterId);

        if (dbError) {
            throw dbError;
        }

        console.log("Imagem atualizada com sucesso!", publicUrl);
        location.reload();

    } catch (error) {
        console.error("Erro ao fazer upload da imagem:", error);
        alert("Falha no upload da imagem. Verifique o console para mais detalhes.");
    }
}