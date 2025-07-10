---
sidebar_position: 7
title: Configurando o Fluxo de Trabalho
tags:
  - Gerenciador de Documentos
  - Modelo de Relatório
  - Configuração de Modelo
  - Editor de Bookmarks
  - Modelos Predefinidos
  - Criar Modelo
  - Melhor Correspondência
  - Modelo
  - Opções de Formatação
---

# Configurando o Fluxo de Trabalho

## Configurando Modelos de Relatório

O recurso de Configuração de Modelo de Relatório do Gerenciador de Documentos no OmegaAI
simplifica a criação de relatórios de pacientes para radiologistas e
médicos responsáveis pela leitura. Este recurso oferece ferramentas para criar
relatórios manualmente usando um editor de bookmarks e agiliza o processo usando
modelos predefinidos. Este guia fornece etapas detalhadas sobre como usar
esse recurso de forma eficaz.

### Usando Modelos Predefinidos

Modelos predefinidos são projetados para padronizar a formatação e
conteúdo dos relatórios, reduzindo a necessidade de entrada manual e garantindo
consistência entre os documentos.

**Como Usar Modelos Predefinidos**:

O objetivo é permitir que os usuários criem um relatório quando modelos estiverem
disponíveis. Quando o radiologista abre o Visualizador de Documentos, o modelo
com melhor correspondência é carregado com o cursor nele.

O modelo com melhor correspondência no navegador é criado como um relatório preliminar,
que possui o ícone amarelo indicando o ícone de modelo.

Se o usuário excluir o modelo com melhor correspondência, o sistema carrega um
relatório em branco, e todos os modelos estarão disponíveis na gaveta de modelos.
No navegador, abaixo dos relatórios abertos, há relatórios
e documentos com um separador. O usuário pode adicionar no máximo três relatórios abertos.

1.  Vá para o **Visualizador de Documentos**.

2.  Clique nos três pontos no topo da janela para abrir o menu
    suspenso.

3.  Selecione **Gerenciador de Modelos** na lista.

4.  Todos os modelos aparecerão na navegação em miniaturas.

5.  Selecione o modelo.

6.  O modelo selecionado exibe um ponto azul na miniatura.

7.  Os ícones de **Visualizar** e **Editar** aparecem no topo da janela.

8.  Clique no ícone **Editar** para editar o modelo.

9.  Clique no ícone **Publicar** para Publicar o Modelo.

    

    


Se o nome do modelo não for alterado, ele será salvo sob o modelo existente;
se o nome for alterado, pode ser publicado como um novo modelo.

Ao aplicar modelos na gaveta, apenas os modelos com melhor correspondência em
ordem decrescente de pontos de correspondência da mesma modalidade, conforme o estudo,
serão exibidos.

Os modelos são organizados com base na publicação mais recente. Carimbos de data/hora
são exibidos no cartão do relatório, cartão do modelo, histórico de versões e
histórico de emendas em EST.

Um nome único é atribuído aos relatórios, incluindo o nome do relatório e o carimbo de data/hora.

O formato do nome do relatório é *Final Report Month Date Year hh:mm:ss*.

A capacidade de busca parcial está funcional no Gerenciador de Modelos.

### Criando e Editando Modelos

Crie ou modifique modelos para atender necessidades específicas de relatórios com
elementos personalizáveis, como bookmarks, assinaturas e mais.

**Etapas para Criar/Editar um Modelo**:

1.  **Abra o Gerenciador de Modelos**: Faça upload de um modelo existente ou crie um
    novo.

2.  **Defina a Configuração da Página**: Escolha o tamanho de página apropriado (ex.: A4,
    A3, A5, Carta, Tabloide, Legal).

    


3.  **Use o Seletor de Bookmarks**:

    - **Picklist**: Configure listas suspensas personalizáveis para selecionar
      opções específicas.

    - **Campos**: Defina partes do documento como Título, Parte do Corpo,
      Nome do Paciente, etc.

    - **Categorias**: Organize documentos por critérios como Data de Nascimento,
      Hora do Pedido, etc.

4.  **Insira Bookmarks**: Coloque bookmarks no modelo para acesso rápido
    às informações com base nos campos e categorias definidos.

    


### Adicionando Texto e Formatação em Modelos

Aprimore o apelo visual e a clareza dos modelos usando ferramentas de
formatação de texto.

Selecione uma palavra ou letra do texto para encontrar o modelo de formatação
para escolher.

**Ferramentas de Formatação Disponíveis**:

