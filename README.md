# Escudo do Mestre Digital
O Escudo do Mestre Digital funciona como uma referência rápida para o manual de 3DeT Victory. 

## Executando o Projeto
Requerimentos:
- `npm`
- `node`
- `git`

## Abrindo uma sessão local
1. Execute no seu terminal: `npm install -g serve` na raiz do projeto.
2. Execute em seguida `npm serve .` na raiz do projeto.
3. Abra no seu navegador o endereço `http://localhost:3000`

### Acessando via celular/tablet
É necessário que a porta do seu computador permita conexões de outros devices na mesma rede. Verifique se a rede atual onde está conectado permite conexões remotas de outro dispositivo.

Uma vez feito isso, abra no navegador do seu celular o mesmo endereço localhost na porta 3000.

## Adicionando novos personagens
Personagens são definidos no arquivo `personagens.json` em uma estrutura simples de JSON. Para adicionar um novo personagem, adicione no fim da lista de personagens uma nova chave nesse formato:
```
    {
        "name": "<NOME_DO_PERSONAGEM>",
        "archetype": "<ARQUETIPO>",
        "concept": "<CONCEITO>",
        "stats": {
            "Poder": <PODER>,
            "Habilidade": <HABILIDADE>,
            "Resistência": <RESISTENCIA>,
            "Pontos de Vida": <PONTOS DE VIDA>,
            "Pontos de Mana": <PONTOS DE MANA>,
            "Pontos de Ação": <PONTOS DE AÇÃO>
        },
        "pontos": "<PONTOS_TOTAIS>",
        "pericias": [
            "<PERICIA_1>",
            "<PERICIA_2>",
            ...
            "<PERICIA_N>"
        ],
        "vantagens": [
            "<VANTAGEM_1>,
            "<VANTAGEM_2>",
            ...
            "<VANTAGEM_N>"
        ],
        "tecnicas": [
            "<TECNICA_1>",
            "<TECNICA_2>",
            "...",
            "<TECNICA_N>"
        ],
        "desvantagens": [
            "<DESVANTAGEM_1>",
            "<DESVANTAGEM_2>",
            "...",
            "<DESVANTAGEM_N>"
        ],
        // Arquivo estático deve estar no diretório /img
        "image": "<IMAGEM.jpg>"
    }
```
