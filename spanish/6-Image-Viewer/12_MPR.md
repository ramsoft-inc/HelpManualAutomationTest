---
sidebar_position: 12
title: Modo de Reconstrução Multi-Planar (MPR)
tags:
  - Modo MPR
  - Reconstrução Multi-Planar
  - Estudo CTS
  - Série Multi-Frame
  - Menu do Viewport
  - Axial
  - Sagital
  - Coronal
  - Cruzeta
  - Rolagem de Stack
  - Pan
  - Zoom
  - Rotacionar
  - Nível de Janela
  - Rolagem com Roda do Mouse
---
# Modo de Reconstrução Multi-Planar (MPR)

## Visão Geral

O OmegaAI inclui um recurso conhecido como Modo de Reconstrução Multi-Planar (MPR), essencial para visualizar dados de imagem complexos em três planos ortogonais: axial, sagital e coronal.

## Ativar o Modo MPR

1.  **Condição Inicial**: Certifique-se de que você está em um estudo de Tomografia Computadorizada (CT-Scan) no OmegaAI. O Modo MPR requer uma série multi-frame com dados de localização adequados para reconstrução.

2.  **Acessando o Modo MPR**:

    - Navegue até o viewport exibindo a série relevante.

    - Abra o menu do viewport. Se a série suportar reconstrução MPR, você encontrará uma opção para ativar o Modo MPR.

    - Selecione a opção de Modo MPR. Se não estiver disponível, a série não suporta MPR e a opção não será exibida.

    

## Interface e Navegação no Modo MPR

Ao entrar no Modo MPR, a interface se ajusta para exibir três viewports, cada um correspondente a um dos planos ortogonais:

- **Viewport Axial**: Marcado com um ponto vermelho no canto superior direito.

- **Viewport Sagital**: Marcado com um ponto verde.

- **Viewport Coronal**: Marcado com um ponto amarelo.

Cada viewport também exibirá uma cruzeta em tela cheia com linhas codificadas por cor, correlacionando com a visualização que representam:

- **Linha Vermelha**: Axial

- **Linha Verde**: Sagital

- **Linha Amarela**: Coronal

  

## Ferramentas e Funcionalidades

- **Ferramentas Habilitadas**: Rolagem de stack, pan, zoom, rotação e ajustes de nível de janela estão ativos.

- **Ferramentas Desabilitadas**: Algumas ferramentas podem estar desabilitadas neste modo para garantir estabilidade e desempenho.

- **Navegação entre Frames**: Use a roda do mouse para rolar entre os frames. O número do frame e o total de frames são indicados por anotações em sobreposição.

- **Interatividade da Cruzeta**:

  - **Nó Quadrado** (próximo ao centro): Arraste para ajustar a espessura do slab de Projeção de Intensidade Máxima (MIP) naquele plano específico.

  - **Nó Circular** (mais afastado do centro): Arraste para rotacionar os eixos ao redor do centro.

## Linhas de Obliquidade no Modo MPR

O modo MPR do OmegaAI agora apresenta duas linhas de obliquidade para controle mais preciso e ajustes de orientação em estudos de PET/CT.

**Funcionalidades Principais:**

  - Movimento Independente: Clicar no nó circular de uma linha permite rotação independente, possibilitando que uma linha se mova sem afetar a outra.
  - Movimento Sincrônico: Clicar fora do círculo rotaciona ambas as linhas juntas, mantendo o alinhamento para ajustes mais amplos.
  - Controle Específico por Visualização: Ajustes em um viewport (por exemplo, axial) não impactam as linhas de obliquidade em outras visualizações (por exemplo, sagital ou coronal), preservando configurações específicas de cada visualização.
