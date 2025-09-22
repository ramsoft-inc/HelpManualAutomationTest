---
sidebar_position: 6
title: Controle de Acesso de Usuário, Papéis e Privilégios
---

# Controle de Acesso de Usuário, Papéis e Privilégios

No OmegaAI, os usuários estão associados a uma organização gestora. A organização à qual estão afiliados determinará quais informações o usuário
pode acessar. Além disso, cada usuário ou dispositivo possui papéis. Um papel determina quais privilégios o usuário possui dentro do sistema.

No entanto, médicos solicitantes e consultores podem acessar estudos de várias organizações, mesmo que não estejam associados a nenhuma organização. Se seus nomes estiverem atribuídos no campo
Médico Solicitante ou Médico Consultor, eles recebem os seguintes privilégios:

- **Visualizador de Imagens**: Somente leitura

- **Lista de Trabalho**: Visualizar estudos aos quais estão atribuídos

- **Relatório Diagnóstico**: Somente leitura, acesso apenas a relatórios finais

- **Busca de Estudos**: Acesso total aos registros aos quais estão associados

- **Busca de Pacientes**: Acesso total aos registros aos quais estão associados

## Controle de Acesso de Usuário (UAC)

O UAC é uma parte essencial do OmegaAI que restringe a capacidade dos usuários
de acessar apenas as informações para as quais estão autorizados.

Como o usuário faz parte da organização gestora, ele pode acessar
todas as informações, incluindo as das suborganizações associadas,
se houver. No entanto, o acesso do usuário à informação é determinado
pelo papel atribuído ao usuário.

### Papéis

A combinação de papéis e privilégios de usuário determina quais funções um
usuário poderá desempenhar no sistema. O OmegaAI possui papéis pré-configurados e
tipos de usuários baseados nas tarefas gerais realizadas por usuários em estabelecimentos
médicos.

#### Acessando a Configuração de Papéis

Para gerenciar os papéis de usuário dentro do OmegaAI, siga estes passos:

1.  **Selecione a Organização:**

    - Navegue até a organização que deseja gerenciar. Observe que a configuração de papéis de usuário só pode ser realizada na organização de nível superior ou
      organização mestre.

2.  **Página de Usuários:**

    - No painel da organização, vá para a página **Usuários**.

3.  **Ícone de Configuração de Papéis:**

    - Clique no ícone de papéis localizado no canto superior direito da tela para
      abrir a tela de configuração de papéis.

#### Tela de Configuração de Papéis

Na tela de configuração de papéis, você encontrará o seguinte:

- **Nome do Papel:** O nome atribuído ao papel específico.

- **Tipo de Usuário:** Indica o tipo de usuários associados ao papel.

- **Número de Usuários:** Mostra quantos usuários estão atualmente vinculados a cada
  papel.

- **Padrão:** Indica se um papel é o padrão para novos usuários.
  
  


Interações:

- **Duplicar:** Clique no primeiro ícone ao passar o mouse para duplicar um papel.

- **Editar:** O segundo ícone permite modificar as configurações do papel.

- **Excluir:** O terceiro ícone pode ser usado para excluir um papel, apenas se não houver
  usuários atualmente associados a ele.

#### Editando Papéis

Na tela de edição de papéis, você encontrará várias seções:

- **Nível Principal:** Lista as principais categorias ou telas acessíveis ao
  papel.

- **Nível Secundário:** Exibe subopções para a categoria principal selecionada.

- **Nível Terciário:** Detalhes adicionais e recursos específicos dentro de uma
  subopção.

Funcionalidades:

- **Alternar:** Ativa ou desativa recursos específicos para um papel em vários
  níveis.

- **Editar (Ícone de Lápis):** Permite editar no nível terciário, não
  aplicável a todos os itens.

- **Buscar:** Use a função de busca para localizar campos específicos dentro
  do nível terciário.

### Tipos de Usuário e seus Papéis

O OmegaAI suporta vários tipos de usuário, cada um correspondente a diferentes
papéis dentro do fluxo de trabalho da saúde:

- **Médico Laudo (Reading Physician)**

- **Médico Solicitante (Referring Physician)**

- **Médico Executor (Performing Physician)**

- **Tecnólogo Executor (Performing Technologist)**

- **Transcritor (Transcriptionist)**

- **Agendador (Scheduler)**

- **Recepção (Front Desk)**

Finalidade:

- Esses tipos são usados para agrupar usuários e definir quais dados preenchem
  campos específicos, como atribuir um estudo a um médico laudo.

### Implicações no Fluxo de Trabalho:

- **Médico Laudo:** Concluir uma ação em um visualizador de imagens ou documentos
  pode assinar a versão final de um relatório.

- **Tecnólogo:** Ações semelhantes significam a conclusão de seu
  fluxo de trabalho, avançando o estudo de **Concluído** para **Verificado**.

Ao configurar um fluxo de trabalho, entender como os tipos de usuário interagem com
processos automatizados é essencial. Por exemplo, identificar o
tipo de usuário apropriado para acionar ações específicas pode ajudar na prevenção de fraudes e otimizar operações.