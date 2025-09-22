---
sidebar_position: 4
title: Logs
tags:
  - Login
  - Autenticação Multifator
  - Segurança
  - Log DICOM
  - Mirth
  - Notificação
  - E-mail
  - SMS
  - Monitoramento 
  - Filtros de Busca
  - Ordenação
  - Gerenciamento de Registros
  - Repetir/Cancelar Tarefas
  - Motivo do Status
---

# Logs

## Tipos de Logs

Este capítulo descreve como monitorar e editar logs. O OmegaAI oferece
a capacidade de visualizar tarefas (DICOM/FHIR) sendo executadas em um local
central e cancelar tarefas de saída, se você tiver a permissão necessária.

Os logs incluem o seguinte:

- **Log DICOM**: O Log DICOM permite aos usuários acompanhar o progresso e
  o status dos DICOM recebidos e enviados pelo sistema.

- **Mirth**: O log Mirth permite aos usuários acompanhar todos os detalhes do Mirth, incluindo: Status, Motivo do Status, Intenção, Descrição, Study Instance UID, Nome do Paciente e Solicitante.

- **E-mail**: O log de E-mail permite aos usuários acompanhar todos os detalhes de E-mail, incluindo: Status, Remetente, Destinatário, Gatilho e Mensagem.

- **SMS**: Permite aos usuários acompanhar todos os detalhes de SMS, incluindo: Status, Remetente, Destinatário, Gatilho, Mensagem, etc.

- **Notificação**: Permite aos usuários acompanhar todos os detalhes de Notificação, incluindo: Status, Remetente, Destinatário, Gatilho, Mensagem, etc.

- **Log de Auditoria**: O Log de Auditoria registra todas as atividades do sistema e dos usuários.

- **Histórico de Atividades**: O Histórico de Atividades é uma página somente leitura que
  mostra um registro de todas as atividades que você realizou. Observe que você
  não pode visualizar as atividades de outro usuário.

- **Log de Fax**: O Log de Fax exibe uma lista de faxes recebidos e enviados.

## Acessando e Monitorando o Log DICOM no OmegaAI
Esta seção fornece instruções detalhadas sobre como acessar e monitorar
os Logs dentro do sistema OmegaAI. Os usuários aprenderão como navegar
pela interface de Logs, utilizar várias funcionalidades como busca,
ordenação e gerenciamento de registros de tarefas, além de entender o significado
das diferentes colunas e status associados às tarefas.

### Passos para Acessar e Monitorar o Log DICOM

1.  **Acessando os Logs**

    - Abra a página inicial do OmegaAI.

    - Clique no ícone de Logs localizado na barra de navegação lateral para acessar
      a página de Logs, que aparece por padrão ao clicar no ícone de Logs.

2.  **Entendendo a Página Inicial dos Logs**

    - **Cabeçalho**:

      - **Nome do Portfólio**: Exibido como 'Log DICOM'.

      - **Numérico**: Mostra o número total de registros disponíveis no
        log.

      - **Ícone de Busca**: Use para digitar o nome do paciente e
        acessar vários tipos de informações, como Informações Gerais,
        Informações de Seguro, Atividade e Histórico de Estudos.

      - **Menu Suspenso "Todos"**: Permite filtrar buscas por
        categorias como Estudo, Consulta DICOM, Paciente, Organização, Usuário
        e Ajuda.

3.  **Usando o Painel de Menu**

    - **Operações de Coluna**:

      - **Buscar e Filtrar Registros**: Aplique filtros com base em qualquer coluna
        através dos filtros de busca.

      - **Ordenação de Registros**: Ordene os registros em ordem crescente ou
        decrescente clicando na seta suspensa associada a qualquer coluna e selecionando a opção de ordenação desejada.

    - **Reorganizar Colunas**: Arraste as colunas para reorganizar sua ordem na
      grade. Observe que o Indicador de Status e a coluna Status não podem ser
      movidos.

