---
sidebar_position: 14
title:  Usando a Ferramenta Cine
tags:
  - Ferramenta Cine
  - Ultrassom
  - Série Multi-quadro
  - TC
  - RM
  - XA
  - DICOM
  - FPS
  - Viewport
  - Reprodução
  - Protocolos de Exibição

---
# Usando a Ferramenta Cine

## Visão Geral

A ferramenta Cine no OmegaAI foi projetada para visualização em tempo real de estudos de imagens médicas, como Ultrassom, TC (Tomografia Computadorizada), RM (Ressonância Magnética) e XA (Angiografia por Raios-X). Ela permite que os usuários naveguem de forma eficiente por grandes séries de múltiplos quadros sem interação manual repetitiva, otimizando o processo de revisão. Esta ferramenta é particularmente útil em imagens dinâmicas, onde a análise quadro a quadro é essencial.

## Acessando a Ferramenta Cine

1.  **Visibilidade e Ativação:** A ferramenta Cine está disponível apenas se o estudo carregado contiver mais de duas imagens. Ela pode ser acessada:

    - Pelo ícone Cine localizado na parte inferior do menu do viewport

    - Pela barra de ferramentas

    - Pressionando a tecla "C", que serve como atalho para acesso rápido

      

## Interface e Funções da Ferramenta Cine

Uma vez ativada, a interface gráfica da ferramenta Cine (GUI) aparece com várias opções de controle:

1.  **Ir para o Primeiro Quadro:** Vai diretamente para a primeira imagem da série.

2.  **Mover para o Quadro Anterior:** Volta para a imagem anterior da série.

3.  **Reproduzir/Parar:** Inicia ou interrompe a reprodução automática dos quadros.

4.  **Mover para o Próximo Quadro:** Avança para a próxima imagem da série.

5.  **Mover para o Último Quadro:** Vai diretamente para a última imagem da série.

6.  **Indicador de FPS (Quadros Por Segundo):** Mostra a taxa atual de quadros por segundo. O FPS pode ser ajustado clicando e segurando o botão esquerdo do mouse e arrastando para a esquerda ou direita. A taxa de FPS é definida com base nos dados DICOM para a série selecionada (viewport ativa), ou um valor padrão é usado com base na modalidade da série caso não haja dados DICOM disponíveis.

    
    
    
    > **Nota**: A GUI do Cine pode ser movida dentro do viewport arrastando e soltando.

    

## Recursos Adicionais

- **Indicador de Progresso da Reprodução:** Um indicador no topo da GUI exibe o progresso da reprodução.

- **Reprodução Automática em Protocolos de Exibição:** Como parte da configuração dos protocolos de exibição, os usuários podem definir o viewport para reproduzir automaticamente o cine ao abrir um estudo, facilitando um fluxo de trabalho mais ágil.

## Usando a Ferramenta Cine de Forma Eficiente

- Para aumentar a eficiência do fluxo de trabalho, familiarize-se com os atalhos e a interface gráfica.

- Utilize o recurso de ajuste de FPS para adequar o ritmo da revisão das imagens às necessidades específicas do estudo analisado.

### Exemplo Prático

Em um cenário clínico onde é necessária uma avaliação rápida da função cardíaca por meio de um ecocardiograma, a ferramenta Cine permite que os clínicos percorram rapidamente a série de imagens do ecocardiograma, pausem em quadros críticos ou revisem segmentos específicos repetidamente para garantir uma análise e diagnóstico precisos.