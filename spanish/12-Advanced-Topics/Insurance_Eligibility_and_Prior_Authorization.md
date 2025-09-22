---
sidebar_position: 8
title: Elegibilidade de Seguro e Pré-Autorização
tags:
- Seguro
- Elegibilidade
- Pré-Autorização
- Cobertura Médica
- Gerenciamento de Pagadores
- Cobertura do Paciente
- Pagadores de Seguro
- Elegibilidade Automatizada
- Faturamento Médico
---

:::info
**Aviso**: Todos os recursos desta página que exigem verificações automatizadas de elegibilidade e pré-autorização dependem de uma integração de terceiros adquirida separadamente. Por favor, entre em contato com seu gerente de sucesso do cliente para mais informações.
:::

# Elegibilidade de Seguro e Pré-Autorização

No OAI, a Elegibilidade de Seguro e Pré-Autorização automatizadas são realizadas por meio da integração com uma solução de terceiros.

## Adicionando Pagadores de Seguro à Organização

- Clique em **Organização** no painel à esquerda e abra a respectiva página de detalhes da organização

- Dentro da página de detalhes da **Organização**, clique em **RIS**. Isso irá expandir e exibir o **Pagador de Seguro**

- Clique em **Pagadores de Seguro**. Isso abrirá os pagadores de seguro onde o usuário pode adicionar novos pagadores, editar pagadores existentes e excluir pagadores existentes

- Clique no ícone **+** para adicionar um novo pagador de seguro. Isso abrirá o painel **Adicionar novo pagador de seguro**.

- Pesquise o nome do pagador de seguro que deseja adicionar. Será feita uma busca na lista de pagadores de seguro suportados pela integração de terceiros, juntamente com o ID do respectivo pagador.

- Selecione o **Nome do pagador de seguro** e preencha os outros detalhes como Tipo Financeiro, Endereço e Detalhes de Contato, depois clique em **Criar** para criar este pagador

- Uma vez que o pagador for salvo, ele será refletido na lista de **Pagadores de Seguro** exibida

## Editando/Excluindo um Registro de Pagador de Seguro

- Ao passar o mouse sobre o registro do Pagador na página da **Lista de Pagadores**, você verá os ícones **Editar** e **Excluir**

- Ao clicar no ícone **Editar**, o painel **Editar Pagador** será aberto

- Os usuários poderão editar os detalhes e, ao clicar no botão **Atualizar**, os detalhes serão salvos

- Para excluir um registro de Pagador, clique no ícone **Excluir**

- Ao clicar no ícone **Excluir**, o respectivo registro de Pagador será excluído e desaparecerá da lista de Pagadores

## Adicionando Cobertura para um Paciente

As informações de cobertura de um paciente podem ser adicionadas na página **Informações do Paciente**, na seção **Cobertura**.

- Ao clicar no botão **+**, o painel **Adicionar Nova Cobertura** será aberto.

- Ao digitar o **Nome do Pagador**, o usuário pode pesquisar e selecionar da lista de pagadores adicionados à organização.

- Defina o **Status da cobertura** no topo da página **Adicionar cobertura**.

- Preencha os detalhes da cobertura do paciente, incluindo o **Nome do Pagador** e o intervalo de datas de **Vigência da Cobertura**.

- Por padrão, o **Relacionamento do Membro** com o paciente é selecionado como “Próprio”, e o **Nome do Membro** é preenchido automaticamente com o nome do paciente.

- O usuário pode alterar o **Relacionamento do Membro** clicando no menu suspenso e selecionando o relacionamento apropriado.

- Faça as alterações necessárias selecionando o relacionamento com o paciente e pesquisando o nome do **Membro**.

- Uma vez que o Membro seja selecionado, o campo **Nome do membro** será preenchido com o registro selecionado.

- Se o Membro não estiver presente no OAI, o registro do Membro deve ser criado no OAI.

- Clique em **Adicionar Novo** para criar um registro de paciente para o Membro.

- Uma vez que o novo registro de Membro seja criado no OAI, o usuário poderá selecionar o relacionamento e preencher o novo registro de Membro criado.

- Insira os detalhes de **ID do Membro** e **Número do Grupo**.

- O usuário pode selecionar o nome do **Empregador** pesquisando na lista de empregadores no OAI.

- Se o **Nome do Empregador** não estiver presente no OAI, o registro do Empregador pode ser criado no OAI.

- Clique em **Adicionar Novo** para criar um registro de Empregador para o Membro.

- Uma vez que o novo registro de Empregador seja criado no OAI, o usuário poderá selecioná-lo e preencher o novo registro de Empregador criado.

- O usuário pode, opcionalmente, adicionar a imagem do cartão de seguro do Membro.

- Depois de adicionar todos os detalhes, ao clicar no botão **Salvar**, as informações de cobertura serão salvas.

- Uma vez que as informações de cobertura do paciente sejam salvas, se a organização tiver assinado o produto de verificação de elegibilidade, então—independentemente do valor selecionado no campo **Status da cobertura de elegibilidade**—a API de verificação de elegibilidade de terceiros será chamada com as informações inseridas.

- Os resultados da API chegarão instantaneamente e atualizarão os detalhes da cobertura.

- Se a cobertura estiver **ativa**, o campo **Status da cobertura de elegibilidade** será atualizado automaticamente, e o cartão de detalhes da cobertura será atualizado com um link para o relatório de elegibilidade.

- Se a cobertura estiver **inativa** devido a informações incorretas ou se não houver cobertura ativa para o usuário, isso será instantaneamente visível na tela como uma mensagem de notificação, e o cartão de detalhes da cobertura subsequente será atualizado.

- Sempre que qualquer informação relacionada à cobertura for atualizada, a API de verificação de elegibilidade será chamada novamente para refletir o status mais recente da cobertura.