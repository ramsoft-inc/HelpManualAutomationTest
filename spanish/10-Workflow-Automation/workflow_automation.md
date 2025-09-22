---
sidebar_position: 1
title: O que é Automação de Workflow?
---

# O que é Automação de Workflow?

A Automação de Workflow permite automatizar certos processos e tarefas dentro do software com base em preferências pessoais. Este guia irá orientá-lo pela interface gráfica (GUI), explicar suas capacidades e guiá-lo na criação, salvamento, exclusão, cópia e edição de workflows.

## Interface de Automação de Workflow

A interface de Automação de Workflow apresenta diferentes tipos de workflows criados para uma organização. Cada workflow pode ser ativado ou desativado, o que determina se o workflow está ativo ou não.

## Criando um Novo Workflow

Para criar um novo workflow:

1. Clique no botão "+".

3. A interface do usuário será aberta para permitir que você crie seu workflow.

4. Dê um nome ao seu workflow clicando no botão "editar".

5. Faça as alterações desejadas e clique no botão "salvar".

6. Feche o workflow.

## Editando um Workflow

Para editar um workflow existente:

1. Clique no botão de três pontos ao lado do workflow que deseja editar.

2. Faça as alterações desejadas.

3. Clique no botão "salvar".

## Excluindo um Workflow

Para excluir um workflow:

1. Clique no botão de três pontos ao lado do workflow que deseja excluir.

2. Clique em "excluir".

3. Confirme sua decisão.

## Copiando um Workflow

Para copiar um workflow:

1. Clique no botão de três pontos ao lado do workflow que deseja copiar.

2. Clique em "copiar".

3. Uma cópia do workflow será criada e você poderá editá-la conforme necessário.

## Workflows Padrão

O workflow padrão é o workflow de exemplo disponível para toda organização que ingressa no software. Este workflow é somente leitura e não pode ser editado.

**Nota**: O Workflow Padrão pode ser copiado caso você queira criar um workflow semelhante, neste caso a edição será habilitada.

## Entendendo os Componentes do Workflow

### Disparadores (Triggers)

Disparadores são eventos que fazem um workflow ser executado. Existem diferentes tipos de disparadores, como paciente, status do agendamento, operação e status do estudo. Os disparadores estão associados a várias seções individuais.

### Condições

Condições, ou filtros, permitem especificar que um workflow deve ser executado apenas para um grupo específico ou sob certas circunstâncias. As condições podem ser baseadas em informações do paciente ou do estudo.

### Ações

Ações podem ser configuradas para disparar um resultado específico assim que uma condição for atendida.

Existem diferentes tipos de ações, como:

- Alterar Estudo

- Enviar Mensagem

- Enviar Notificação

- Atribuir

- Desatribuir

## Disparador de Relatório Assinado (Tipo de Disparador de Operação)

O **Disparador de Relatório Assinado** está sob o Tipo de Disparador **Operações** na Automação de Workflow (WFA). Este disparador é especialmente utilizado para automatizar ações como distribuição de relatórios e notificações imediatamente após um relatório diagnóstico ser criado, garantindo um processamento contínuo e pontual sem atrasar os workflows DICOM. O disparador deve funcionar de forma independente e não deve interferir com workflows existentes de **Status do Estudo ASSINADO**. Previne atrasos na automação do workflow devido ao processamento assíncrono do DICOM.

**Escopo**

O disparador **Relatório Assinado** se aplica a:

* Relatórios Finais

* Emendas Assinadas

**Exclusões**:

Relatórios preliminares não estão incluídos.

**Critérios de Ativação do Disparador**

O disparador **Relatório Assinado** é ativado quando qualquer um dos seguintes eventos ocorre:

* Um relatório diagnóstico é enviado como relatório final via GUI do Document Viewer (DV).

* Um relatório é recebido no OmegaAI através da ingestão de transação HL7 bundle.

* Um Relatório Estruturado é ingerido via ingestão DICOM através do OmegaAI Link.

* Um relatório final com tags DICOM é importado usando a GUI de IMPORTAÇÃO.

* Um relatório final é criado ou salvo no Document Viewer (DV) do OmegaAI, incluindo Emendas Assinadas (Done-Signoff).

**Ação de Distribuição de Relatório**

Um único fax é enviado por número de fax único para evitar transmissões duplicadas.

Caso de uso: Quando o mesmo número de fax é usado tanto para o médico solicitante quanto para a organização solicitante. Um único e-mail é enviado por endereço de e-mail único, garantindo que não sejam enviados e-mails duplicados.

## Ação Pull Prior

