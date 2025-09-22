---
sidebar_position: 5
title: Blume e OmegaAI
---

# Blume & OmegaAI

## Formulários Visíveis no Blume

Os formulários devem ser configurados no OmegaAI. Formulários de registro criados no nível da organização principal estarão visíveis para pacientes de todas as organizações filhas. Isso será exibido apenas uma vez para um novo paciente, durante o primeiro agendamento no Blume.

Formulários clínicos devem ser configurados no nível da Organização de Imagem. Com base no código de procedimento/modalidade para o qual foi configurado, apenas aqueles formulários específicos que correspondam à modalidade/conjunto de estudos do agendamento estarão visíveis no cartão de agendamento do paciente. Esses formulários estarão visíveis para o paciente toda vez que houver um agendamento com a modalidade/conjunto de estudos relevante.

### Visualizar Formulários no Blume

1. Clique na aba **Agendamentos** (**Agendados** ou **Concluídos**).

2. Vá até o agendamento específico.

3. Clique na opção **Visualizar Formulário** ou **Preencher Formulário**.

4. As seções **Formulários Pendentes** e **Formulários Concluídos** aparecem.

5. Ambos os formulários consistem em **Formulário de Registro** e **Formulário Clínico.**

6. Escolha o formulário desejado e visualize ou preencha o formulário em tela cheia.

### Formulários que não são Visíveis no Blume

Para criar um formulário que não seja visível para o paciente, mas apenas para a equipe da unidade de imagem, os formulários precisam ser configurados como formulários Organizacionais pela unidade. Para mais detalhes, consulte a seção Primeiros Passos, Configuração de Formulários: Acessando Formulários Organizacionais.

**Status de Agendamento Disponíveis no Blume**

| **RIS (Etapas do Fluxo de Trabalho)** | **Agendamento FHIR** | **Blume** |
| ------------------------ | -------------------- | --------- |
| Ordered                  | Proposed             | Requested |
| Scheduled                | Pending              | Pending   |
| Waitlist                 | Waitlist             | Pending   |
| Confirmed                | Booked               | Scheduled |
| Arrived                  | Arrived              | Scheduled |
| Ready for scan           | Checked-in           | Scheduled |
| No Show                  | No-show              | Cancelled |
| Cancelled                | Cancelled            | Cancelled |
| Completed                | Fulfilled            | Completed |

O status do estudo na lista de trabalho pode ser diferente do status do agendamento no Agendador OmegaAI. Se o cliente quiser alterar algum status, modifique o mapeamento do status do estudo nas configurações da **Organização** no OmegaAI.

Na aba **Meus Agendamentos**, os agendamentos do dia atual e futuros são exibidos. O status "Passado" é adicionado no Blume para indicar que o horário do agendamento já passou, enquanto o estudo ainda pode estar em andamento.

### E-mail de Convite do Blume Enviado ao Paciente pelo OmegaAI

Quando um paciente é criado no OmegaAI, um e-mail de convite do Blume é enviado automaticamente para o paciente.

**Nota**: O e-mail do paciente deve ser inserido na seção Informações Gerais da página do Paciente.

Caso o e-mail do paciente não tenha sido adicionado à página do Paciente, siga os passos abaixo.

1.  Acesse a página do Paciente pelo Omega Dial encontrado na página da Lista de Trabalho do OmegaAI. Clique uma vez em qualquer lugar da Lista de Trabalho para abrir o menu Omega Dial, depois clique em Paciente.

    

2.  Clique no botão home no canto superior direito.

    

3.  Clique no botão Editar.

4.  Adicione o E-mail do Paciente.

    

    

O convite do Blume será disparado se o e-mail do paciente não tiver sido previamente usado para cadastro no Blume e for o primeiro e-mail adicionado para o paciente.

### Reenviar E-mail de Convite do Blume ao Paciente pelo OmegaAI

**Fluxo de Trabalho**

Se um e-mail adicionado pela página de Informações do Paciente não estiver registrado em uma conta Blume, siga os passos abaixo para reenviar o convite:

1.  Faça login no Omega AI.

2.  Vá para a página inicial e acesse a lista de trabalho.

3.  Selecione Paciente no Menu Omega Dial.



4.  Na página de Informações do Paciente, expanda as Informações de Contato.

5.  O e-mail não registrado é marcado com status Desconhecido.



6.  Logo ao lado do e-mail, clique no ícone do Blume.

7.  A opção REENVIAR CONVITE aparece.

8.  Clique no botão Reenviar para disparar outro e-mail de convite.

9.  O status do e-mail muda para Ativo após a criação da conta.







10. A opção de reenviar estará disponível apenas para o e-mail principal.

    **Nota**: O botão Reenviar só estará habilitado com licença BPP/AFD.

### Configurando um Lembrete de Agendamento para Pacientes via OmegaAI

Não há disparo automático. Portanto, um lembrete precisa ser configurado na Automação de Fluxo de Trabalho.

## Acessando o Centro de Ajuda

1. Vá até a opção Ajuda no canto inferior esquerdo da página inicial.

2. As categorias de ajuda aparecem junto com a caixa de pesquisa.

