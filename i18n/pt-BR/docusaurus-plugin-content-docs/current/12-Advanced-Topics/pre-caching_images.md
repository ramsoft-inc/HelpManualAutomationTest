---
sidebar_position: 2
title: Pré-Cacheamento de Imagens
tags:
  - Cacheamento
  - Cacheamento de Link OmegaAI
  - Auto-Precache
  - Cache do Navegador
  - Imagens DICOM
  - Máquina Virtual
  - Criptografia AESGCM
  - HTTPS
  - Cache Web
  - Cacheamento Preditivo
---

# Pré-Cacheamento de Imagens

## Visão Geral

O cacheamento é um recurso vital no OmegaAI, projetado para melhorar a eficiência
da recuperação de imagens e aprimorar o desempenho da visualização DICOM. Essa
funcionalidade é implementada por meio de dois métodos principais: Cacheamento de Link OmegaAI
e Auto-Precache usando o navegador. Cada método otimiza o acesso aos dados de maneira
diferente para atender às necessidades dos usuários e às configurações de infraestrutura.

## Cacheamento de Link OmegaAI

O Cacheamento de Link acelera a recuperação de dados armazenando os dados de pixel localmente à medida
que são recebidos, evitando buscas repetidas no servidor, um processo
que pode ser tanto custoso quanto lento.

### Como Funciona

- **Identificação do Link Local:** O sistema utiliza o endereço IP
  público para identificar os Links locais onde o OmegaAI está instalado.

- **Armazenamento dos Dados de Pixel:** Para proteger as informações de saúde do paciente
  (PHI), os dados de pixel são criptografados usando o algoritmo AESGCM antes
  de serem armazenados no disco local.

- **Execução do Servidor de Link:** Um servidor web seguro é iniciado com o
  início do link, e um certificado de domínio (HTTPS) é anexado para
  garantir a transmissão segura dos dados.

### Cacheamento Preditivo Auto-Link (Usando Cache Web)

Esse recurso avançado foi projetado para acelerar ainda mais o uso da aplicação por meio de mecanismos de cacheamento preditivo.

#### Etapas Envolvidas

- **Disparo no Login:** Após o login do usuário, o sistema inicia as operações de auto-precache.

- **Solicitação e Cacheamento de Dados:** Se um link estiver disponível, ele solicita
  dados de pixel específicos. O Link verifica se esses dados já estão em cache;
  caso contrário, ele os recupera e armazena em cache a partir do servidor. Posteriormente, esses
  dados em cache ficam rapidamente disponíveis para o próximo acesso do usuário.

#### Auto-Precache Usando o Navegador

Esse método tem como alvo uma base de usuários mais ampla e é ativado ao abrir um
estudo. O objetivo é fornecer cacheamento preditivo para facilitar o acesso imediato
às imagens necessárias.

#### Metodologia de Cacheamento:

- **Seleção dos Estudos:** O sistema seleciona os estudos melhor classificados na
  lista de trabalho com base na prioridade definida ou na ordem padrão.

- **Cacheamento em Lotes:** Inicialmente, os cinco primeiros estudos são armazenados em cache. Uma vez
  concluído, o próximo lote de estudos (6-10) é processado, com uma
  limitação de cacheamento de até 15 estudos.

- **Cacheamento em Segundo Plano:** Quando um usuário faz login, todos os estudos atribuídos são
  armazenados em cache no navegador em ordem de prioridade usando um web-worker. Isso
  inclui o download dos estudos e de quaisquer imagens prévias relevantes em
  segundo plano.

- **Gerenciamento de Expurgo:** O navegador gerencia automaticamente o expurgo dos
  dados em cache.