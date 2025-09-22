---
sidebar_position: 6
title: Power Server - Integração Blume
---
# Integração Power Server Blume

## Pré-requisitos

Configure a organização nas plataformas OAI e PS, garantindo que as modalidades, conjuntos de estudos, códigos de procedimentos e serviços de saúde estejam criados e configurados corretamente.

## Criar Organização no OmegaAI e PowerServer

[**https://ramsoftinc.atlassian.net/wiki/spaces/OA/pages/451182597/Onboard+Customers+with+Shared+PS+Storage**](https://ramsoftinc.atlassian.net/wiki/spaces/OA/pages/451182597/Onboard+Customers+with+Shared+PS+Storage)

## Criando Recursos de Saúde no PowerServer

## Criar Organização no OmegaAI e PowerServer

**Login no PowerServer**

1.  Acesse a página de login do PowerServer.

2.  Insira seu nome de usuário e senha.

3.  Clique no botão Login.

**Nota sobre Criação de Serviço de Saúde:**



4.  Se aplicável, conclua a autenticação multifator.

5.  Após o login, um bloco da janela do aplicativo será exibido.

6.  Clique uma vez no Power Reader.

7.  Clique no ícone do Power Reader e instale o RamSoft app launcher pela primeira vez. No próximo login, clique duas vezes no ícone.
8.  Faça login no OmegaAI com privilégios administrativos.



**Passos de Navegação.**

1.  Acesse a opção "Admin" ou "Setup" do PowerServer.

2.  Vá para "Settings".

3.  Clique em Usuário e Instalações (User and Facilities).



4.  Clique em Localização (Location).



5.  Insira os detalhes da localização.



6.  Clique em Recurso (Resource).



7.  Preencha os detalhes do recurso (nome do recurso, modalidade, duração padrão, horário de trabalho).

8.  Os parâmetros usados no PowerServer para criar um recurso de saúde devem ser os mesmos no OAI ao criar um recurso de saúde para sincronização.



9.  Atribua o recurso a fluxos de trabalho ou grupos de usuários específicos.

10. Clique em Fechar (Close) para criar o recurso.

## Criando Recursos de Saúde no OmegaAI

**Notas: Criação de Recurso de Saúde**

1.  Emissor de ID do Paciente:

    - O emissor do ID do paciente usado no PowerServer 6.0 deve existir sob a Organização Mestre no OmegaAI (OAI) para o cliente.

2.  Prioridade de Agendamento Personalizada:

## Criando Recurso de Saúde no PowerServer

    - Solicitações de agendamento de pacientes do Blume serão enviadas para o PowerServer 6.0 com uma prioridade personalizada rotulada como "SCHEDULED STATUS".

    - Essa prioridade deve ser adicionada manualmente no PowerServer 6.0 navegando até: Settings > Server Settings > Priority

      - Use uma conta PowerReader com acesso de administrador para concluir essa configuração.

3.  Sincronização de Instalações e Recursos:

    - Instalações e recursos devem ser sincronizados manualmente durante o processo de onboarding.

    - Esta etapa é essencial para permitir a propagação adequada da atribuição de dados entre o PowerServer 6.0 e o OmegaAI.

**Passos para Criar um Novo Recurso de Saúde e Sincronizar Entre OmegaAI e PowerServer**

**No OmegaAI:**

1.  Faça login no *OmegaAI* com suas credenciais de administrador.

2.  Navegue até **Scheduler** no lado direito.

3.  Clique em **Editar Serviços de Saúde** (Edit Healthcare Services).

4.  Clique no ícone **+** ao lado do cabeçalho de Serviços de Saúde para criar um *novo recurso de saúde.*

5.  No campo **Pesquisa de Organização** (Organization Search), insira sua organização.

6.  Use o **Botão Ativo** (Active Toggle) para ativar ou desativar o recurso.

7.  Ao lado do Nome do Recurso, escolha um *código de cor* para seu recurso.

8.  No campo **Nome do Recurso** (Resource Name), insira o nome desejado para o recurso.

9.  Selecione a **Modalidade** apropriada na lista suspensa.

10. Defina a Duração (padrão é 1 hora, formato: HH:MM).

11. Personalize o **Horário de Trabalho** conforme necessário.

12. Ative o **Botão de Overbooking** se necessário.

13. Especifique os Dias da Semana juntamente com seus horários de início e término para o recurso.

14. Clique em **Salvar** ao lado do Botão *Ativo* para salvar seu recurso.

**No PowerServer:**

1.  Navegue até **Settings** -> **Users & Facilities** no *PowerServer*.

2.  Vá para **Imaging Facilities** e clique em **Location** (encontrado no canto inferior direito abaixo do botão Resource).

3.  Clique em **Location** para criar salas para os recursos.

4.  Use o botão **New** para criar um novo departamento/andar ou sala.

5.  Salve e feche.

6.  Para criar um novo recurso de saúde:

    - Navegue até **Settings** \> **Users & Facilities** \> **Imaging Facilities** \> Botão **Resource**.

    - Clique no botão **New** para adicionar um recurso.

7.  Insira os seguintes detalhes cuidadosamente:

    - **Departamento**

    - Selecione o **Nome da Sala** (Room Name) no menu suspenso (conforme criado anteriormente)

    - **Tipo**

    - **Modalidade**

    - **Classe**

    - Certifique-se de que o Nome do Recurso corresponde exatamente à entrada no OmegaAI.

8.  Insira os mesmos horários de início e término que no OmegaAI.

9.  Certifique-se de que a Duração Padrão corresponde ao valor no OmegaAI.

10. Clique em Salvar & Fechar (Save & Close) após preencher todos os detalhes.

**Sincronizando o Recurso:**

1.  Navegue até o Scheduler no PowerServer.

2.  Clique no **Botão Atualizar Dados** (Refresh Data Button) na barra de ferramentas.

3.  O novo recurso de saúde criado no OmegaAI agora deve estar visível no Scheduler do PowerServer.

**Passos de Navegação:**

1.  Login:

- Acesse o OmegaAI usando uma conta com privilégios administrativos.

2.  Navegue até Recursos:

- No painel, clique no ícone do Scheduler.

- Vá para Settings -> Resources.

3.  Editar Serviços de Saúde:

- Clique em Edit Healthcare Services.



4.  Clique em "Criar Novo Recurso" (Create New Resource).



5.  Insira os Detalhes do Recurso:

- Forneça as informações necessárias, como nome do recurso, modalidade, duração padrão, horário de trabalho, etc.

6.  Atribua o recurso a departamentos ou usuários específicos, se necessário.

7.  Salve e Verifique: salve a nova entrada de recurso e verifique sua precisão no sistema.

## Configuração de Formulário no OmegaAI

**Criando um Novo Formulário Blume**

1.  Iniciar Criação do Formulário:

- Clique no ícone 'Criar' ou faça upload de um formulário PDF preenchível.

- Esta ação abre o editor de formulários.

- Tipos de formulário suportados: 1. Formulário Normal 2. Formulário PDF

2.  Adicionar Perguntas:

- No editor de formulários, clique no botão 'Adicionar Pergunta'.

- Escolha entre vários tipos de perguntas:

  1.  Resposta Curta

  2.  Múltipla Escolha

  3.  Caixas de Seleção

3.  Configurar Configurações da Pergunta:

- Personalize as configurações para cada pergunta:

  1.  Marcar como obrigatória (se necessário).

  2.  Adicionar subcategorias.

  3.  Definir opções de resposta.

- Certifique-se de que todas as informações necessárias sejam coletadas.

4.  Visualizar e Publicar:

- Visualize o formulário para confirmar se atende aos seus requisitos.

- Se tudo estiver satisfatório, clique em 'Publicar' para disponibilizar o formulário para os pacientes.

**Acessando Formulários Blume**

- Faça login em sua conta OmegaAI.

- Navegue até a seção 'Apps'.

- Clique no ícone 'Configurações' dentro do aplicativo Blume.

**Gerenciando Formulários Blume Existentes**

1.  Vá para a tela de Configurações do Blume.

2.  Localize o formulário que deseja gerenciar.

3.  Use o menu de três pontos ao lado do formulário para:

- Visualizar

- Editar

- Despublicar conforme necessário.

**Formulários Enviados**

- Formulários de Registro Enviados: Exibidos no PowerServer (PS) -> Document Viewer -> seção Patient Docs.

- Formulários Clínicos Enviados: Exibidos no PowerServer (PS) -> Document Viewer -> seção Documents.

**Passos de Navegação**

1.  Navegue até Configurações do Blume em Meu App no OAI.

2.  Navegue até **Configurações** do Blume em **Meu App**.



3.  Clique no "ícone para Criar Novo Formulário".

4.  Clique no ícone "+" para criar novo formulário.



3.  A janela de Publicar Formulário aparece.

4.  Selecione um modelo de Formulário de Registro ou Formulário Clínico no menu suspenso.



5.  Adicione campos relevantes (por exemplo, informações do paciente, histórico médico).



6.  Personalize as propriedades dos campos (obrigatório, opcional, etc.).



7.  Clique no botão **PUBLICAR** no canto superior direito para publicar o formulário.

8.  Clique no botão *Publicar* no canto superior direito para publicar o formulário.



8.  Clique nos três pontos e selecione a opção *Despublicar* para descartar o

9.  Clique nos três pontos e selecione a opção **Despublicar** para descartar o formulário principal.

## Página Inicial do PowerServer

**Notas: PowerServer**

1.  Após o login, você estará na página inicial do PowerServer.

2.  A página inicial exibe métricas principais, tarefas e módulos.

3.  Acesse registros de pacientes, agendamentos e ferramentas de imagem no menu principal.

4.  Personalize o layout fixando ações frequentes ou notificações.

**Adicionando Paciente no PowerServer**



1.  Navegue até a barra de ferramentas principal.

2.  Clique no ícone "Adicionar Novo Paciente".

3.  Clique no ícone **Adicionar Novo Paciente**.



3.  Insira os dados demográficos do paciente (nome, data de nascimento, informações de contato).

4.  Faça upload de quaisquer documentos ou registros de saúde relevantes.

5.  Salve o perfil do paciente.

**Agendar Consulta**

  1.  ***Criando um Novo Agendamento***

A integração facilita o gerenciamento e confirmação de agendamentos. Uma vez que um agendamento é confirmado, os detalhes, juntamente com quaisquer formulários, são enviados ao visualizador de documentos, garantindo que todas as informações estejam facilmente acessíveis para revisão.

2.  ***Configuração Inicial***

Primeiro, acesse o portal Power Server e certifique-se de estar logado com as credenciais apropriadas. Para iniciar um novo agendamento, navegue até o scheduler.

O Scheduler é projetado para monitorar o uso de recursos, servindo como um calendário ou planejador detalhado para listar eventos (estudos) em seus horários e datas agendados. Quando ativado, os usuários podem visualizar e agendar estudos dentro de suas instalações associadas. Administradores do sistema e usuários não restritos a uma instalação específica terão acesso para visualizar todas as instalações no scheduler.

**Para agendar um estudo para uma consulta**:

**Método 1**:

1. Clique com o botão direito em um Horário Livre.



Método 1: Clique com o botão direito em um Horário Livre

Os recursos disponíveis e seus horários para uma instalação são definidos na seção Resources em Settings -> Users and Facilities -> aba.

2. Clique em Criar agendamento.

3. Preencha os detalhes.

4. Clique em Ok.

**Método 2**:

Clique duas vezes no horário no Scheduler.



O segundo método para agendar uma consulta é clicando duas vezes em um horário no scheduler. Isso abrirá novamente o formulário de Novo Pedido, e então os passos podem ser seguidos conforme explicado acima.

(Observe que, por padrão, um mínimo de 15 minutos é aplicado às durações do Tipo de Estudo para agendamentos marcados com menos de 15 minutos de intervalo.)

**Método 3**:

Arrastando os recursos apropriados para o Scheduler



Um terceiro método para agendar um estudo é arrastando-os para o recurso apropriado no scheduler.

Para agendar um estudo, a modalidade do recurso deve corresponder à modalidade agendada do estudo. O estudo deve estar com o status ORDERED (um status abaixo de SCHEDULED). Ao modificar a data e hora de uma consulta, o sistema atualizará automaticamente a data e hora do Estudo na tela Study Info.

**Método 4:**

Opção Criar Agendamento



O quarto método para criar um agendamento é escolhendo a opção Criar Novo Pedido na barra de menu e abrindo o formulário.

Para sua informação:

A criação de agendamento a partir do PS irá sincronizar e exibir um registro na aba Scheduled Appointment com o status Pending no Portal Blume.

Uma vez que o usuário Blume confirma o agendamento, o status no Blume mudará para scheduled, e o status do agendamento mudará para confirmado no PowerServer.

Reagendar esse agendamento a partir do Blume mudará o status de Scheduled para Requested; desta vez o agendamento deve ser alterado de Confirmed para Scheduled.

**Passos de Navegação**

1.  Vá para a seção **Agendamentos**.

2.  Clique duas vezes na respectiva data e hora para criar um novo agendamento.

*Consulte os outros métodos de criação de agendamentos conforme explicado acima.*



3.  Selecione o paciente na metapesquisa ou adicione um novo.



4.  Selecione o médico solicitante.

5.  Selecione os estudos.



6.  Escolha os tipos de estudo/conjunto de pedidos necessários e clique em Adicionar para múltiplos estudos do mesmo recurso.

7.  Confirme e salve o agendamento.

## Onboarding Blume

**Informações Básicas:**

1.  Acesse a plataforma Blume via login.

2.  Clique no botão "Entrar no Blume" recebido em seu convite por e-mail.



3.  Insira os dados de registro e clique em Registrar.



4.  Realize a verificação OTP associada ao endereço de e-mail.





5.  Vá para o agendamento e clique no botão Confirmar.



6.  Uma mensagem de Confirmação de Agendamento aparecerá: ***Confirmação de Agendamento***



7.  Uma notificação indicando o agendamento marcado é recebida na seção de Notificações.

**Preenchendo o Formulário**

1.  No formulário aberto, insira todas as informações exigidas com base na configuração específica de cada instalação. Isso pode incluir:

 - Informações do Paciente

- Datas Preferidas

- Serviços de Saúde Requeridos.

2.  Um recurso importante destacado é a capacidade de preencher E-forms dentro da plataforma Blume, o que garante sua apresentação precisa no leitor de documentos do Power Server.

3.  E-forms preenchidos são automaticamente sincronizados com o Power Server, permitindo atualizações em tempo real e visibilidade.

4.  Essa automação elimina a necessidade de intervenção manual e reduz possíveis erros na documentação.

**Enviando o Formulário**

  - Após preencher o formulário, clique no botão enviar. Se o sistema estiver funcionando corretamente, a solicitação de agendamento deve ser enviada sem problemas. No entanto, em alguns casos, pode ser necessário atualizar a página para confirmar que o formulário foi enviado com sucesso.

**Passos de Navegação**

1.  Vá para a seção de formulário atribuído no OmegaAI ou PowerServer.

2.  Abra o formulário atribuído ao paciente ou usuário clicando em *Acessar Formulário*.



3.  Insira as informações necessárias em cada campo do Formulário Pendente.

4.  Revise os dados para precisão.

5.  Envie ou salve o formulário para referência futura.

## Guia rápido para visualizar formulários e usar o Visualizador de Imagens no **PowerServer**

 **Passos principais**

1.  Acesse a seção de Registros do Paciente ou Formulários.

2.  Escolha o paciente cujo formulário ou imagem você precisa examinar.

3.  Abra o formulário ou use o Visualizador de Imagens para visualizar imagens médicas, incluindo raios-X ou ressonâncias magnéticas.

4.  Navegue até a seção Documentos para acessar a documentação do paciente.

5.  Utilize as ferramentas de Zoom e anotação para uma análise detalhada.

6.  Salve ou exporte as imagens, conforme necessário.

## Compartilhar o Estudo no Portal Blume

1.  Abra o estudo: Navegue até o estudo desejado que você deseja compartilhar.

2.  Acesse as Opções de Compartilhamento. Localize e clique na opção *Compartilhar via E-mail* abaixo do estudo.

3.  Duas opções de compartilhamento aparecerão:

**Copiar o link**:

- Clique na opção copiar o link.

- Cole o link em seu navegador

- Verifique o acesso inserindo o ID/CPF/HC do paciente ou Data de Nascimento para visualizar o estudo.

(Usuários externos sem login no Blume podem receber um link somente leitura para visualizar o estudo compartilhado.)

**Compartilhar com um Novo Contato:**

- Clique em + Compartilhar com um Novo Contato

- Insira o Nome do contato e endereço de e-mail

- Clique no botão compartilhar para enviar ou no botão cancelar para excluir ou reentrar os dados.

**Nota:**

- Contatos adicionados anteriormente serão listados abaixo para seleção direta.

- Vários contatos podem ser selecionados e compartilhados simultaneamente.

- Você também pode compartilhar o estudo com provedores de saúde existentes listados na Lista de Provedores de Saúde.

- Organizações associadas a pacientes usando o mesmo endereço de e-mail registrado aparecerão aqui para facilitar o compartilhamento.

## Buscar Exames Anteriores no **PowerServer**

1.  Use a função Pull Prior para recuperar registros ou imagens anteriores.

2.  Filtre com base na data ou tipo de dado anterior (por exemplo, laudos de imagem, resultados de laboratório).

3.  Revise as informações recuperadas e integre-as ao fluxo de trabalho atual do paciente.

## Autoagendamento no Blume e confirmação de agendamentos no PowerServer

- **Passos Principais**

1.  Faça login em sua conta Blume.

2.  Navegue até Agendar Novo Atendimento

3.  Clique em Agendar Novo Atendimento.




4.  Na janela Novo Atendimento, insira os detalhes do paciente, local e serviços de saúde e clique em Avançar.

5.  Selecione a data e hora.

6.  Clique em Agendar.

**Preenchendo o formulário**

1.  Preenchendo o Formulário:

    - Clique em Acessar Formulário a partir do estudo.



- O formulário deve ser preenchido conforme descrito na Seção E, garantindo que todas as informações necessárias sejam fornecidas para o agendamento.

**Confirmando agendamento no PowerServer**

  - Acesse o PowerServer e verifique a solicitação de agendamento.

  - Clique com o botão direito e selecione a opção Confirmado na lista.