---
sidebar_position: 6
title: Navegador de Tags DICOM
tags:
  - Navegador de Tags DICOM
  - Visualizador de Imagens
  - Seleção de Série
  - Seleção de Objeto
  - Busca de Tags
  - Baixar Estudo
  - Navegador DICOM de Terceiros
---

# Navegador de Tags DICOM

## Visão Geral

O Navegador de Tags DICOM é um recurso integrado ao Visualizador de Imagens OmegaAI que permite aos usuários acessar metadados detalhados sobre as imagens de um estudo. Esta ferramenta fornece uma interface para visualizar e pesquisar tags relacionadas aos arquivos DICOM (Digital Imaging and Communications in Medicine).

## Acessando o Navegador de Tags DICOM

1.  **Abrir o Visualizador de Imagens**: Inicie o Visualizador de Imagens OmegaAI onde seus arquivos de imagens médicas estão acessíveis.

2.  **Navegar até Mais Opções**: No Visualizador de Imagens, localize e clique no menu de **Mais Opções** (ícone de 3 pontos). Normalmente, ele pode ser encontrado na barra de ferramentas ou sob um ícone de configurações.

3.  **Selecionar Tags do Cabeçalho DICOM**: No menu suspenso, clique na opção **Tags do Cabeçalho DICOM**. Esta ação fará com que o painel do Navegador de Tags DICOM seja aberto no lado direito da tela.
    
    

## Usando o Navegador de Tags DICOM

Uma vez que o Navegador de Tags DICOM esteja ativado, você verá um novo painel no lado direito da sua tela. Veja como navegar e usar este painel:


1.  **Layout do Painel**: O painel está posicionado no canto superior direito da tela, proporcionando uma visualização clara e desobstruída dos dados da imagem.

2.  **Menus Suspensos de Série e Objeto**:

    - **Selecionar Série**: O menu suspenso à esquerda permite selecionar uma série dentro do estudo. Uma série normalmente consiste em um conjunto específico de imagens relacionadas.

    - **Selecionar Objeto**: O menu suspenso à direita permite selecionar um objeto dentro da série escolhida. Esses objetos são imagens individuais ou pontos de dados.

    - **Seleção Automática**: Clicar em um viewport seleciona automaticamente a série e o objeto correspondentes, alinhando os tags DICOM exibidos com a imagem ou dado que você está visualizando.

3.  **Visualizando e Buscando Tags**:

    - **Colunas**: As tags são apresentadas em quatro colunas dentro do painel: Número da Tag, Tipo de Tag, Valor Armazenado na Tag e Nome da Tag.

    - **Buscando Tags**: Para buscar dentro dessas colunas, passe o mouse sobre o cabeçalho da coluna, clique e então digite seu termo de busca na caixa de pesquisa que aparecer. Este recurso permite encontrar rapidamente tags específicas por qualquer um dos atributos listados.

## Nota Importante sobre a Visibilidade das Tags

Por favor, note que, para melhorar o desempenho do Visualizador de Imagens, nem todos os cabeçalhos DICOM presentes nos objetos DICOM serão exibidos no Navegador de Tags. Se você precisar acessar todos os cabeçalhos DICOM:

- **Baixe o Estudo**: Você pode baixar o estudo completo para sua máquina local.

- **Use um Navegador DICOM de Terceiros**: Após o download, você pode abrir o estudo usando um navegador DICOM de terceiros para visualizar todos os cabeçalhos DICOM disponíveis.