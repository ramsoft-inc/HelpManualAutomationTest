---
sidebar_position: 3
title: Dominando Protocolos de Exibição
---

# Dominando Protocolos de Exibição

## Visão Geral

A Tela de Configuração de Protocolos de Exibição no OmegaAI é uma interface robusta, projetada para configurar e personalizar a exibição de estudos de imagens médicas de acordo com as preferências do usuário ou requisitos clínicos específicos. Esta tela é segmentada em três áreas principais, cada uma servindo a um propósito distinto no processo de configuração.

## Layout da Tela de Configuração

### Configuração dos Viewports (Canto Superior Esquerdo)

Esta seção é dedicada a definir o layout e as configurações específicas dos viewports utilizados em um protocolo de exibição.

- **Definindo Viewports**: Clique em qualquer viewport para selecioná-lo e configurá-lo. As opções incluem definir modificadores específicos, particularmente úteis em estudos de mamografia para aplicar condições especiais de visualização.

- **Funcionalidade de Busca**: Use o ícone de busca para procurar códigos de visualização e modificadores disponíveis, facilitando encontrar configurações específicas rapidamente.

### Códigos de Visualização e Modificadores (Inferior Esquerdo)

Aqui, você encontrará uma lista de códigos de visualização juntamente com modificadores aplicáveis, com opções aprimoradas para mamografia.

- **Adicionando Modificadores**: Para estudos especializados como mamografia, modificadores como deslocamento de implante podem ser adicionados aos viewports para refinar quais imagens são exibidas.

### Regras do Protocolo de Exibição (Lado Direito)

Esta área permite a personalização de regras e opções adicionais para os protocolos de exibição.

- **Acessando Protocolos Existentes**: Clique no ícone de estrela para visualizar uma lista de protocolos de exibição existentes disponíveis para o seu perfil de usuário.

- **Duplicando e Compartilhando Protocolos**: Opções para duplicar e compartilhar protocolos estão disponíveis para facilitar configurações colaborativas e padronizar práticas entre os usuários.

## Criando e Gerenciando Protocolos de Exibição

### Adicionando e Editando Protocolos

- **Criando Novos Protocolos**: Clique no ícone "+" para iniciar a criação de um novo protocolo. Personalize arrastando e soltando códigos de visualização nos viewports desejados.

- **Editando Protocolos**: Passe o mouse sobre um protocolo existente para ver opções como acessar as configurações (ícone de informação) ou excluir o protocolo (ícone de lixeira).

### Configurando a Exibição do Viewport

- **Configuração do Modo Grade (Tile Mode)**: Esta opção permite configurar se o viewport exibirá imagens em modo grade ou modo pilha, além de escolher um layout para o modo grade.

- **Exibição de Estudos Anteriores**: Configure os viewports para exibir estudos anteriores selecionando o estudo anterior apropriado no menu. Os ajustes incluem correspondência de modelos e rotulagem para maior clareza no viewport.

## Opções Avançadas de Configuração

### Manipulações

- **Orientação e Janela (Windowing)**: Personalize a orientação da imagem (ex.: inverter, girar) e configurações de janela (ajustes manuais ou predefinidos).

- **Escala**: Defina o nível de zoom ou opções de ajuste para otimizar como as imagens preenchem o viewport.

### Alternâncias para Visualização Avançada

- **Vinculação e Rolagem**: Configure as opções para vincular séries no mesmo plano e rolar entre séries dentro de um viewport.

- **Alternância de Visibilidade**: Controle a exibição de anotações, achados, sobreposições e linhas de referência. Ative o modo cine conforme necessário.

### Condições para Filtragem

- **Filtragem com Tags DICOM**: Defina condições para filtrar séries com base em tags DICOM específicas, aumentando a relevância das imagens exibidas.

## Configuração do Modelo de Correspondência de Estudos Anteriores no OmegaAI

A Configuração do Modelo de Correspondência de Estudos Anteriores no OmegaAI permite que os usuários definam como estudos anteriores são correspondidos aos estudos atuais com base em uma variedade de critérios. Essa funcionalidade é crucial para garantir que dados históricos relevantes estejam acessíveis e devidamente alinhados com novos estudos de imagem para avaliações diagnósticas.

### Acessando o Modelo de Correspondência de Estudos Anteriores

Para acessar a Configuração do Modelo de Correspondência:

1.  **Abra o Painel de Configuração**: Este painel inclui todos os modelos de correspondência de estudos anteriores que você criou. O modelo atualmente em uso para o protocolo de exibição estará destacado.

2.  **Identificação do Modelo Padrão**: Um rótulo de padrão indica qual modelo está definido como padrão para todos os protocolos de exibição.

### Criando e Editando Modelos de Correspondência

#### Adicionando um Novo Modelo