4.  **Recursos da Guia de Menu**

    - **Ativo**: Indica se o DICOM está ativo e inclui
      botões de Repetir/Cancelar para DICOMs sendo enviados (não aplicável para estudos recebidos).

      - **Repetir**: Clique para tentar novamente uma transmissão com falha, alterando o
        status do DICOM para 'Em Progresso'.

      - **Cancelar**: Clique para cancelar uma transmissão, alterando o status do DICOM
        para 'Cancelado'.

    - **Status**: Exibe o status atual da tarefa com opções
      para filtrar registros por múltiplos campos de status.

    - **Prioridade e Outras Colunas**: Colunas adicionais como
      Prioridade, Nº de Objetos, Início da Tarefa, Fim da Tarefa e Duração
      fornecem informações detalhadas sobre os detalhes do DICOM.

    - **Detalhes do Paciente e do Estudo**: Colunas como ID do Paciente, Nome do Paciente,
      Organização Gerenciadora e outras oferecem detalhes sobre o
      paciente e o estudo associado ao respectivo DICOM.

5.  **Monitorando Detalhes do DICOM**

    - Visualize informações detalhadas para cada DICOM, incluindo horários de início e
      fim, duração, partes envolvidas (como o paciente e
      a organização gerenciadora) e o propósito da tarefa (Motivo do Estudo).

### Passos para Personalizar as Configurações do Log DICOM

1.  **Acessando as Configurações do Log DICOM**

    - Navegue até a página do Log DICOM clicando no ícone de Logs na
      barra de navegação lateral esquerda da página inicial do OmegaAI e selecione Logs DICOM se não estiver já exibido.

    - Clique no ícone azul do seletor DICOM, depois selecione **Configurações** para abrir
      o painel de Configurações do Log DICOM.

2.  **Personalizando Colunas**

    - **Adicionando Colunas**:  

      - Clique no ícone de Adicionar para inserir colunas vazias na grade do Log DICOM.

      - Clique nas colunas vazias e selecione a coluna desejada na
        lista suspensa que aparece. Isso permite incluir
        campos de informações adicionais relevantes para suas tarefas.

    - **Limpando Valores de Coluna**:

      - Para remover dados específicos de uma coluna mantendo a coluna
        visível, clique no ícone Limpar (X) associado àquela coluna.

    - **Excluindo Colunas**:

      - Se uma coluna não for mais necessária, clique no ícone de Excluir associado
        à coluna para removê-la totalmente da grade.

3.  **Aplicando Filtros**

    - Clique no botão "Filtros" para alternar para a seção de Filtros. Insira detalhes nos seguintes campos: **Accession #**, **Study UID**, **Patient ID** e **Patient Name**.

### Verificando o Log DICOM

Você pode verificar ou monitorar o Log DICOM observando os valores na grade do Log DICOM. A tabela a seguir lista as diferentes colunas e suas
descrições.

