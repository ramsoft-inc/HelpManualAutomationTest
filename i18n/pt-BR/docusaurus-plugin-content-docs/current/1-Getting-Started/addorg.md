---
sidebar_position: 3
title: Adicionando e Gerenciando Organizações
tags:
  - Organizações
  - Organização Master
  - Adicionar Nova Organização
  - Organizações Referenciadoras
---

# Adicionando e Gerenciando Organizações

## Acessando Organizações no OmegaAI

### Abrindo o Painel de Organizações

Para começar a gerenciar organizações, clique na aba Organizações. Esta é a principal porta de entrada para todas as funções relacionadas a organizações.

### Aba de Organizações Master

A aba Organizações Master à esquerda mostra as organizações master das quais você faz parte. O número de organizações listadas aqui depende das configurações do perfil do usuário.

### Adicionando uma Nova Organização

Para adicionar uma nova organização, clique no ícone '+' localizado no topo da lista de organizações. A nova organização será adicionada como subordinada à organização master selecionada.

### Visualizando o Cartão da Organização

O Cartão da Organização exibido à direita fornece detalhes da organização atual, como nome, tipo, Identificador Nacional do Prestador (NPI), fuso horário, endereço do site e informações de contato.

### Gerenciando Detalhes da Organização

Para mais informações ou para modificar os detalhes da organização, clique em 'Detalhes'. Aqui, a organização também pode ser excluída, se necessário.

### Gerenciando Organizações Referenciadoras

Acesse e gerencie organizações referenciadoras na parte inferior do painel. Aqui você pode adicionar novas organizações referenciadoras conforme necessário.

## Criando uma Nova Organização

Siga os passos abaixo para criar uma nova organização.

1. Selecionando uma Organização Pai

Escolha uma organização existente para atuar como pai da nova organização a ser criada.

2. Inserindo os Detalhes da Organização

Após clicar no '+', os seguintes detalhes devem ser inseridos para a nova organização:
- **Nome e Organização Pai**: Especifique o nome e selecione ou modifique a organização pai.
- **Tipo de Prática e Identificadores**: Defina o tipo de prática e adicione o NPI, CNPJ, fuso horário e site corporativo.
- **Configuração do Provedor de Identidade**: Importe um arquivo XML para configurar um provedor de identidade.
  - *Nota: Modelos para esta configuração estão disponíveis para download na mesma tela.*

3. Adicionando Informações de Endereço

O recurso de busca de endereço é utilizado para preencher automaticamente os campos de endereço.

4. Fornecendo Informações de Contato

Insira detalhes como e-mail, telefone e números de fax na seção de Informações de Contato.
- *Nota: Várias entradas podem ser adicionadas para cada tipo de informação de contato.*

5. Finalizando a Criação

Clique em 'Salvar' para confirmar a criação da nova organização ou em 'Cancelar' para descartar as alterações.

## Compreendendo Hierarquia e Uso

### Organização Master

Esta é uma organização de nível superior que gerencia configurações cruciais, dados de pacientes, configurações de funções, personalizações de status e automação de fluxos de trabalho.

### Suborganizações

Suborganizações são úteis para gerenciar diferentes grupos de usuários, recursos de saúde (particularmente com o recurso de agendamento) e associar dispositivos para dados de imagem (como DICOM).

## Acessando e Gerenciando Organizações Referenciadoras

### Visualizando Organizações Referenciadoras

Na parte inferior do cartão da organização, é possível visualizar uma lista de organizações referenciadoras associadas à organização.

### Gerenciando Detalhes da Organização Referenciadora

Clique no nome da organização referenciadora para ver informações detalhadas, incluindo o número de médicos referenciadores, tipo, NPI, fuso horário e site.

### Editando ou Desvinculando Organizações Referenciadoras

Clique em Detalhes para mais opções de edição ou desvinculação da organização referenciadora.

### Adicionando/Vinculando uma Nova Organização Referenciadora

Clique no ícone '+' para iniciar a vinculação a uma nova organização referenciadora ou a uma já existente.
- Uma caixa de busca aparecerá para que você encontre e selecione uma organização referenciadora.
- Após a busca, selecione 'Vincular' para associar a organização referenciadora à sua organização.
- Para criar uma nova organização referenciadora, clique no ícone '+ Nova Organização' e insira os detalhes necessários, como nome, fuso horário e site corporativo.
  - *Nota: O tipo de prática é definido como 'Referenciadora' e não pode ser alterado.*
  - O recurso de busca de endereço é utilizado para preencher automaticamente os campos de endereço.
  - Adicione informações de contato como e-mail, telefone e fax, com a opção de incluir várias entradas.
  - Clique em Salvar para confirmar a criação da nova organização referenciadora ou em Cancelar para abortar o processo.

Após a criação, a nova organização é automaticamente vinculada à organização pai.