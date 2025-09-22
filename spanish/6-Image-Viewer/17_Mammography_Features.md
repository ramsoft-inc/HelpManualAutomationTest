---
sidebar_position: 17
title: Funcionalidades de Mamografia
tags:
  - Visualizador de Mamografia
  - Sincronização de Imagens
  - Protocolos de Exibição
  - Metadados DICOM
  - CAD (Detecção Assistida por Computador)
---
# Funcionalidades de Mamografia

## Visão Geral

O Visualizador de Imagens OmegaAI está equipado com funcionalidades especializadas projetadas para aprimorar a visualização e análise de estudos de mamografia. Esta seção fornece uma visão detalhada dessas funcionalidades, incluindo sincronização de imagens, anotações, protocolos de exibição e detecção de objetos CAD.

## Sincronização e Espelhamento de Imagens

O visualizador de imagens permite a comparação lado a lado de imagens de mamografia de diferentes lateralidades—direita e esquerda. Essa funcionalidade é aprimorada por um recurso de sincronização que espelha os movimentos entre os dois lados. Isso significa que, ao ajustar a visualização de um lado, a área correspondente do lado oposto é ajustada de forma espelhada, facilitando a comparação de áreas semelhantes em diferentes imagens.

## Anotações Aprimoradas

Durante a visualização de mamografias, as anotações e visualizações das imagens são exibidas de forma destacada. O visualizador aumenta automaticamente o tamanho da fonte das anotações sobrepostas para melhorar a legibilidade. Isso é útil quando as anotações contêm informações críticas sobre o estudo de mamografia.

## Protocolos de Exibição para Mamografia

Os usuários podem selecionar entre 10 protocolos de exibição de mamografia predefinidos, cada um adaptado aos tipos de visualizações disponíveis no estudo. Esses protocolos ajudam a otimizar o fluxo de trabalho organizando automaticamente as imagens de acordo com as etapas predefinidas de visualização.

## Autorrotação e Alinhamento

O visualizador possui a capacidade de autorrotacionar imagens com base nas informações de lateralidade contidas nos metadados DICOM. Isso garante que as imagens sejam sempre apresentadas na orientação correta. Além disso, os alinhamentos das sobreposições são ajustados automaticamente dependendo da lateralidade da imagem; por exemplo, sobreposições em imagens de lateralidade direita são alinhadas à esquerda, e vice-versa.

## Notificação de Objeto CAD

Ao revisar imagens de mamografia, se um objeto CAD (Detecção Assistida por Computador) estiver presente, o sistema notifica o usuário exibindo uma breve mensagem na parte inferior da área de visualização. Esse recurso auxilia na identificação rápida de achados significativos.

## Controles de Exibição de Objetos CAD

Dentro dos protocolos de exibição, os usuários têm a opção de definir configurações de visibilidade para objetos CAD. Essas configurações determinam se os objetos CAD devem ser visíveis em uma etapa ou protocolo específico. Além disso, os objetos CAD podem ser ativados ou desativados diretamente no menu da área de visualização, proporcionando flexibilidade ao usuário na revisão e análise das imagens.

## Painel de Medidas e Detecção CAD

O painel de medidas é atualizado para exibir uma entrada sempre que um objeto CAD é detectado na área de visualização ativa. Esse recurso auxilia na análise quantitativa dos achados e garante que todos os objetos detectados sejam contabilizados durante a revisão do estudo.