<table>
   <thead>
        <tr class="header">
            <th>Coluna</th>
            <th>Descrição</th>
        </tr>
    </thead>
    <tbody>
        <tr class="odd">
            <td><strong>Indicador de Status</strong></td>
            <td>
                <ul>
                    <li>
                        <p>O ícone de marca verde indica que o status é 'Concluído',
                            o que significa que a tarefa foi finalizada.</p>
                    </li>
                    <li>
                        <p>O círculo verde indica que o status é 'Em Progresso',
                            o que significa que o estudo está sendo transferido no momento.</p>
                    </li>
                    <li>
                        <p>O círculo vermelho indica que o status é 'Cancelado', o que
                            significa que a tarefa foi cancelada.</p>
                    </li>
                </ul>
                <blockquote>
                    <p>Nota: No Omega AI, você não pode cancelar nenhuma operação de recebimento. Somente o
                        remetente pode cancelar sua operação.</p>
                </blockquote>
                <ul>
                    <li>
                        <p>O círculo cinza indica que o status é 'Pronto', o que significa
                            que o estudo está pronto para transferência.</p>
                    </li>
                </ul>
                <blockquote>
                    <p>Está em fila e será enviado assim que as linhas de comunicação estiverem
                        livres ou quando chegar o horário agendado.</p>
                </blockquote>
                <ul>
                    <li>
                        <p>O ícone amarelo '||' indica que o status está 'Em
                            Espera'.</p>
                    </li>
                    <li>
                        <p>O ponto de exclamação vermelho indica que o status é
                            'Falhou'.</p>
                    </li>
                </ul>
            </td>
        </tr>
        <tr class="even">
            <td><strong>Status</strong></td>
            <td>
                <ul>
                    <li>
                        <p>Por padrão, exibe todos os status dos estudos que são
                            enviados ou recebidos.</p>
                    </li>
                    <li>
                        <p>Operações de recebimento têm apenas dois status, Em Progresso ou Concluído.</p>
                    </li>
                    <li>
                        <p>Você pode escolher múltiplos campos neste filtro para buscar
                            registros.</p>
                    </li>
                </ul>
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Motivo</strong></td>
            <td>
                <p>Fornece mais informações sobre o status atual da tarefa.
                    Nota: Para objetos recebidos, o motivo é sempre DICOMReceive.</p>
            </td>
        </tr>
        <tr class="even">
            <td><strong>Prioridade</strong></td>
            <td>
                <p>Os estudos são ordenados por prioridade e, em seguida, por ordem de chegada (FIFO) se os valores de prioridade forem idênticos.</p>
                <p>As opções de prioridade são ordenadas na seguinte ordem (da mais alta para a mais baixa):</p>
                <ol type="1">
                    <li><p><strong>STAT</strong></p></li>
                    <li><p><strong>ASAP</strong></p></li>
                    <li><p><strong>Urgente</strong></p></li>
                    <li><p><strong>Rotina</strong></p></li>
                </ol>
                <p>Se você tiver privilégios de edição, pode alterar a prioridade dos estudos. No entanto, só é possível <em>apenas</em> para estudos que estão sendo enviados.</p>
                Nota: Para operações de recebimento, a prioridade não pode ser alterada, ela é sempre
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Número de Objetos</strong></td>
            <td>Número de objetos enviados e recebidos.</td>
        </tr>
        <tr class="even">
            <td><strong>Início da Tarefa</strong></td>
            <td>
                <ul>
                    <li>
                        <p>Este campo é um seletor de intervalo de datas. Você pode usá-lo para filtrar estudos com base em uma determinada data de início.</p>
                    </li>
                    <li>
                        <p>Exibe registros de data e hora, se</p>
                        <ul>
                            <li><p>Uma tarefa é iniciada e concluída.</p></li>
                            <li><p>Uma tarefa é iniciada e colocada em espera.</p></li>
                            <li><p>Uma tarefa é iniciada, colocada em espera e retomada.</p></li>
                        </ul>
                    </li>
                </ul>
                <blockquote>
                    <p>Nesse caso, o horário de início da tarefa é o momento em que a tarefa
                        foi retomada.</p>
                </blockquote>
                <ul>
                    <li><p>O primeiro objeto em uma operação de recebimento é recebido.</p></li>
                </ul>
                <ul>
                    <li>
                        <p>Este campo fica em branco, se:</p>
                        <ul>
                            <li><p>Uma tarefa está pendente e não foi iniciada.</p></li>
                            <li><p>Uma tarefa está em espera e não foi iniciada.</p></li>
                        </ul>
                    </li>
                    <li><p>O horário é preciso até os segundos.</p></li>
                </ul>
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Fim da Tarefa</strong></td>
            <td>
                <ul>
                    <li>
                        <p>Este campo é um seletor de intervalo de datas. Você pode usá-lo para filtrar
                            estudos com base em uma determinada data de término.</p>
                    </li>
                    <li>
                        <p>Exibe registros de data e hora, se</p>
                        <ul>
                            <li><p>Uma tarefa é iniciada e concluída.</p></li>
                            <li><p>Uma tarefa é iniciada, colocada em espera, retomada e então
                                    concluída.</p></li>
                        </ul>
                    </li>
                </ul>
                <blockquote>
                    <p>Nesse caso, o horário de término da tarefa é o momento em que a tarefa
                        foi concluída.</p>
                </blockquote>
                <ul>
                    <li><p>Em uma operação de recebimento, nenhum objeto adicional é recebido por 30
                            segundos. Após 30 segundos, a tarefa é marcada como
                            <em>Concluída</em>.</p></li>
                </ul>
                <ul>
                    <li>
                        <p>Este campo fica em branco, se:</p>
                        <ul>
                            <li><p>Uma tarefa está pendente e não foi iniciada.</p></li>
                            <li><p>Uma tarefa está em espera e não foi iniciada.</p></li>
                            <li><p>Uma tarefa é iniciada e colocada em espera.</p></li>
                        </ul>
                    </li>
                    <li><p>O horário é preciso até os segundos.</p></li>
                </ul>
            </td>
        </tr>
        <tr class="even">
            <td><strong>Duração</strong></td>
            <td>
                <p>Duração total desde o início da tarefa até o momento de sua conclusão.</p>
                <p>Para operações de recebimento, é calculada somente após a tarefa ser
                    concluída. Até a conclusão da tarefa, o campo fica vazio.</p>
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Barra de Progresso</strong></td>
            <td>
                <p>Mostra o progresso da operação enviada.</p>
                <p>Para operações de recebimento, o status dos objetos recebidos é
                    0% até ser concluído, após o que é atualizado para 100%. Isso ocorre
                    porque não é possível determinar quantos objetos estão sendo recebidos no
                    sistema,</p>
            </td>
        </tr>
        <tr class="even">
            <td><strong>ID do Paciente</strong></td>
            <td>ID do paciente associado ao estudo.</td>
        </tr>
        <tr class="odd">
            <td><strong>Nome do Paciente</strong></td>
            <td>Nome do paciente associado ao estudo.</td>
        </tr>
        <tr class="even">
            <td><strong>Organização Gerenciadora</strong></td>
            <td>Exibe a Organização Gerenciadora do registro.</td>
        </tr>
        <tr class="odd">
            <td><strong>Nome do Serviço</strong></td>
            <td>
                <p>Para operações de envio, é o nome do dispositivo que executa a
                    tarefa.</p>
                <p>Para operações de recebimento, é o nome do DICOM Web ou do dispositivo OmegaAI
                    Link.</p>
            </td>
        </tr>
        <tr class="even">
            <td><strong>Barra de Progresso</strong></td>
            <td>Mostra o progresso do estudo que foi enviado.</td>
        </tr>
        <tr class="odd">
            <td><strong>Organização de Imagem</strong></td>
            <td>Exibe a Organização de Imagem do registro.</td>
        </tr>
        <tr class="even">
            <td><strong>Número de Falhas</strong></td>
            <td>O número total de tentativas com falha para a tarefa.</td>
        </tr>
        <tr class="odd">
            <td><strong>Motivo do Status</strong></td>
            <td>Uma descrição ou código indicando por que esta tarefa precisa ser
                executada.</td>
        </tr>
        <tr class="even">
            <td><strong>Destino</strong></td>
            <td>O dispositivo de destino.</td>
        </tr>
        <tr class="odd">
            <td><strong>Host Par</strong></td>
            <td>O nome da estação remota.</td>
        </tr>
        <tr class="even">
            <td><strong>Emissor</strong></td>
            <td>Exibe o Emissor associado ao paciente.</td>
        </tr>
        <tr class="odd">
            <td><strong>Data e Hora de Criação</strong></td>
            <td>Exibe a data e hora em que a tarefa foi criada.</td>
        </tr>
        <tr class="even">
            <td><strong>Solicitante</strong></td>
            <td>
                <ul>
                    <li><p>Nome do dispositivo que solicita o estudo.</p></li>
                    <li><p>Exibe o nome da Organização de Imagem ou Gerenciadora se for uma
                            regra de roteamento automático.</p></li>
                </ul>
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Número de Acesso</strong></td>
            <td>Número de acesso do estudo associado ao
                Pedido.</td>
        </tr>
        <tr class="even">
            <td><strong>Número da Visita</strong></td>
            <td>Número da visita associado ao estudo.</td>
        </tr>
        <tr class="odd">
            <td><strong>Data da Última Modificação</strong></td>
            <td>O horário em que o registro foi modificado, como pausado, colocado em espera,
                ou cancelado.</td>
        </tr>
        <tr class="even">
            <td><strong>Intenção</strong></td>
            <td>Mostra o quão acionável é a tarefa. Por exemplo, se a tarefa está
                planejada, proposta, etc.</td>
        </tr>
        <tr class="odd">
            <td><strong>Nota</strong></td>
            <td>A descrição do evento e erros, se houver.</td>
        </tr>
        <tr class="even">
            <td><strong>Data e Hora do Estudo</strong></td>
            <td>Data e hora do estudo.</td>
        </tr>
        <tr class="odd">
            <td><strong>Descrição do Estudo</strong></td>
            <td>Descrição do estudo.</td>
        </tr>
    </tbody>
