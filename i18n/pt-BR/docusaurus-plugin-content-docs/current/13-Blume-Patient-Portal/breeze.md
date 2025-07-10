---
sidebar_position: 7
title: Blume como um Ativo no Breeze
---

# Blume como um Ativo no Breeze

**Introdução**

Este manual serve como um guia abrangente para administradores que gerenciam
o ativo Blume dentro do Breeze. Este guia cobre recursos do ativo,
configurações de licenciamento, autoagendamento, integração com OmegaAI e
opções de personalização.

## A. Configurando Organizações no Breeze

**Criando uma Nova Organização**

Para configurar uma nova organização no Breeze:

- Navegue até a aba **Organizações**.

- Clique no botão **+ (Adicionar Organização)**.

Preencha os campos obrigatórios:

- **Nome da Organização**: Insira o nome exato conforme listado.

- **ID do Cliente**: Recupere o ID do cliente no Salesforce ou outras
  fontes verificadas.

- **Status da Conta**: Defina como "*Ativo*".

- **Status do Certificado**: Marque como "*Ativo*".

- Adicione campos opcionais, como fuso horário local e endereço, se disponível:

  1. Exemplo: "Localização Toronto, Fuso Horário EST".

- Clique em **Salvar**.

**Editando Detalhes da Organização**

Para modificar detalhes de uma organização existente:

- Navegue até a organização no Breeze.

- Clique no campo relevante (por exemplo, Proprietário da Conta, ID do Cliente) para editar.

- Salve as alterações.

**Habilitando Ativos para uma Organização**

Para habilitar ativos para uma organização:

- Vá até a seção ***Ativos*** nas configurações da organização.

- Ative os ativos necessários, como ***Blume*** ou ***AFD***.

- Verifique se as alterações refletem corretamente no *Blume* e
  *OmegaAI*.

## B. Principais Recursos do Blume no Breeze

### 1. Sem Licença

Sem uma licença *Blume*, nenhum dos recursos estará acessível.

Isso implica que:

- **Sem configuração de autoagendamento no OmegaAI**

  - A opção ***autoagendamento*** não estará disponível para a
    organização no OmegaAI. Os usuários não poderão editar as configurações de autoagendamento.

- **Sem gerenciamento de formulários no OmegaAI**: Formulários clínicos e de registro
  não estarão disponíveis.

  - A seção ***configuração de formulários*** não estará acessível. Isso
    significa que os usuários não poderão criar ou modificar formulários personalizados para a organização no OmegaAI.

- **Sem notificações**: Nem notificações in-app nem por e-mail funcionarão.

- **Sem visualização ou compartilhamento de exames**: Pacientes não podem visualizar, baixar ou
  compartilhar seus exames.

  - A opção ***Enviar Exame para Blume*** não estará visível para a
    organização no OmegaAI. Como resultado, os usuários não poderão enviar
    exames diretamente para o Blume pela interface.

- **Sem gerenciamento de agendamentos**: Marcação, remarcação e cancelamento
  de agendamentos serão bloqueados.

**Nota:** Se um paciente tentar agendar um exame em uma unidade
que não adquiriu nenhuma licença, verá a mensagem:
*Esta unidade não suporta agendamento online. Por favor, ligue para mais
detalhes e para marcar um agendamento.*

### 2. BPP (Licença Básica Blume)

A *Licença Básica Blume (BPP)* oferece funcionalidades limitadas, focando
principalmente em convites por e-mail para pacientes e gerenciamento básico de exames (visualizar e compartilhar exame).

Recursos habilitados incluem:

- **Convites por e-mail**: Pacientes recebem convites por e-mail.

- **Sincronização de exames**: Garante que os dados dos exames sejam sincronizados entre
  Blume e OmegaAI.

**Limitações:**

- Autoagendamento, formulários e notificações permanecem indisponíveis.

- Pacientes só podem visualizar, baixar e compartilhar exames por e-mail, mas
  não podem agendar online.

**Como habilitar o *BPP*:**

1.  Navegue até ***Configurações* \> *Ativo*** no Breeze.

2.  Ative a opção ***Portal do Paciente Blume***.

A opção de licença AFD será automaticamente desativada quando o BPP for habilitado.

### 3. AFD (Licença Premium Blume)

A *Licença Premium Blume (AFD)* desbloqueia toda a gama de recursos,
fornecendo acesso completo a todas as ferramentas e funcionalidades.

Inclui:

- **Autoagendamento**: Pacientes podem agendar online.

- **Gerenciamento de formulários**: Formulários clínicos e de registro estão disponíveis
  para personalização.

- **Notificações**: Notificações in-app e por e-mail totalmente habilitadas.

- **Gerenciamento de exames**: Pacientes podem visualizar, baixar, compartilhar e gerenciar
  seus exames.