- **Criar Novo Modelo**: Selecione a opção **Modelo de Correspondência** no menu suspenso e clique no ícone "+" no topo do painel para iniciar a criação de um novo modelo de correspondência.

#### Gerenciando Modelos Existentes

- **Editar ou Excluir**: Clique nos três pontos ao lado de qualquer modelo existente para abrir opções de edição, exclusão ou defini-lo como modelo padrão.

#### Opções de Configuração

Nome do Modelo

**Propósito**: Serve como identificador para o modelo de correspondência.

Parte do Corpo

**Padrão**: Definido automaticamente para corresponder à parte do corpo do estudo atual.

**Personalização**: Permite especificar uma ou mais partes do corpo para correspondência.

Data do Estudo

**Intervalo**: Define o período no qual buscar estudos anteriores, até um máximo de 360 meses a partir da data do estudo atual.

Status do Estudo

**Padrão**: Definido para corresponder ao status do estudo atual por padrão.

**Opções Personalizadas**: Permite a inclusão de status de estudo específicos no modelo de correspondência.

Modalidade

**Padrão**: Definido para corresponder à modalidade do estudo atual por padrão.

**Múltiplas Modalidades**: Permite a seleção de modalidades adicionais a serem incluídas na correspondência.

Lateralidade

**Padrão**: Corresponde à lateralidade do estudo atual por padrão.

**Opções Adicionais**: Permite a adição de mais opções de lateralidade, se necessário.

Código de Procedimento

**Padrão**: Corresponde ao código de procedimento do estudo atual por padrão.

**Expansão**: Permite adicionar mais códigos de procedimento ao modelo de correspondência.

Descrição do Estudo

**Funcionalidade**: Um campo de busca de texto que permite pesquisas por palavras-chave nas descrições dos estudos.

**Opções de Critério**: Inclui a possibilidade de especificar o texto usando opções como inclui, não inclui, igual ou diferente.

#### Finalizando o Modelo

Depois de configurar as opções desejadas:

- **Salvar Alterações**: Clique em **Salvar** para aplicar e salvar as modificações ou a criação de um novo modelo de correspondência.

## Publicando Protocolos de Exibição no OmegaAI

Publicar protocolos de exibição no OmegaAI envolve finalizar as configurações e ajustes de um protocolo para garantir que ele esteja adaptado às necessidades clínicas específicas e, em seguida, disponibilizá-lo para uso dentro de uma organização ou para usuários individuais. Esse processo é fundamental para a aplicação eficiente de configurações de visualização padronizadas em diferentes estudos e modalidades.

### Etapas para Publicar Protocolos de Exibição

#### Salvando o Protocolo

1.  **Finalizar Configurações**: Certifique-se de que todas as alterações e configurações desejadas estejam devidamente ajustadas no seu protocolo de exibição.

2.  **Salvar o Protocolo**: Clique no ícone **+** e depois em "Salvar" para salvar seu protocolo de exibição configurado.

#### Definindo Detalhes do Protocolo

Ao salvar um protocolo de exibição, será necessário fornecer detalhes específicos para garantir que o protocolo seja aplicado e acessível adequadamente:

- **Nome do Protocolo**: Insira um nome único para o protocolo de exibição para identificá-lo facilmente depois.

- **Seleção da Organização**: Escolha a organização específica na qual o protocolo de exibição será utilizado. Isso determina o escopo de acessibilidade.

- **Modalidade**: Defina para quais modalidades (ex.: Ressonância Magnética, Tomografia, Raio-X) o protocolo de exibição deve ser aplicado. Isso garante que o protocolo seja usado apenas com estudos de imagem relevantes.

- **Código de Procedimento**: Especifique os códigos de procedimento para os quais este protocolo de exibição foi projetado. Isso restringe sua aplicação a tipos específicos de estudos.

- **Parte do Corpo**: Indique quais partes do corpo são relevantes para este protocolo de exibição, garantindo que ele seja acionado adequadamente com base nas imagens visualizadas.

- **Lateralidade**: Determine se a lateralidade (esquerda, direita, bilateral) deve ser considerada na aplicação do protocolo de exibição.

#### Nível de Acessibilidade e Uso

- **Seleção de Nível**: Escolha entre nível "Site" ou "Usuário" para a acessibilidade do protocolo:

  - **Nível Site**: O protocolo de exibição estará disponível para todos os usuários dentro da organização selecionada, permitindo uso amplo e modificações.

  - **Nível Usuário**: O protocolo estará acessível apenas para sua conta de usuário, tornando-o privado e adaptado às suas necessidades específicas.

#### Definindo como Padrão

- **Protocolo Padrão**: Você tem a opção de definir este protocolo de exibição como padrão para a modalidade especificada. Isso significa que ele será aplicado automaticamente, a menos que outro protocolo específico seja escolhido.