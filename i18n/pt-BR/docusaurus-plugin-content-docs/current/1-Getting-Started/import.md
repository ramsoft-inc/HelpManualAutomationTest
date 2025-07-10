---
sidebar_position: 13
title: Importar & Novo Pedido
tags:
  - Importação
  - Arquivos DICOM
  - Arquivos Não-DICOM
  - Upload de Arquivos
  - Arrastar e Soltar
  - Detalhes da Importação
  - Organização Gerenciadora
  - Status do Estudo
  - Log de Erros
  - Repetir Falha
  - Importação
  - Novo Paciente
  - Novo Pedido
  - Registro de Paciente
  - Campos Obrigatórios
  - Informações de Seguro
  - Novo Paciente
  - Novo Pedido
  - Registro de Paciente
  - Campos Obrigatórios
  - Informações de Seguro
---

# Importar & Novo Pedido

## Importação
Este guia explica como importar arquivos DICOM e não-DICOM para o sistema OmegaAI usando a interface web. Detalha os passos para iniciar uma importação, manipular arquivos, gerenciar configurações de importação e monitorar o processo de importação. Esta funcionalidade suporta vários tipos de arquivos e oferece opções para gerenciar o status da importação de arquivos e o tratamento de erros.

### Importando Estudos

1.  **Acessar a Função de Importação**

    - Navegue até a barra lateral esquerda e clique no ícone **+** (mais).

    - Selecione **Importar** no menu que aparecer.

      

2.  **Fazendo Upload de Arquivos**

    - Você pode arrastar e soltar arquivos diretamente na interface ou clicar em **Procurar Arquivos** para selecionar arquivos do seu gerenciador de arquivos.

    - Os tipos de arquivos suportados incluem:

      - Objetos DICOM

      - JPEG 

      - PDF 

      - MP4

      - PNG

3.  **Gerenciando Detalhes da Importação**

    - Após selecionar ou arrastar os arquivos, uma gaveta de **Detalhes da Importação** aparecerá à direita.

    - **Campo Obrigatório:** **Organização Gerenciadora** deve ser especificada para definir a organização de imagem.

    - **Detalhes do Estudo:** Para arquivos não-DICOM, insira o nome do estudo no campo **Estudo**.

    - **Status do Estudo:** Opcionalmente, selecione um status no menu suspenso **Status do Estudo**. Se não definido, o estudo importado terá status **Vazio**.

4.  **Iniciando o Processo de Importação**

    - Revise a lista de arquivos prontos para importação, cada um anotado com o tipo de arquivo detectado.

    - Para iniciar a importação, clique em **Iniciar**.

    - Para cancelar todas as operações, clique em **Cancelar**.

    - Arquivos individuais podem ser removidos passando o mouse sobre a entrada do arquivo, clicando e segurando na opção **Excluir**.

5.  **Monitorando e Gerenciando o Progresso da Importação**

    - Importações bem-sucedidas exibirão uma mensagem de sucesso.

    - Importações com falha mostrarão uma mensagem de falha. Clique em **Log de Erros** para ver detalhes ou em **Repetir Falha** para tentar importar novamente os itens que falharam.

    - Importações simultâneas são possíveis repetindo os passos de importação.

6.  **Tratando Tipos de Arquivos Especiais**

    - Ao importar arquivos DICOM com objetos SR contendo medições, não defina um estudo se quiser exibir as medições no visualizador de imagens. Definir um estudo específico irá converter objetos SR em um documento PDF adicionado aos documentos do estudo.

7.  **Revisando o Progresso da Importação**

    - Navegue até **Logs de Tarefas**.

    - Filtre a coluna **Motivo do Status** para verificar o status das importações.

## Criando um Novo Pedido
O objetivo de criar um novo pedido é criar um ou mais estudos para pacientes existentes ou novos. Além disso, novos pacientes também podem ser criados pela tela de Novo Pedido. Observe que você deve ter os privilégios necessários para realizar essas tarefas. Esta seção explica o processo passo a passo para adicionar um novo pedido no software OmegaAI, incluindo a definição da organização de imagem, anexação de faxes, definição da prioridade do pedido e seleção de detalhes do paciente e do médico. Siga estas instruções detalhadas para criar eficientemente um novo pedido de imagem médica.

### Como Adicionar um Novo Pedido

1.  **Acesse a Tela de Novo Pedido:**

    - Clique no **Ícone de Mais (+)** localizado na barra de navegação à esquerda para acessar a tela de Novo Pedido.

      

2.  **Defina a Organização de Imagem:**

    - Certifique-se de que a **Organização de Imagem** está definida corretamente. Esta configuração é padrão para a organização selecionada durante a última criação de pedido.