- **Gerenciamento de agendamentos**: Pacientes podem agendar, remarcar e cancelar
  agendamentos conforme necessário.

**Como habilitar o AFD:**

1.  Navegue até ***Configurações* \> *Ativo*** no Breeze.

2.  Ative a opção ***Blume Automated Front Desk***.

3.  Certifique-se de que outras opções de licença (ex: BPP) estejam desativadas.

**Gerenciamento de Autoagendamento**

O **autoagendamento** permite que pacientes agendem seus exames online
pelo portal do paciente: *Blume*

- **Habilitando/Desabilitando o Autoagendamento**

  - Navegue até ***Agendador* \> *Configurações* \> *Organização*** no
    OmegaAI.

  - Selecione a *modalidade específica* (ex: TC, RM).

  - Ative/desative o botão ***Autoagendamento***:

- **Ligado**: Habilita autoagendamento via Portal Blume / URL personalizada
  para a modalidade.

- **Desligado**: Desabilita autoagendamento via Portal Blume / URL personalizada

- **Como obter a URL personalizada para autoagendamento? (Esta URL deve ser
  publicada no site do cliente para habilitar o autoagendamento)**

  - Vá até ***Organização* \> *Detalhes* \> *RIS* \> *Autoagendamento*
    \> *Editar*** no OmegaAI.

- Clique em ***Copiar Link*** abaixo do Link de Agendamento para o Site.

- Incorpore o link no site da organização para uso do paciente ou médico solicitante.

**Gerenciamento de Agendamento e Consultas**

- **Licença Básica**

  - Pacientes podem visualizar exames, mas não podem agendar online.

  - Se um paciente tentar agendar, verá a seguinte mensagem:
    *Esta unidade não suporta agendamento online. Por favor, ligue para
    mais detalhes e para marcar um agendamento.*

- **Licença Premium**

  - Pacientes podem visualizar exames, agendar, remarcar e cancelar
    agendamentos.

Organizações que utilizam o Blume com licença premium podem configurar
se pacientes ou médicos podem **remarcar** ou
**cancelar** agendamentos. Esta configuração pode ser gerenciada via
OmegaAI.

- Administradores podem ativar/desativar as opções de remarcação e cancelamento:

1.  **Navegue até as Configurações da Organização**

- Vá até **Organização \> Detalhes \> RIS \> Autoagendamento** no
  OmegaAI.

2.  **Comportamento Padrão**

- Por padrão, tanto **Cancelar Agendamentos** quanto **Remarcar
  Agendamentos** estão **habilitados** para licenças premium.

3.  **Editando as Configurações**

- Clique no botão **Editar** para ativar/desativar as opções de **Cancelar** e
  **Remarcar** agendamentos no Blume para pacientes/médicos.

- **Permitido** *habilitado*: A função estará disponível no Blume, e
  pacientes/médicos poderão vê-la e usá-la.

- ***Desligado***: A função não estará disponível no Blume, e
  pacientes/médicos não a verão nem poderão usá-la.

**Exemplo de Caso de Uso**

- Uma organização pode querer que pacientes/médicos possam **remarcar**
  agendamentos no Blume, mas não **cancelar**.

- Para isso, podem habilitar a opção **Remarcar** enquanto
  desabilitam a opção **Cancelar** usando os botões de alternância no
  OmegaAI.

- Como resultado, apenas o botão **Remarcar** ficará visível no Blume,
  e o botão **Cancelar** não aparecerá.

Ao habilitar ou desabilitar essas opções no OmegaAI, as organizações podem
controlar seletivamente a disponibilidade das funções de **Remarcar** e
**Cancelar** no Blume. Essa flexibilidade permite que as organizações
alinhem a funcionalidade às suas políticas e fluxos de trabalho específicos.

4. **Configurando Autoagendamento no Agendador OmegaAI**

- **Para habilitar ou desabilitar o autoagendamento para modalidades específicas no
  OmegaAI, siga os passos abaixo**:

  - Passos para Habilitar/Desabilitar o Autoagendamento

1.  **Navegue até Configurações do Agendador**

- Vá até **Agendador \> Configurações \> Organização** no OmegaAI. Selecione a
  organização.

2.  **Selecione a Modalidade**

- Escolha a modalidade específica (ex: TC, RM) para a qual deseja
  configurar o autoagendamento.

Observe que a opção de autoagendamento pode ser habilitada
para múltiplas modalidades simultaneamente. No entanto, se o autoagendamento
precisar ser configurado para uma modalidade específica, você deve selecionar cada
modalidade individualmente e ativar/desativar a opção conforme necessário.

3.  **Editar Configurações da Modalidade**

- Clique no botão **Editar** no topo da página.

4.  **Ative/Desative o Botão de Autoagendamento**