3. Selecione a categoria respectiva e navegue pelos artigos.

Ou

1. Você pode digitar sua dúvida na caixa de pesquisa global na página inicial. Conforme você digita, a busca retorna informações relevantes para sua consulta. Além disso, ao clicar na barra de pesquisa, uma lista de suas pesquisas e visualizações recentes é exibida.

2. A busca pode ser categorizada em Pesquisar artigos de ajuda no topo da página inicial do centro de ajuda e Pesquisar Agendamentos, indicado pelo ícone de pesquisa no topo da página inicial. A busca por agendamentos traz dados de Estudos, Compartilhamento e Centro de Ajuda. A opção Todos mostra resultados de todas as categorias. Os resultados da busca podem ser filtrados.



## Fluxo de Trabalho de Ponta a Ponta

### Adicionando recurso de saúde no OAI

1.  Faça login no OmegaAi com privilégios administrativos.

2.  Navegue até a seção "Recursos" no painel.

 

3.  Clique em "Criar Novo Recurso".

 

4.  Preencha os detalhes necessários (ex.: nome do recurso, tipo,
    especialidade).

5.  Atribua o recurso a departamentos ou usuários específicos, se necessário.

6.  Salve e verifique o novo recurso cadastrado.

 


## Configuração de Formulário

1.  Navegue até Configurações do Blume em Meu App.

 

2.  Clique no ícone "+" para Criar Novo Formulário.

 

3.  A janela Publicar Formulário aparece.

4.  Selecione um modelo de Formulário de Registro ou Formulário Clínico no menu suspenso.

5.  Adicione os campos relevantes (ex.: informações do paciente, histórico médico).

 

6.  Personalize as propriedades dos campos (obrigatório, opcional, etc.).

 

7.  Clique no botão Publicar no canto superior direito para publicar o formulário.

 

8.  Clique nos três pontos e selecione a opção Cancelar Publicação para descartar o formulário.

 


### Criando novo pedido

1. Vá para a seção de criação de Pedido.

 

2. A janela Novo Pedido aparece.

 

3. Insira os dados do paciente e selecione o recurso ou serviço de saúde necessário.

4. Gere o pedido e salve para processamento posterior.



### Criando novo paciente

1. Acesse o módulo de cadastro de pacientes.

2. Vá para Novo Agendamento.

3. Clique em Adicionar Novo em Nome do Paciente.

 

4. Insira as informações demográficas e de contato do paciente.

5. Clique no botão Criar para adicioná-lo ao banco de dados do sistema.

6. Uma mensagem aparece confirmando a criação do novo paciente com a unidade de imagem.

 


### Agendando um horário

1. Abra o módulo de agendamento de consultas.

2. Selecione a data e hora no agendador.

 

3. A janela Novo Agendamento aparece.

4. Selecione o recurso de saúde.

5. Insira os dados do paciente.

 

6. Clique no botão Criar.

 

7. Mensagem de agendamento aparece com os detalhes.

8. Confirme os detalhes do agendamento e salve a programação.

 


### Onboarding do Blume

1. Ao criar um novo paciente, aparece uma mensagem informando a criação do novo paciente.

2. Clique no botão Entrar no Blume na mensagem.

 

3. Insira os dados de registro e clique em Registrar.

 

4. Realize a verificação OTP do e-mail cadastrado.

 


### Confirmação de agendamento

1. Vá até o agendamento programado.

2. Clique no botão Confirmar.

 


### Preenchendo formulário

1. Acesse o formulário necessário no Blume.

 

2. Complete cada campo com os dados do paciente ou do pedido.

3. Salve e envie o formulário conforme exigido pelo processo.

 


### Visualizar formulário OAI

1. Acesse o recurso de visualização de imagens dentro do OAI.

2. Carregue as imagens do paciente para revisão e análise.

 


### Visualizar visualizador de imagens

1. Acesse o recurso de visualização de imagens dentro do OAI.

2. Carregue as imagens do paciente para revisão e análise.

 


**Escrever e assinar relatório**

3. Abra o módulo de relatórios no OAI.

 

4. Elabore o relatório e assine digitalmente.

 

5. Salve o relatório concluído no prontuário do paciente.

 


### Visualizar estudo no blume

1. Navegue até a seção de estudos do Blume.

 


### Compartilhar o Estudo

1. Localize o estudo do paciente e revise os documentos e imagens associados.



### Fluxo 2 - Autoagendamento

1. Clique em Solicitar Agendamento.

 

2. Na janela Novo Agendamento, insira os dados do paciente, local,
  serviços de saúde e clique em Avançar.

3. Selecione a data e hora.

 

4. Clique em Agendar.

 




### Preenchendo formulário

1. Clique em Acessar Formulário a partir do estudo.

 

2. Instrua os pacientes a completar o formulário de autoagendamento.

3. Certifique-se de que forneçam todas as informações necessárias para o agendamento.

 


### Confirmando agendamento no OmegaAI

1. Acesse o OmegaAI e verifique a solicitação de agendamento.

2. Clique com o botão direito e selecione a opção Confirmado na lista.

 

3. Confirme ou ajuste conforme necessário, finalizando o agendamento para o paciente.