</table>

## Acessando e Monitorando o Log Mirth no OmegaAI
Esta seção fornece instruções detalhadas sobre como acessar e monitorar
o log Mirth dentro do OmegaAI.

### Passos para Acessar e Monitorar Logs Mirth

1.  **Acessando Logs Mirth**

    - Abra a página inicial do OmegaAI.

    - Clique no ícone de Logs localizado na barra de navegação lateral esquerda para acessar
      a página de Logs DICOM, que aparece por padrão.

    - Clique no ícone azul do DICOM, uma lista de opções de logs aparecerá.

    - Clique em Mirth. O log Mirth será exibido.

2.  **Entendendo a Página Inicial do Mirth**

    - **Cabeçalho**:

      - **Nome do Portfólio**: Exibido como 'Mirth'.

      - **Numérico**: Mostra o número total de registros disponíveis no
        log.

      - **Ícone de Busca**: Use para digitar o nome do paciente e
        acessar vários tipos de informações, como Informações Gerais,
        Informações de Seguro, Atividade e Histórico de Estudos.

      - **Menu Suspenso "Todos"**: Permite filtrar buscas por
        categorias como Estudo, Consulta DICOM, Paciente, Organização, Usuário
        e Ajuda.

3.  **Usando o Painel de Menu**

    - **Operações de Coluna**:

      - **Buscar e Filtrar Registros**: Aplique filtros com base em qualquer coluna
        através dos filtros de busca.

      - **Ordenação de Registros**: Ordene os registros em ordem crescente ou
        decrescente clicando na seta suspensa associada a qualquer coluna e selecionando a opção de ordenação desejada.

    - **Reorganizar Colunas**: Arraste as colunas para reorganizar sua ordem na
      grade. Observe que o Indicador de Status e a coluna Status não podem ser
      movidos.

    **Nota**: Consulte a seção **Verificando o Log DICOM** para descrições adicionais de campos, pois a funcionalidade e os recursos são semelhantes.
    
