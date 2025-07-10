---
sidebar_position: 1
title: O que é o OAI Link?
---

# O que é o OAI Link?

OmegaAI Link é o dispositivo Daemon que roda como um serviço em uma máquina dedicada, enviando e recebendo imagens de estações DICOM tradicionais que não suportam DICOM web.

**Nota**: O código para download do Instalador do Link está escrito na API de Autenticação.

## Requisitos de Hardware do Link

O OmegaAI Link requer o seguinte hardware para funcionar conforme o esperado.

<table>
    <thead>
        <tr class="header">
            <th><strong>Sistema Operacional</strong></th>
            <th><strong>Mínimo</strong></th>
            <th><strong>Recomendado</strong></th>
        </tr>
    </thead>
    <tbody>
        <tr class="odd">
            <td><strong>SO</strong></td>
            <td>Microsoft Windows 10 ou 11 (64 Bits)</td>
            <td>Microsoft Server 2016 ou mais recente (64 Bits) Edição Standard ou Datacenter</td>
        </tr>
        <tr class="even">
            <td><strong>CPU</strong></td>
            <td>4 núcleos</td>
            <td>i7 ou superior</td>
        </tr>
        <tr class="odd">
            <td><strong>RAM</strong></td>
            <td>16 GB</td>
            <td>16 GB</td>
        </tr>
        <tr class="even">
            <td><strong>Drives</strong></td>
            <td>
                <p>SO & Aplicação 100 GB</p>
                <p>Cache 500 GB</p>
            </td>
            <td>1 TB recomendado (SSD ou IOPS equivalente)</td>
        </tr>
        <tr class="odd">
            <td><strong>LAN</strong></td>
            <td>1 Gbps com IP Estático e registro DNS apropriado</td>
            <td>1 Gbps com IP Estático e registro DNS apropriado</td>
        </tr>
    </tbody>
</table>

**Recursos de Sistema Dedicados**:

Qualquer servidor ou computador utilizado para o RamSoft OmegaAI Link deve ser reservado exclusivamente para rodar a solução. Instalar outros softwares ou utilizar o recurso para outros fins pode causar impactos imprevistos, caso em que a RamSoft não pode garantir a funcionalidade ideal.

## Como Instalar o OmegaAI Link

O instalador do OmegaAI Link pode ser baixado na tela da organização gerenciadora. Essa ação só pode ser realizada pelo usuário que possui privilégio em nome da respectiva organização.

**Siga os passos abaixo para baixar o OmegaAI Link**

1.  Faça login no OmegaAI.

2.  Navegue até a tela da Organização gerenciadora clicando em Organização na barra de navegação à esquerda.

3.  Vá até a aba de dispositivos.

    

4.  Para adicionar um novo dispositivo, clique no ícone + (mais detalhes na seção, **Como Gerenciar Dispositivos em Correlação com o OAI Link**).

    

5.  Insira o Nome do Dispositivo, AE Title, Endereço IP/Hostname e número da porta. (ex.: qa-rispacs, qa-rispacs, qa-rispacs, 104 para Ramsoft Powerserver 6.0).

6.  Clique no botão **Download**.

**Nota**: o link tem expiração definida de 60 minutos.

7.  Execute o EXE baixado como administrador.

8.  O processo de instalação do OmegaAI Link será iniciado conforme mostrado abaixo.

    

9.  Após o login bem-sucedido, você verá o nome do dispositivo na aba de dispositivos da organização gerenciadora.

10. Sempre que houver uma nova versão do OmegaAI Link disponível, o OmegaAI atualiza automaticamente para a nova versão (ou seja, não é necessária intervenção manual).

O diagrama abaixo detalha ainda mais o processo de instalação do OmegaAI Link.

**Nota**: Caso ocorram erros, verifique os logs no diretório "C:\OmegaAILink".

Se não conseguir instalar, verifique se o serviço existe ou não. Se o serviço existir, talvez seja necessário deletar o Serviço OmegaAI Link e seguir o processo de desinstalação (encontrado em **Como Desinstalar o OAI Link**).

## Como Desinstalar o OAI Link

Para desinstalar o OmegaAI Link, siga os passos abaixo:

- Excluir Serviço

- sc.exe stop RamSoft OmegaAI Link Service

- sc.exe delete RamSoft OmegaAI Link Service

>

- Excluir Pasta de Instalação