Permite que os usuários recuperem estudos médicos anteriores de diferentes sistemas PACS (Picture Archiving and Communication Systems) para a plataforma Omega. A ação Pull Prior foi projetada para ajudar os usuários a buscar estudos anteriores de qualquer sistema PACS conectado ao Omega. Essa capacidade é crucial para acessar dados históricos de pacientes em múltiplas organizações e estações.

**Configuração**

Seleção Multi-Organização e Estação: Com o recurso atualizado, os usuários agora podem selecionar várias organizações e estações para buscar estudos anteriores de diferentes locais. Isso é particularmente útil para pacientes com estudos distribuídos em diferentes sistemas.

**Uso**

Campos Multi-Seleção: Os usuários agora podem inserir várias organizações e estações nas configurações da ação pull prior. Por exemplo, se um paciente tem estudos anteriores em duas estações diferentes, o usuário precisa inserir as respectivas organizações e estações para buscar os dados de ambas.

- **Modelo de Correspondência**: Este é um critério de filtragem usado para selecionar estudos anteriores relevantes. Os usuários podem filtrar pelos seguintes:

- **Nome ou ID do paciente**

- **Modalidade** (ex: TC, RM)

- **Palavras-chave da descrição**

**Agendamento**: Os usuários agora podem agendar quando os estudos anteriores serão buscados. Este recurso é útil quando o sistema está ocupado e o processo de recuperação pode ser agendado para um horário menos movimentado, como à meia-noite.

**Limitando o Número de Estudos Anteriores**

Para gerenciar o volume de dados e garantir a eficiência do sistema, os usuários podem limitar o número de estudos anteriores a serem buscados. Isso evita sobrecarregar o sistema com grandes volumes de dados, especialmente em grandes organizações com muitos pacientes.

**Etapas Pós-Configuração**

Ao configurar a ação pull prior, os usuários podem selecionar várias organizações e estações, aplicar o modelo de correspondência relevante e agendar a ação. Isso garante que os estudos anteriores necessários sejam buscados de forma eficiente e eficaz, adaptados às necessidades específicas do usuário.

## Centralização da Gestão dos Status dos Estudos no Nível da Organização Master

Restringe o acesso à gestão do status dos estudos nas organizações filhas para garantir consistência e evitar conflitos. Isso leva à uniformidade e padronização dos status dos estudos em toda a organização. Conflitos e inconsistências potenciais nos status dos estudos entre a organização master e as filhas são eliminados. A complexidade administrativa é reduzida ao gerenciar os status dos estudos a partir de um único ponto.

## Usabilidade da Automação de Workflow

Cada workflow pode acomodar múltiplas ações e condições. Essa flexibilidade elimina a necessidade de criar múltiplos workflows para processos semelhantes. A última pessoa que editou um workflow é exibida na GUI. O software não suporta a criação de workflows duplicados.

## Assinatura de Relatório de Estudo

A ação **Assinatura de Relatório de Estudo** é um recurso dentro do módulo de Automação de Workflow (WFA) no OmegaAI.

O relatório preliminar é convertido em Relatório Final e o status do estudo é automaticamente alterado para ASSINADO quando um relatório é assinado pelo Médico Leitor ou Médico Executor.

Com a melhoria, o sistema permite atribuir automaticamente o médico leitor quando um relatório é assinado, garantindo que o registro do estudo reflita as informações corretas. Esta ação se aplica apenas durante a assinatura inicial de um relatório de estudo.

**Quando um usuário assina um relatório de estudo:**

O sistema valida se o usuário está autorizado como Médico Leitor (Reading MD) ou Médico Interpretador (Interpreting MD).

Se o usuário estiver autorizado, o sistema o atribui automaticamente como Médico Leitor do estudo.

**Tratamento de Emendas: Se um relatório estiver sendo emendado após a assinatura inicial:**

O sistema não atribui nem altera automaticamente o Médico Leitor.

A ação se aplica apenas à assinatura inicial de um relatório.

## Scripting

### Scripting DICOM

Atributos de Scripting DICOM Proxy e DICOM Web.

### DICOM Proxy

**Operações:**

O scripting DICOM dentro do DICOM Proxy atualmente suporta 4 operações:

- **DICOM Send (CSTORESCU):** Envio de objetos DICOM para outra entidade.

- **DICOM Receive (CSTORESCP):** Recebimento de objetos DICOM de outra entidade.

- **Outbound Find (CFINDSCP):** Aplicação de scripts no conjunto de resultados das operações C-FIND, que retornam resultados de busca.

- **Inbound Find (CFINDSCU):** Aplicação de scripts no conjunto de requisições das operações C-FIND, que contêm parâmetros de busca.

Os Tipos de Operação são definidos como enums em **DICOMOperationType.cs** do **RamSoft.Common**. Isso fornece aos usuários flexibilidade para determinar o cenário em que desejam executar sua lógica.