4.  **Monitorando Detalhes do Mirth**

    - Visualize informações detalhadas para cada iniciativa do Mirth nas respectivas colunas: Status, Motivo do Status, Intenção, Descrição, Study Instance UID, Nome do Paciente, Solicitante, etc.

## Acessando e Monitorando o Log de E-mail no OmegaAI
Esta seção fornece instruções detalhadas sobre como acessar e monitorar
o log de E-mail dentro do OmegaAI.

### Passos para Acessar e Monitorar o Log de E-mail

1.  **Acessando o Log de E-mail**

    - Abra a página inicial do OmegaAI.

    - Clique no ícone de Logs localizado na barra de navegação lateral esquerda para acessar
      a página de Logs DICOM, que aparece por padrão.

    - Clique no ícone azul do DICOM, uma lista de opções de logs aparecerá.

    - Clique em E-mail. O log de E-mail será exibido.

2.  **Entendendo a Página Inicial do E-mail**

    - **Cabeçalho**:

      - **Nome do Portfólio**: Exibido como 'E-mail'.

      - **Numérico**: Mostra o número total de registros disponíveis no
        log.

      - **Ícone de Busca**: Use para digitar o nome do paciente e
        acessar vários tipos de informações, como Informações Gerais,
        Informações de Seguro, Atividade e Histórico de Estudos.

      - **Menu Suspenso "Todos"**: Permite filtrar buscas por
        categorias como Estudo, Consulta DICOM, Paciente, Organização, Usuário
        e Ajuda.