- Está localizada em C:\Program Files\RamSoft.OmegaAILink

## Cache do OAI Link

O OmegaAI Link será utilizado para fins de cache para maior eficiência no processo geral. Como buscar dados do servidor toda vez é um processo caro e demorado, o OAI Link agora será usado para torná-lo um servidor web leve e armazenar os dados de pixel enquanto os recebemos.

**Como o link local é identificado?**

O endereço IP é usado para verificar o link. Para garantir ainda mais, o IP público é utilizado para identificar os Links locais, já que todos os links devem ter o mesmo endereço IP público.

**Como os dados de pixel são armazenados no disco local?**

Para garantir que os dados PHI estejam seguros o tempo todo, antes de armazenar os dados locais no cache, eles passarão por codificação.

**Nota**: O algoritmo AESGCM é usado para codificar os dados de pixel.

**Como o servidor de link roda?**

Desde a fase inicial do link, o servidor web seguro também será executado. O servidor também terá um certificado de domínio anexado (HTTPS).

**Como identificar o subdomínio do Link Local?**

O nome de domínio principal será omegaailink.com.
`(OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com)`. Já o Link-id pode ser encontrado no arquivo de configuração do servidor DICOM (página 6).

### Ativar Domínio Personalizado na Máquina Local

Siga os passos abaixo para ativar um domínio personalizado em sua máquina local.