**Script de Exemplo:**

Este script modifica o número de acesso (accession number) adicionando 'RAM' no início ao receber objetos. Se o número de acesso for '1234', o resultado será 'RAM1234'.

```javascript
(function() {
    var accessionNum;

    // Para Operação DICOM Send
    if (Operation === 'CSTORESCU') {
        // Leitura do AccessionNumber
        if (DICOMObject["00080050"]) {
            accessionNum = DICOMObject["00080050"]["Value"];
        }

        // Atualização do AccessionNumber
        if ("00080050" in DICOMObject) {
            DICOMObject["00080050"] = {"vr" : "SH", "Value": [ 'RAM ' + accessionNum]}
        }
    }
})();
```

### DICOM Web

**Operações:**

O scripting DICOM dentro do DICOM Web envolve várias operações:

- **Search Inbound (SearchInbound):** Busca de objetos DICOM na direção de entrada.

- **Search Outbound (SearchOutbound):** Busca de objetos DICOM na direção de saída.

- **Retrieve Inbound (RetrieveInbound):** Recuperação de objetos DICOM na direção de entrada.

- **Retrieve Outbound (RetrieveOutbound):** Recuperação de objetos DICOM na direção de saída.

- **Store Inbound (StoreInbound):** Armazenamento de objetos DICOM na direção de entrada.

- **Store Outbound (StoreOutbound):** Armazenamento de objetos DICOM na direção de saída.

Os Tipos de Operação são definidos como enums em **DICOMOperationType.cs** do **RamSoft.Common**.

**Script de Exemplo:**

Este script demonstra vários cenários de modificação de atributos DICOM com base em diferentes operações.
```javascript
(function () {
    var patientName;
    if (Operation === 'SearchOutbound') {
        // Leitura do PatientName
        if (DICOMObject['PatientName']) {
            patientName = DICOMObject['PatientName'];
        }
        // Atualização do PatientName
        if ('PatientName' in DICOMObject) {
            DICOMObject['PatientName'] = 'SearchOut^' + patientName;
        }
    }

    if (Operation === 'SearchInbound') {
        // Leitura do PatientName
        if (DICOMObject['PatientName']) {
            patientName = DICOMObject['PatientName'];
        }
        // Atualização do PatientName
        if ('PatientName' in DICOMObject) {
            DICOMObject['PatientName'] = 'SearchIn^' + patientName;
        }
    }

    var accessionNum;

    if (Operation === 'StoreOutbound') {
        // Leitura do AccessionNumber
        if (DICOMObject['00080050']) {
            accessionNum = DICOMObject['00080050']['Value'];
        }

        // Atualização do AccessionNumber
        if ('00080050' in DICOMObject) {
            DICOMObject['00080050'] = { vr: 'SH', Value: ['StoreOut^' + accessionNum] };
        }
    }

    if (Operation === 'StoreInbound') {
        // Leitura do AccessionNumber
        if (DICOMObject['00080050']) {
            accessionNum = DICOMObject['00080050']['Value'];
        }

        // Atualização do AccessionNumber
        if ('00080050' in DICOMObject) {
            DICOMObject['00080050'] = { vr: 'SH', Value: ['StoreIn^' + accessionNum] };
        }
    }

    if (Operation === 'RetrieveOutbound') {
        // Leitura do AccessionNumber
        if (DICOMObject['00080050']) {
            accessionNum = DICOMObject['00080050']['Value'];
        }

        // Atualização do AccessionNumber
        if ('00080050' in DICOMObject) {
            DICOMObject['00080050'] = { vr: 'SH', Value: ['RetrieveOut^' + accessionNum] };
        }
    }

    if (Operation === 'RetrieveInbound') {
        // Leitura do AccessionNumber
        if (DICOMObject['00080050']) {
            accessionNum = DICOMObject['00080050']['Value'];
        }

        // Atualização do AccessionNumber
        if ('00080050' in DICOMObject) {
            DICOMObject['00080050'] = { vr: 'SH', Value: ['RetrieveIn^' + accessionNum] };
        }
    }
})();
```

## Scripting de Workflow Usando o Editor de Script

O Editor de Script de Workflow permite aos usuários personalizar workflows usando scripts JavaScript. Este recurso concede às organizações gerenciadoras a flexibilidade de criar scripts personalizados que definem seu workflow, podendo ser herdados por organizações filhas ou de imagem. O Editor de Script oferece atalhos para operações comuns, recursos JSON DICOM e outros parâmetros, facilitando a personalização.

## Etapas para Configurar Workflow Usando o Editor de Script:

