---
title: "Atualização de Produto: Gatilho de 'Relatório Assinado' na Automação de Fluxo de Trabalho (WFA)"
authors: [mkey]
tags: ["notas de lançamento", "automação de fluxo de trabalho", "OmegaAI"]
date: 2025-02-25
---

# **Gatilho de Relatório Assinado na Automação de Fluxo de Trabalho (WFA)**

Temos o prazer de anunciar o **Gatilho de Relatório Assinado** sob o **Tipo de Gatilho de Operações** na **Automação de Fluxo de Trabalho (WFA)**. Este novo gatilho automatiza ações pós-relatório (por exemplo, distribuição, notificações) imediatamente após um relatório diagnóstico ser finalizado, eliminando efetivamente atrasos causados pelo processamento assíncrono do DICOM. Isso melhora principalmente o suporte para clientes que utilizam soluções externas de geração de relatórios, além de adicionar um controle mais granular sobre outros cenários de criação de relatórios.

## Cenários de Ativação do Gatilho

O **Gatilho de Relatório Assinado** pode ser ativado quando qualquer um dos seguintes ocorrer:

1. Um relatório diagnóstico é **enviado** como relatório final via **Document Viewer (DV) GUI**.  
2. Um relatório é **recebido** no **OmegaAI** por meio de integrações HL7 ou FHIR.  
3. Um **Relatório Estruturado** é ingerido via **ingestão DICOM** através do [OmegaAI Link](/docs/OmegaAI-Link/OmegaAI_Link).  
4. Um relatório final (DICOM encapsulado) é **importado** usando o [Recurso de Importação](/docs/Getting-Started/import#import).  
5. Um relatório final é **criado** ou **salvo** no **Document Viewer (DV) do OmegaAI**, incluindo **Emendas Assinadas**.

> **Nota:** Certifique-se de adicionar as **condições** apropriadas após o gatilho para evitar que a assinatura final seja ativada quando não for necessário.

A **Automação de Fluxo de Trabalho** permite automatizar processos e tarefas, aumentando a eficiência e reduzindo a intervenção manual. Com o **Gatilho de Relatório Assinado**, estamos dando mais um passo para otimizar seu fluxo de trabalho de relatórios.

Para mais informações, consulte [Automação de Fluxo de Trabalho](/docs/Workflow-Automation/workflow_automation).