1.  Abra o editor (notepad) como administrador e abra o [arquivo hosts](https://devnet.kentico.com/articles/what-is-the-hosts-file-and-how-to-use-it):
    C:\Windows\System32\drivers\etc\hosts

    

    **Link-id:** Pode ser encontrado no arquivo de configuração do servidor DICOM.

    

    **Localização**: C:\ProgramFiles\RamSoft.OmegaAILink\DICOMServerConfig.json

    

    **Organization-Name:** O nome da organização conterá apenas caracteres alfanuméricos, todos os outros caracteres serão substituídos por **“-”**.

2.  Após salvar a configuração, reinicie o Serviço RamSoft OmegaAI Link.

3.  Adicione o client ID à feature flag do Launch darkly.

4.  Para testar o domínio no navegador, use o seguinte:
    `https://OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com<u>/DICOMcache</u>`

5.  Quando o Cache do Link for configurado com sucesso, a seguinte mensagem será exibida:

    

**Notas**: É recomendado para todos os ambientes de teste primeiro associar o domínio ao seu endereço IP local. Você pode usar 127.0.0.1 como seu endereço IP.

**Exemplo**: 127.0.0.1
`OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com`

- Deve existir apenas um espaço entre o IP e o Link aqui:
  192.168.XX.XX
  `OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com`

- OMEGAAILINK deve estar em letras maiúsculas e o Nome da Organização deve seguir o mesmo formato de letras como inserido no OmegaAI (para o Nome do Link).

  > Como visto aqui: `192.168.XX.XX OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com`

## Comunicação de Dados & Segurança

### Comunicação de Dados

O OmegaAI Link recebe dados das modalidades configuradas usando o padrão DICOM na Porta TCP/IP. Tudo isso é configurado no momento da instalação.

**Modalidades**

Modalidades das instalações hospitalares enviarão dados pelo protocolo TCP/IP não criptografado via porta (configurável no OmegaAI).

**Nota**: Deve ser comunicação LAN para LAN, o que é suficiente se todas as comunicações forem locais.

Além disso, o DICOM TLS pode ser incorporado ao OmegaAI Link mediante solicitação do cliente.

### Segurança dos Dados

Para maior segurança, os dados recebidos são transferidos para o servidor OmegaAI usando o protocolo seguro "https:". Esse processo chama a API segura no servidor OmegaAI, que por sua vez é autenticada pelo padrão OAuth 2.0.

**Criptografia**

A criptografia em trânsito é aplicada usando **TLS v1.2** ao comunicar do local para o Azure.

**Dispositivo Stand-Alone**

Como o OmegaAI Link é um dispositivo stand-alone, a criptografia em repouso não pode ser padronizada no nível de disco ou sistema operacional.

**Nota**: O disco do SO é criptografado e descriptografado.

## Como Gerenciar Dispositivos em Correlação com o OAI Link

A seção de Dispositivos permite visualizar uma lista de proxies DICOM Web e DICOM integrados à organização.

Adicionar um novo dispositivo envolve dois passos: adicionar o dispositivo e adicionar uma estação DICOM para conectar o dispositivo ao OmegaAI.

### Adicionando Novo Dispositivo DICOM

1.  Clique em Organização na barra de navegação à esquerda.

2.  Clique em **Dispositivo**. A página de Dispositivos será aberta.

3.  Insira os seguintes detalhes:

- **Tipo de Dispositivo**: Por padrão, o tipo de dispositivo é OmegaAI Link. Este campo não pode ser editado.

- **Nome:** Nome da respectiva máquina/dispositivo.

- **AE Title:** Application Entity Title é a identidade do link.

- **Porta:** Número da porta do respectivo dispositivo.

4.  Clique em **Download** para baixar e instalar o OmegaAI Link.

O novo dispositivo é adicionado à lista de dispositivos.

### Adicionando Estação DICOM

Estações DICOM usam o Protocolo de Controle de Transmissão (TCP) para conectar ao dispositivo OmegaAI Link, que conecta ao OmegaAI.

1.  Assim que um dispositivo é criado, um painel se abre ao lado da lista de dispositivos. Clique em **+** no painel.

2.  Realize o seguinte na seção Geral:

    

- **Estações DICOM**: Insira o nome da estação DICOM que deseja adicionar.

- **AE Title** (campo obrigatório): Insira o título da Application Entity (AE).

- **Endereço IP/Hostname**: Insira o endereço IP da estação que será usada para comunicação DICOM.

Se o endereço IP for dinâmico, insira o nome da máquina.

- **Porta** (obrigatória para envio DICOM e opcional para recebimento): Insira o número da porta da estação que será usada para comunicação DICOM.

- **Ativar TLS**: Marque esta caixa para criptografar a comunicação DICOM.

- **É Servidor de Arquivo**: Marque esta caixa se for um servidor de arquivo.

- **Necessita Notificação IOCM**: Marque se for necessário notificação de Imaging Object Change Management (IOCM).

- **Descrição da Estação DICOM**: Insira a descrição da estação DICOM.

- **Exportar**: Clique para exportar a configuração da estação DIOCM para o formato JSON. Você pode atualizar ou editar a configuração exportada.

- **Importar**: Após modificar os detalhes da configuração, clique em **Importar** para fazer o upload.

- **Ativo**: Clique em **Ativo** para definir a estação DICOM como ativa.

- **Ativar Heartbeat**: Selecione este botão para ativar o heartbeat.

- **Testar Conexão**: Após preencher todos os detalhes da estação DICOM, clique neste botão para testar a conexão.

- **Status**: Este campo é preenchido automaticamente. Indica o status do DIOCM com base no heartbeat.

  Dependendo do status, este campo exibe os seguintes valores:

  - **Ativo**: Indica que a estação DIOCM está ativa.

  - **Desconhecido**: Indica que a estação DIOCM é desconhecida.

  - **Offline**: Indica que a estação DIOCM está offline.

  Se a estação DICOM estiver offline, o sistema não tentará realizar o envio DICOM ativamente.

3.  Selecione as seguintes opções na seção de Recursos das Estações DICOM, conforme necessário:

- **Ativar Heartbeat**: Selecione este botão para ativar o heartbeat.

- **Enviar para estações DICOM do dispositivo**: Marque esta caixa para permitir que o OmegaAI envie estudos para a estação DICOM.

- **Consulta/Recuperação:** Marque esta caixa para permitir que a estação DICOM atenda consultas DICOM ou recupere estudos.

- **Enviar ID de Paciente Original e Emissor**: Marque esta caixa para preservar e enviar o ID de Paciente Original e o Emissor do campo DICOM de ID de Paciente.

  **Nota**: Refere-se à informação originalmente recebida.

### Entendendo o DICOM Heartbeat

O heartbeat DICOM é uma utilidade que impede a estação DICOM de enviar estudos para uma estação que está offline.

**Nota**: Ele envia um ping DICOM para a estação remota a cada 10 minutos para verificar se a estação está ativa.

O heartbeat DICOM consiste em três status:

- **Online**

Se o heartbeat DICOM estiver ativado e a estação estiver ativa e respondendo aos pings, o status da estação aparece como Online e um indicador verde é exibido.

- **Offline**

Se o heartbeat DICOM estiver ativado e os pings DICOM falharem, o status da estação aparece como Offline e um indicador vermelho é exibido.

- **Desconhecido**

Se o heartbeat DICOM não estiver ativado para uma estação, seu status aparecerá como Desconhecido.

### DICOM Query Echo & Search

O DICOM Query Echo é usado para verificar o status da conexão (ex.: Online, Offline, Desconhecido, etc.), enquanto o DICOM Query Search é utilizado para buscar estudos e recuperar objetos DICOM de outros dispositivos DICOM (ex.: estações remotas).

### DICOM Query Echo

Para consultar com sucesso, precisamos primeiro garantir que o dispositivo/estação de destino está online. Isso pode ser feito usando o Echo (clicando no botão **TESTAR CONEXÃO** para verificar o status do dispositivo) na página de detalhes do Dispositivo da Organização.

Siga os passos abaixo para navegar até a página de detalhes do Dispositivo da Organização.

1.  Clique em Organização na barra de navegação à esquerda.

2.  Clique em **Dispositivo**. A página de Dispositivos será aberta.

### Realizar DICOM Query Search

Siga os passos abaixo para realizar uma DICOM Query Search.

1.  Clique na seta suspensa na barra de pesquisa.

2.  Selecione DICOM Query. Um painel aparecerá.

    

3.  Insira os seguintes detalhes no painel:

        - **Organização**\[Obrigatório\]: Insira o nome da organização à qual os

    objetos DICOM pertencem. Este campo exibe possíveis correspondências ao digitar.

          **Nota**: Você deve estar associado à organização

    na qual está pesquisando.

        - **Dispositivo:** Insira o nome do dispositivo. Este também é um campo de busca conforme digita.

        - **Campos de Pesquisa**: Use estes campos para refinar ainda mais seus critérios de busca.

          Clique em **Mais** para adicionar mais campos. Todas as colunas associadas a estudos são exibidas.

          Você pode buscar campos digitando na barra de pesquisa.

          Clique em **Excluir** para remover um campo dos critérios de busca.

4.  **Nota**: Você não pode buscar objetos DICOM sem especificar o nome da organização e do dispositivo.

5.  **Paciente**: Use para buscar paciente(s) específico(s).

6.  **Organização**: Use para buscar organização(ões) específica(s).

7.  **Dispositivo**: Use para buscar objetos DICOM que estejam em outros dispositivos DICOM.

8.  Clique em **Pesquisar** para buscar ou em **Cancelar** para descartar.

9.  Clique em Salvar. Após salvar, todos os registros correspondentes serão exibidos.

10. Clique no avatar do Estudo associado ao(s) estudo(s) no resultado.

11. Clique em **RECUPERAR ESTUDO**.

        O botão **RECUPERAR ESTUDO** só fica ativo após você

    selecionar um estudo.

        Após alguns segundos, o ícone circular em forma de seta é

    substituído por **ACOMPANHAR**.

        **Nota**: **Acompanhar** indica que o processo de recuperação do estudo está em andamento.

12. Clique em **ACOMPANHAR** para visualizar o progresso na página de Log de Tarefas.

#### Enviar um Estudo

O envio de estudo pode ser utilizado por usuários para enviar um estudo para um dispositivo/estação remota. Também conhecido como **DICOM Transmit** ou **DICOM Store Push**.

**Nota**: O estudo pode ser anonimizado.

#### Enviar Estudos para outros Dispositivos

1.  Na lista de trabalho, clique uma vez no estudo desejado. O Omega dial será exibido.

    

2.  Clique em **Enviar Estudo**. O painel de Enviar Estudo será aberto.

    

3.  Insira as seguintes informações:

    - **Prioridade**: Selecione uma das opções pré-configuradas: **Alta, Média ou Baixa**.

    - **Organização de Imagem**: Digite o nome da organização de imagem para a qual deseja enviar a imagem. Assim que começar a digitar, as organizações correspondentes serão exibidas.

    - **Destino (Dispositivo)**: Todos os dispositivos associados à organização de imagem selecionada estarão disponíveis. Selecione o dispositivo apropriado.

    **Nota**: Você pode selecionar apenas um dispositivo.

4.  Clique em **ENVIAR** para enviar o estudo ou em **CANCELAR** para descartar.

    Se você clicar em **Enviar**, uma mensagem informando que a transmissão foi bem-sucedida será exibida e os estudos serão adicionados à fila.

    **Nota**: Você pode verificar o progresso e o status da transmissão no Log de Tarefas.