3.  **Usando o Painel de Menu**

    - **Operações de Coluna**:

      - **Buscar e Filtrar Registros**: Aplique filtros com base em qualquer coluna
        através dos filtros de busca.

      - **Ordenação de Registros**: Ordene os registros em ordem crescente ou
        decrescente clicando na seta suspensa associada a qualquer coluna e selecionando a opção de ordenação desejada.

    - **Reorganizar Colunas**: Arraste as colunas para reorganizar sua ordem na
      grade. Observe que o Indicador de Status e a coluna Status não podem ser
      movidos.

    **Nota**: Consulte a seção **Verificando o Log DICOM** para descrições adicionais de campos, pois a funcionalidade e os recursos são semelhantes.

4.  **Monitorando Detalhes do E-mail**

    - Visualize informações detalhadas para cada iniciativa de E-mail nas respectivas colunas: Status, Remetente, Destinatário, Gatilho, Mensagem, etc.

## Acessando e Monitorando o Log de SMS no OmegaAI
Esta seção fornece instruções detalhadas sobre como acessar e monitorar
o log de SMS dentro do OmegaAI.

### Passos para Acessar e Monitorar o Log de SMS

1.  **Acessando o Log de SMS**

    - Abra a página inicial do OmegaAI.

    - Clique no ícone de Logs localizado na barra de navegação lateral esquerda para acessar
      a página de Logs DICOM, que aparece por padrão.

    - Clique no ícone azul do DICOM, uma lista de opções de logs aparecerá.

    - Clique em SMS. O log de SMS será exibido.

2.  **Entendendo a Página Inicial do SMS**

    - **Cabeçalho**:

      - **Nome do Portfólio**: Exibido como 'SMS'.

      - **Numérico**: Mostra o número total de registros disponíveis no
        log.

      - **Ícone de Busca**: Use para digitar o nome do paciente e
        acessar vários tipos de informações, como Informações Gerais,
        Informações de Seguro, Atividade e Histórico de Estudos.

      - **Menu Suspenso "Todos"**: Permite filtrar buscas por
        categorias como Estudo, Consulta DICOM, Paciente, Organização, Usuário
        e Ajuda.

3.  **Usando o Painel de Menu**

    - **Operações de Coluna**:

      - **Buscar e Filtrar Registros**: Aplique filtros com base em qualquer coluna
        através dos filtros de busca.

      - **Ordenação de Registros**: Ordene os registros em ordem crescente ou
        decrescente clicando na seta suspensa associada a qualquer coluna e selecionando a opção de ordenação desejada.

    - **Reorganizar Colunas**: Arraste as colunas para reorganizar sua ordem na
      grade. Observe que o Indicador de Status e a coluna Status não podem ser
      movidos.

    **Nota**: Consulte a seção **Verificando o Log DICOM** para descrições adicionais de campos, pois a funcionalidade e os recursos são semelhantes.

4.  **Monitorando Detalhes do Log de SMS**

    - Visualize informações detalhadas para cada iniciativa de SMS nas respectivas colunas: Status, Remetente, Destinatário, Gatilho, Mensagem, etc.

## Acessando e Monitorando o Log de Notificação no OmegaAI
Esta seção fornece instruções detalhadas sobre como acessar e monitorar
o log de Notificação dentro do OmegaAI.

### Passos para Acessar e Monitorar o Log de Notificação

1.  **Acessando o Log de Notificação**

    - Abra a página inicial do OmegaAI.

    - Clique no ícone de Logs localizado na barra de navegação lateral esquerda para acessar
      a página de Logs DICOM, que aparece por padrão.

    - Clique no ícone azul do DICOM, uma lista de opções de logs aparecerá.

    - Clique em Notificação. O log de Notificação será exibido.