- **Ligado**: Habilita agendamento público/**autoagendamento** para a modalidade
  selecionada via Portal Blume.

- **Desligado**: Desabilita agendamento público/**autoagendamento** para a modalidade
  selecionada via Portal Blume.

**Exemplo de Caso de Uso**

Usando essa funcionalidade, o autoagendamento pode ser habilitado ou
desabilitado seletivamente para diferentes modalidades conforme a necessidade da unidade.

Por exemplo, se uma unidade quiser permitir agendamentos de **TC** para
médicos e pacientes via Portal Blume, mas não quiser disponibilizar
agendamentos de **RM** publicamente, ela pode:

- Ativar o autoagendamento para **TC** seguindo os passos acima.

- Desativar o autoagendamento para **RM** seguindo os passos acima.

Este recurso oferece flexibilidade ao permitir que as organizações gerenciem a
disponibilidade pública de modalidades específicas, garantindo que apenas os
serviços desejados estejam acessíveis para autoagendamento no Portal Blume.

### 4. Solução de Problemas e Suporte

**Problemas Comuns**

- **Recursos não funcionam**: Verifique se a licença correta está habilitada
  (BPP ou AFD).

- **Autoagendamento indisponível**: Certifique-se de que o botão **Autoagendamento**
  está ativado para as modalidades relevantes.

- **Para verificar o acesso à licença do ativo e alterações feitas no Breeze, siga estes passos:**

-	Faça login no OmegaAI usando suas credenciais de administrador.

-	Navegue até Logs: 

No menu vertical à esquerda, clique em *Logs*.

-	Para selecionar o tipo de log: Navegue até o canto inferior direito e clique no círculo azul com a opção padrão ***DICOM*** selecionada.

-	Role para cima no menu pop-up e selecione *Audit Log (AL)*.

-	Escolha sua organização: Use o filtro de organização para selecionar a organização que você gerencia.

-	Detalhes da busca: Você pode visualizar detalhes como *Data/Hora de Acesso, Nome de Usuário* e *E-mail de Login*.

-	Você pode consultar a coluna **Descrição do Resultado**, que especifica quaisquer alterações na licença ou ativo.

Esse processo ajuda a rastrear a atividade do usuário e modificações de licença para melhor auditoria e conformidade.

NOTA: 
A).	O acesso a recursos como visualização de exames, compartilhamento de exames, gerenciamento de agendamentos e autoagendamento dentro do Blume depende da configuração de licenciamento da organização no Breeze, conforme descrito acima. A disponibilidade dessas funcionalidades pode variar de acordo com a licença específica, como AFD, BPP ou Sem Licença adquirida pelo seu provedor de saúde.

B). A licença Blume Básica (BPP) fornece acesso a Convites para Pacientes e Sincronização de Exames, enquanto a licença Blume Premium (AFD) inclui todos os recursos do BPP mais Blume Forms, Blume WFA, Notificações & Confirmação no App e Autoagendamento. Sem uma licença Blume, os usuários não têm acesso a nenhum desses recursos.

C). Se você encontrar recursos restritos, entre em contato com seu provedor de saúde para mais informações sobre as configurações atuais da licença Blume.

D). Transição de Licença e Acessibilidade de Dados

  1. Quando uma organização habilita a licença AFD, os usuários Blume ganham acesso a:-
  
- Autoagendamento
- Formulários clínicos e de registro personalizados
- Notificações in-app e por e-mail
- Visualização, download, compartilhamento e gerenciamento de exames
- Marcação, remarcação e cancelamento de agendamentos

2. Troca de Licenças e Retenção de Dados:-

- Se a organização trocar de AFD para BPP, todos os exames anteriores (laudos/imagens) e agendamentos emitidos durante a licença AFD permanecem acessíveis. No entanto, para novos agendamentos, apenas Sincronização de Exames e Convites por E-mail (recursos do BPP) estarão disponíveis.
  
- Se a organização voltar para AFD após BPP, os usuários recuperam o acesso a todos os detalhes de exames e agendamentos passados dos períodos de licença AFD e BPP.
  
 3. Período Sem Licença:-

- Quando uma organização não possui licença ativa, os usuários não têm acesso a nenhum recurso, incluindo convites por e-mail, sincronização de exames, autoagendamento ou gerenciamento de agendamentos.
- Se a organização posteriormente habilitar a licença BPP, os usuários poderão acessar todos os exames anteriores e os recém-sincronizados.
- Se a organização habilitar a licença AFD, os usuários poderão visualizar exames e agendamentos anteriores do período sem licença, além dos novos.  
  
4. Retornando para Sem Licença:-
  
- Se a organização desabilitar AFD/BPP e voltar para Sem Licença, os registros anteriores dos períodos AFD/BPP permanecem acessíveis, mas os usuários perdem acesso a todos os novos recursos relacionados a agendamentos.