- Negrito, Itálico, Sublinhado, Alinhar texto

- Realce, Marcadores e outros aprimoramentos de texto

  


**Visualizar e Publicar**:

- Visualize o modelo em tempo real para garantir que atenda aos padrões
  desejados.

- Uma vez finalizado, publique o modelo para torná-lo disponível para
  uso organizacional.

#### Critérios de Seleção de Melhor Modelo para Relatórios Preliminares

O algoritmo de Melhor Correspondência de Modelo aplica automaticamente um modelo de relatório
com base na maior pontuação de correspondência entre os metadados do estudo e os modelos
disponíveis.

**Fluxo de Correspondência:**

- **Critérios de Filtragem (Pré-pontuação):**

Antes de qualquer pontuação, os modelos são filtrados com base nas
seguintes condições de correspondência exata:

  - Organização de Imagem / Organização Gerenciadora

  - Modalidade

  - Lateralidade

  - Sexo

  - Código do Procedimento

  - Status do Estudo

Modelos que não correspondem a **esses filtros** **não são considerados para
pontuação**.

- **Critérios de Pontuação (Pós-filtragem):**

Cada modelo restante é pontuado com base em quão bem corresponde aos
metadados do estudo. Pontos são atribuídos.

A pontuação total é calculada para cada modelo. O modelo com a
maior pontuação é aplicado automaticamente ao relatório.

**Sistema de Pontuação**

Cada modelo publicado possui critérios correspondentes, e cada critério
tem uma pontuação associada. A pontuação total determina a melhor correspondência.

| Critério                                                | Pontos |
|---------------------------------------------------------|--------|
| **Modalidade**                                          | 10     |
| **Código do Procedimento**                              | 10     |
| **Lateralidade**                                        | 10     |
| **Parte do Corpo**                                      | 10     |
| **Sexo**                                                | 10     |
| **Médico Responsável pela Leitura**                     | **70** |
| **Opção "Todos"** (ex.: Todas Modalidades ou Todas Partes do Corpo) | 9      |

Por exemplo: Se um modelo tem Todas as Modalidades, recebe 9 pontos
em vez de 10 para esse critério.

**Ordem de Seleção de Modelos:**

- A melhor correspondência é aplicada automaticamente ao relatório.

- Os demais modelos com melhor correspondência (com pontuações decrescentes) também
  são exibidos em uma lista para o usuário escolher, se necessário.

**Processo Total de Correspondência**

- Cada modelo disponível é comparado com os metadados do estudo.

- A pontuação total de correspondência é calculada.

- O modelo com a maior pontuação total é aplicado automaticamente ao
  relatório.

- Em caso de múltiplos modelos com correspondências semelhantes, o que estiver mais alto
  na hierarquia e publicado mais recentemente será selecionado.

**Por Exemplo: Correspondência de Modelo na Prática**

Um radiologista abre um estudo de **Raio-X de Tórax** com os seguintes
metadados:

| Campo             | Valor          |
|-------------------|---------------|
| Modalidade        | CR            |
| Código do Procedimento | CXR01     |
| Lateralidade      | Nenhuma       |
| Parte do Corpo    | Tórax         |
| Conjunto          | Padrão        |
| Médico Responsável pela Leitura | Dra. Jane Smith |

Considere o seguinte modelo publicado pela Organização:

| Critério do Modelo | Valor no Modelo | Resultado da Correspondência | Pontos Atribuídos |
|--------------------|-----------------|-----------------------------|-------------------|
| Modalidade         | CR              | ✔ Correspondência           | 10                |
| Código do Procedimento | CXR01        | ✔ Correspondência           | 10                |
| Lateralidade       | Todos           | ✔ Correspondência           | 10                |
| Parte do Corpo     | Tórax           | ✔ Correspondência Ampla     | 9                 |
| Sexo               | Padrão          | ✔ Correspondência           | 10                |
| Médico Responsável pela Leitura | Dra. Jane Smith | ✔ Correspondência | **70**         |

Pontuação Total = 10 + 10 + 9 + 10 + 10 + 70 = 119

Este modelo será aplicado automaticamente porque possui a maior pontuação
entre todos os modelos avaliados.

**Gerenciamento de Modelos**:

- Vários modelos podem ser criados e publicados para atender a diferentes
necessidades e preferências de relatórios.

- As organizações podem manter uma biblioteca de modelos, permitindo que os usuários
selecionem o mais adequado para seus relatórios.

  