2.  **Entendendo a Página Inicial de Notificação**

    - **Cabeçalho**:

      - **Nome do Portfólio**: Exibido como 'Notificação'.

      - **Numérico**: Mostra o número total de registros disponíveis no
        log.

      - **Ícone de Busca**: Use para digitar o nome do paciente e
        acessar vários tipos de informações, como Informações Gerais,
        Informações de Seguro, Atividade e Histórico de Estudos.

      - **Menu Suspenso "Todos"**: Permite filtrar buscas por
        categorias como Estudo, Consulta DICOM, Paciente, Organização, Usuário
        e Ajuda.

3.  **Usando o Painel de Menu**

    - **Operações de Coluna**:

      - **Buscar e Filtrar Registros**: Aplique filtros com base em qualquer coluna
        através dos filtros de busca.

      - **Ordenação de Registros**: Ordene os registros em ordem crescente ou
        decrescente clicando na seta suspensa associada a qualquer coluna e selecionando a opção de ordenação desejada.

    - **Reorganizar Colunas**: Arraste as colunas para reorganizar sua ordem na
      grade. Observe que o Indicador de Status e a coluna Status não podem ser
      movidos.

    **Nota**: Consulte a seção **Verificando o Log DICOM** para descrições adicionais de campos, pois a funcionalidade e os recursos são semelhantes.

4.  **Monitorando Detalhes do Log de Notificação**

    - Visualize informações detalhadas para cada iniciativa de Notificação nas respectivas colunas: Status, Remetente, Destinatário, Gatilho, Mensagem, etc.

## Acessando e Monitorando os Logs de Auditoria no OmegaAI
Esta seção orienta os usuários sobre como acessar e monitorar os Logs de Auditoria dentro
do OmegaAI, detalhando os passos para navegar e configurar a interface do Log de Auditoria.
Os Logs de Auditoria registram todas as atividades realizadas pelo sistema e
usuários, fornecendo uma visão geral das ações com base em funções e
privilégios atribuídos.

### Passos para Acessar e Monitorar os Logs de Auditoria

1.  **Navegando até os Logs de Auditoria**

    - Comece na página inicial do OmegaAI.

    - Clique no ícone de Logs na barra de navegação lateral esquerda.

    - Por padrão, a página de Logs será aberta. Clique no
      ícone do seletor de Log de Tarefas e, em seguida, selecione Log de Auditoria para mudar para a página de Log de Auditoria.

2.  **Entendendo a Interface do Log de Auditoria**

    - **Recursos do Cabeçalho**:

      - **Nome do Portfólio**: Rotulado como **Log de Auditoria**.

      - **Numérico**: Exibe o número total de registros de auditoria presentes.

      - **Ícone de Busca**: Use para digitar o nome de um paciente ou qualquer
        termo relacionado para recuperar informações específicas, como
        Informações Gerais, Informações de Seguro, Atividade e Histórico de Estudos.

      - **Menu Suspenso "Todos"**: Este recurso oferece opções avançadas de filtragem
        por categorias como Estudo, Consulta DICOM, Paciente,
        Organização, Usuário e Ajuda.

3.  **Utilizando o Painel de Menu**

    - **Buscar e Filtrar Registros**: Você pode buscar registros ou aplicar
      filtros usando os filtros de busca com base em qualquer uma das colunas disponíveis.

    - **Ordenação de Registros**: Os registros podem ser ordenados em ordem crescente ou
      decrescente. Selecione a opção de ordenação desejada clicando
      na seta suspensa associada a qualquer coluna.

    - **Reorganizar Colunas**: Personalize o arranjo das colunas
      arrastando-as para o local preferido na grade. Nota:
      O Indicador de Status e a coluna Status são fixos e não podem ser
      movidos.

    **Nota**: Consulte a seção **Verificando o Log DICOM** para descrições adicionais de campos, pois a funcionalidade e os recursos são semelhantes.

