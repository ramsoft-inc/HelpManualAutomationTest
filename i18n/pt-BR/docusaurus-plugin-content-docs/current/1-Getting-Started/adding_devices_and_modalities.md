---
sidebar_position: 5
title: Adicionando Dispositivos & Modalidades (Estações DICOM)
---

# Configuração de Dispositivos

Esta seção da configuração da sua organização permite visualizar uma lista de proxies DICOM Web e DICOM conectados à organização. Adicionar um novo dispositivo é um processo simples de dois passos: primeiro, adicione o próprio dispositivo e, em seguida, adicione uma estação DICOM para vinculá-lo ao OmegaAI.

Esse processo envolve a configuração de um roteador virtual através do OmegaAI-LINK, que atua como um roteador turbinado para imagens médicas e conecta dispositivos e clínicas de forma transparente. Não há taxas extras, independentemente de você ter um ou dez locais. O LINK garante um fluxo ininterrupto de estudos, mesmo se uma máquina for desligada, devido ao seu recurso de fila de failover. Além disso, oferece cache para acesso rápido às imagens.

A instalação é simples, levando aproximadamente 60 minutos do download à instalação. Você pode baixá-lo como um arquivo executável. O suporte da RamSoft está disponível caso precise de assistência.

É fundamental garantir que o LINK esteja na mesma rede que seus dispositivos ou de onde as imagens vêm, seja sua modalidade ou uma instalação externa. Uma vez configurado, o LINK roteia as imagens de forma eficiente, permitindo comunicação transparente entre os equipamentos médicos e a plataforma OmegaAI.

## Adicionando um Novo Dispositivo e Enviando um OmegaAI-LINK

1.  Na página de detalhes da sua organização, selecione **Dispositivo**. A página de dispositivos será aberta.

    

2.  Os detalhes são os seguintes:

- **Tipo de Dispositivo**: Por padrão, o tipo de dispositivo é OmegaAI-LINK. Este campo não pode ser modificado.

- **Nome:** Um nome padrão será fornecido, mas você tem a opção de criar um nome exclusivo para sua estação de trabalho.

- **AE Title:** Serve como um identificador distinto, comparável ao endereço do seu Mac ou Windows, ou até mesmo semelhante a um nome de rua ou número de casa. É atribuído especificamente aos dispositivos DICOM para identificação na rede.

- **Número da Porta:** Pontos de entrada específicos para dados nos dispositivos, permitindo que eles troquem informações de imagens de forma eficiente. Normalmente<u>,</u> 105 para OmegaAI e 104 para PowerServer.


  

3.  Selecione Download na parte inferior da página para baixar o arquivo de instalação. Se precisar enviar o arquivo de instalação do OmegaAI-LINK para alguém, envie o arquivo zip com proteção por senha ou via OneDrive ou SharePoint da empresa, para garantir a segurança.

**Nota**: Você tem 60 minutos para instalar o link de instalação.

## Adicionando Estação DICOM

1.  Assim que um dispositivo for criado, o painel será aberto ao lado da lista de dispositivos. Selecione **+** no painel.

2.  Realize o seguinte na seção Geral:

- **Estações DICOM**: Insira o nome da estação DICOM que deseja adicionar.

- **AE Title** (campo obrigatório): Insira o título da Application Entity (AE).

- **Endereço IP/Nome do Host**: Insira o endereço IP da estação que será usada para comunicação DICOM. Se o endereço IP for dinâmico, insira o nome da máquina.

- **Porta** (obrigatório para envio DICOM e opcional para recebimento): Insira o número da porta da estação que será usada para comunicação DICOM.

- **Habilitar TLS**: Esta caixa de seleção é marcada para criptografar a comunicação DICOM.

- **É Servidor de Arquivo**: Marque esta caixa se for um servidor de arquivo.

- **Necessita de Notificação IOCM**: Marque esta opção se for necessário notificação de Gerenciamento de Alteração de Objeto de Imagem (IOCM).

- **Descrição da Estação DICOM**: Insira uma descrição da estação DICOM.

- **Exportar**: Clique para exportar a configuração da estação DICOM para o formato JSON. A configuração exportada pode então ser atualizada ou editada.

- **Importar**: Após modificar os detalhes da configuração, clique em Importar para fazer o upload.

- **Ativo**: Clique em Ativo para definir a estação DICOM como ativa.

- **Habilitar Heartbeat**: Selecione este botão para habilitar o heartbeat.

- **Conjunto de Caracteres**: Selecione um conjunto de caracteres preferido no menu suspenso. O conjunto de caracteres está associado à estação para processar solicitações DICOM recebidas.

- **Testar Conexão**: Após preencher todos os detalhes da estação DICOM, clique neste botão para testar a conexão.

- **Status**: Este campo é preenchido automaticamente. Indica o status da estação DICOM com base no heartbeat. Dependendo do status, este campo exibe os seguintes valores:

  1.  **Ativo**: Indica que a estação DICOM está ativa. Se o heartbeat DICOM estiver habilitado e a estação estiver ativa e respondendo aos pings, então o status da estação aparece como Online e um indicador verde é exibido.

  2.  **Desconhecido**: Indica que a estação DICOM é desconhecida. Se o heartbeat DICOM estiver habilitado e a estação estiver ativa e respondendo aos pings, então o status da estação aparece como Online e um indicador verde é exibido.

  3.  **Offline**: Indica que a estação DICOM está offline. Se a estação DICOM estiver offline, o sistema não tentará realizar o envio DICOM ativamente. Se o heartbeat DICOM estiver habilitado e a estação estiver ativa e respondendo aos pings, então o status da estação aparece como Online e um indicador verde é exibido.

3.  Selecione as seguintes opções na seção de recursos das Estações DICOM, conforme necessário:

    - **Habilitar Heartbeat:** Selecione este botão para habilitar o heartbeat.

    - **Enviar para estações DICOM do dispositivo:** Marque esta caixa para permitir que o OmegaAI envie estudos para a estação DICOM.

    - **Consulta/Recuperação:** Marque esta caixa para permitir que a estação DICOM atenda consultas DICOM ou recupere estudos.

    - **Enviar ID do Paciente Original e Emissor:** Marque esta caixa para preservar e enviar o ID do Paciente original e o Emissor do campo ID do Paciente DICOM.

      **Nota**: Isso se refere à informação que foi recebida originalmente.

## Testando a Conexão do OmegaAI LINK

Selecione Testar Conexão, uma atualização de status aparecerá no canto inferior esquerdo da tela da sua plataforma OmegaAI indicando os resultados.



No exemplo acima, a conexão falhou. Como administrador, você precisa garantir que tanto o OmegaAI-LINK quanto o dispositivo estejam online ao mesmo tempo para que a conexão seja bem-sucedida.

**Nota**: Se a conexão falhar mesmo quando ambos, OmegaAI-LINK e o dispositivo, estiverem online, o ideal é entrar em contato com o departamento de TI local, pois provavelmente é um problema de rede. Certifique-se de verificar se você possui o endereço IP, AE title e número da porta corretos, e garanta que o outro lado esteja configurado para aceitar o AE title vinculado.