1.  **Acessar Scripting de Workflow:** Navegue até a seção de Automação de Workflow.

2.  **Abrir Editor de Script:** Clique no canto superior direito da Automação de Workflow, o que o direcionará para a página de Scripting de Workflow.

3.  **Editar Script:** Clique no botão "Editar" para abrir o script no Editor de Script de Workflow. Esta ação exibirá a gaveta de Ferramentas, contendo várias opções para agilizar a criação do script.

4.  **Utilizar Gaveta de Ferramentas:** A gaveta de Ferramentas oferece várias funcionalidades:

> **Operações:** Apresenta atalhos para operações de Buscar, Recuperar e Roteamento, Roteamento e Transição de Status, facilitando a personalização do workflow.
>
> **DICOM JSON:** Ajuda a compor a estrutura JSON DICOM necessária para uma operação de Busca.
>
> **Campos FHIR:** Fornece acesso a campos FHIR comumente usados para fácil integração. Você pode arrastar e soltar esses campos no editor de Script.
>
> **Dispositivos:** Exibe a lista de estações associadas à organização específica.
>
> **Status dos Estudos:** Exibe uma lista de status dos estudos para referência.

5.  **Criação do Script:** Você pode digitar diretamente o script do workflow no Editor de Script de Workflow ou utilizar os atalhos fornecidos na gaveta de Ferramentas para agilizar a criação do script.

6.  **Implantar Script:** Após criar o script, clique em "Implantar". Esta ação garante que o script esteja pronto e seja executado quando o evento relevante ocorrer.

7.  **Salvar ou Descartar Alterações:** Após criar ou editar o script, você pode escolher "Salvar" para manter as alterações ou "Cancelar" para descartá-las.

## Personalizando Workflow com Operações:

1.  **Operação Buscar (Fetch):** Executa um C-FIND em todas as estações de arquivo associadas à organização gerenciadora usando o dispositivo OmegaAI Link. Esta operação busca estudos com base nos parâmetros definidos na estrutura JSON do C-FIND. Nota: Apenas estações DICOM com a opção "Archive Server" ativada serão pesquisadas.

2.  **Operação Recuperar e Roteamento (Retrieve and Route):** Busca um estudo de uma estação de arquivo e, em seguida, o roteia para outra estação. O caso de uso comum é enviar um estudo dentro do sistema junto com os estudos anteriores pré-buscados.

**Exemplo de Script de Busca e Roteamento:**
```javascript
(function(operationJson, imagingStudyJson, patientJson, encounterJson, serviceRequestJson, organizationJson, practitionerJson) {
    function getExtensionValue(imagingStudyJson, url, type) {
        let data = imagingStudyJson['extension'].find((item) => {
            return item.url == url;
        });
        return data ? data[type] : null;
    }

    if (getExtensionValue(imagingStudyJson, 'http://hl7.org/fhir/us/core/StructureDefinition/status', 'valueString') == 'COMPLETED') {
        let findDICOMJson = {};
        findDICOMJson["00100020"] = { "vr": "LO", "Value": [ patientJson.identifier[0].value ] };
        findDICOMJson["00100010"] = { "vr": "PN", "Value": [ patientJson.name[0].text ] };
        // Buscar estudos relacionados
        host.fetch(imagingStudyJson, patientJson, findDICOMJson);
    }

    if (operationJson.type == 'Fetched Studies') {
        let studies = operationJson.studies;

        // determinar quais estudos são relevantes
        for (let study of studies) {
            if (study.description == 'PET/CT SKULL TO MILD THIGH') {
                host.retrieveAndRoute(study, 'toronto-hgua', 3);
            }
        }

        // Roteamento para o dispositivo
        host.route('toronto-hgua', 3);
    }
})();
```

3.  **Operação de Roteamento (Route):** Envia um estudo dentro do OmegaAI para outro sistema. Esta operação é realizada postando uma tarefa de armazenamento DICOM, que é então processada pelo dispositivo OmegaAI Link. Nota: Um caso de uso comum envolve o envio de um estudo dentro do sistema junto com estudos anteriores pré-buscados.

**Exemplo de Script para Roteamento de Objetos:**

Este script enviará objetos individuais assim que forem recebidos ou importados.

```javascript
(function(operationJson, imagingStudyJson, patientJson, encounterJson, serviceRequestJson, organizationJson, practitionerJson, objectJson, deviceJson) {
    if (operationJson.type == 'DICOM Object Received' || operationJson.type == 'DICOM Object Imported' ) {
        // Roteia objeto para o dispositivo (objectJson, imagingStudyJson, deviceName,deviceId)
        host.routeObject(objectJson, imagingStudyJson, '11MED PACS LitePowerServer', 51);
    }
})
```