4.  **Personalizando o Layout do Log de Auditoria**

    - Clique no ícone do seletor de Log de Auditoria e, em seguida, selecione **Configurações** para
      abrir o painel **Configurações do Log de Auditoria**.

    - **Opções de Personalização**:

      - **COLUNAS**:

        - Para adicionar colunas adicionais, clique no ícone de Adicionar. Colunas vazias
          aparecerão onde você pode selecionar a coluna desejada de uma
          lista exibida.

        - Para limpar o valor de uma coluna, selecione a coluna e clique no
          botão Cancelar.

        - Para excluir uma coluna, clique no ícone de Excluir associado àquela
          coluna.

      - **FILTROS**:

        - Adicione filtros ou critérios de busca para refinar os dados exibidos no
          Log de Auditoria.

      - **ORDENAR**:

        - Selecione as colunas pelas quais deseja ordenar e clique em **Salvar** para
          aplicar as configurações ou **Cancelar** para descartar quaisquer alterações.

          

## Acessando e Monitorando o Histórico de Atividades no OmegaAI
Esta seção fornece instruções sobre como acessar e monitorar a
página de Histórico de Atividades dentro do OmegaAI, que exibe um registro de todas
as atividades que você realizou. Detalha a navegação, uso das funcionalidades de busca
e opções de personalização para adaptar a visualização do Histórico de Atividades às preferências do usuário.

### Passos para Acessar e Monitorar o Histórico de Atividades

1.  **Acessando o Histórico de Atividades**

    - Abra a página inicial do OmegaAI.

    - Clique em 'Logs' na barra de navegação lateral esquerda para abrir a página padrão
      de Log de Tarefas.

    - Clique no ícone do seletor de Logs e selecione 'Histórico de Atividades' para
      mudar para a página de Histórico de Atividades.

2.  **Navegando pela Página do Histórico de Atividades**

    - **Recursos do Cabeçalho**:

      - **Nome do Portfólio**: Listado como 'Histórico de Atividades'.

      - **Numérico**: Indica o número total de registros de atividades
        presentes.

      - **Ícone de Busca**: Utiliza a barra de busca global para realizar
        buscas em várias categorias. Digite critérios de busca na
        caixa de texto para recuperar informações específicas sobre um paciente,
        incluindo Informações Gerais, Informações de Seguro, Atividade
        e Histórico de Estudos.

      - **Menu Suspenso "Todos"**: Este menu permite amplas capacidades de filtragem
        por categorias como Estudo, Consulta DICOM, Paciente,
        Organização, Usuário e Ajuda.

3.  **Usando o Painel de Menu**

    - **Funções de Coluna**:

      - **Buscar e Filtrar Registros**: Aplique filtros ou busque
        registros usando os filtros de busca com base em qualquer uma das colunas.

      - **Ordenação de Registros**: Ordene os registros em ordem crescente ou decrescente
        selecionando a opção desejada na seta suspensa
        associada a qualquer coluna.

      - **Reorganizar Colunas**: Ajuste o layout arrastando as colunas para
        as posições desejadas na grade. Observe que o Indicador de Status
        e a coluna Status não podem ser movidos.

4.  **Personalizando o Layout do Histórico de Atividades**

    - Clique no ícone do seletor de Log de Histórico de Atividades e, em seguida, selecione
      "Configurações".

    - **Opções de Personalização**:

      - **COLUNAS**:

        - Adicione colunas adicionais clicando no ícone de Adicionar. Selecione a
          coluna desejada em uma lista que aparece nos espaços de coluna vazios.

        - Limpe o valor de uma coluna selecionando a coluna e clicando no
          botão Cancelar.

        - Exclua uma coluna clicando no ícone de Excluir associado àquela
          coluna.

      - **FILTROS**:

        - Adicione filtros ou critérios de busca a qualquer coluna para refinar a exibição
          dos registros.

      - **ORDENAR**:

        - Selecione as colunas pelas quais deseja ordenar o log de Histórico de Atividades e
          clique em **Salvar** para aplicar ou **Cancelar** para descartar as alterações.