3.  **Revise e Anexe Faxes Recebidos (Se disponível):**

    - Se você possui **Integração com Fast Fax**, uma lista de faxes recentes será exibida.

    - Clique em um fax para revisá-lo. Para anexá-lo ao pedido, certifique-se de que está selecionado (indicado por uma marca de seleção ou pelo número do fax).

4.  **Defina a Prioridade do Pedido:**

    - Por padrão, a prioridade é definida como **Rotina**. Altere para **Urgente**, **ASAP** ou **Emergência** se necessário para o seu fluxo de trabalho específico.

5.  **Insira as Informações do Paciente:**

    - Pesquise o paciente pelo **Nome**, **Número de Telefone** ou **Data de Nascimento**.

    - Os resultados da pesquisa exibirão detalhes relevantes do paciente junto com a organização sob a qual o registro do paciente foi criado.

6.  **Selecione o Médico Solicitante:**

    - Insira as informações do médico solicitante no campo fornecido se o pedido foi encaminhado para você.

    - O campo **Visão de Encaminhamento** será preenchido automaticamente com base no médico solicitante selecionado. Este campo mostra a organização de encaminhamento e se ajusta se o médico estiver vinculado a várias organizações.

7.  **Adicione um Médico Consultor (Opcional):**

    - Para dar acesso ao estudo a outro médico, pesquise e adicione-o na seção **Médico Consultor**.

8.  **Anexe Conjuntos de Estudos:**

    - Vincule o pedido a códigos de procedimento específicos pesquisando e selecionando os conjuntos de estudos apropriados. O topo de cada lista indicará a organização à qual os conjuntos de estudos pertencem, permitindo a seleção correta se houver várias opções disponíveis.

9.  **Adicione Notas ao Pedido:**

    - Utilize a seção **Notas** para adicionar quaisquer detalhes relevantes ou instruções especiais relacionadas ao pedido.

10. **Finalize o Pedido:**

    - Clique em **Criar** para finalizar e criar o pedido, ou clique em **Cancelar** se precisar abandonar o processo de criação do pedido.

## Criando um Novo Paciente no OmegaAI

Este guia fornece instruções detalhadas sobre como criar um novo registro de paciente no OmegaAI. Um novo paciente só pode ser adicionado através da tela de Novo Pedido. Os usuários devem ter os privilégios apropriados para criar registros de pacientes.

**Nota**: Este processo é restrito a pacientes associados à Organização Master à qual o usuário pertence.

### Acessando a Página de Novo Pedido

- **Localização**: Menu principal de navegação do OmegaAI.

- **Passos**:

  1.  Clique no ícone **+** e selecione Novo Pedido. Esta ação irá levá-lo à página de Novo Pedido.

      

### Iniciando a Criação de Novo Paciente

- **Localização**: Página de Novo Pedido.

- **Passos**:

  1.  Localize o campo **Paciente** e clique no ícone **+** ao lado dele.

  2.  A página de Novo Paciente aparecerá.

### Inserindo Detalhes do Paciente

- **Campos Obrigatórios**:

  - **Nome e Sobrenome**: Insira o nome completo do paciente.

  - **Sexo**: Selecione o sexo do paciente.

- **Campos Opcionais**:

  - **E-mail**: Insira o endereço de e-mail do paciente.

  - **Número de Telefone**: Forneça um número de contato.

  - **Número do Seguro Social (SSN)**: Insira se disponível.

  - **Data de Nascimento**: Especifique a data de nascimento do paciente.

  - **Endereço**: Use o recurso de busca de endereço para preencher automaticamente este campo ou insira manualmente o endereço do paciente.

- **Informações Adicionais**:

  - **Organização Gerenciadora**: Especifique se for diferente do padrão.

  - **Cortesia Especial**: Indique quaisquer cortesias especiais aplicáveis ao paciente.

    

### Adicionando Informações de Elegibilidade e Seguro

- **Localização**: Segunda aba na página de Novo Paciente, rotulada como **Elegibilidade e Seguro**.

- **Passos**:

  1.  Insira o status de emprego do paciente e detalhes do empregador.

  2.  Adicione informações de seguro especificando um ou mais pagadores de seguro.

### Salvando ou Descartando o Registro de Novo Paciente

- **Para Salvar**: Clique em Criar na barra de navegação superior para salvar o novo registro de paciente e sair.

- **Para Cancelar**: Clique em Cancelar para descartar quaisquer alterações e sair do processo de criação de Novo Paciente.

### Notas de Uso

- Certifique-se de que todos os campos obrigatórios estejam preenchidos para evitar erros durante o processo de criação.

- Verifique a precisão de todas as informações inseridas, especialmente dados sensíveis como SSN e data de nascimento.

- Utilize a funcionalidade de busca de endereço para garantir a precisão do endereço e economizar tempo.

