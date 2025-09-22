---
sidebar_position: 6
title: Status do Estudo
tags:
  - Status do Estudo
  - Etapa do Fluxo de Trabalho
  - Valores de Status do Estudo
  - Regras de Transição
---

# O que é o Status do Estudo?

O Status do Estudo no OmegaAI representa o ciclo de vida de um estudo de radiologia dentro do sistema. Ele indica o progresso de um estudo desde a solicitação inicial até o relatório final e o arquivamento. Cada status está associado a etapas específicas do fluxo de trabalho e regras de transição para garantir uma operação fluida dentro dos fluxos de trabalho de radiologia.

O recurso de Status do Estudo no OmegaAI garante que os fluxos de trabalho de radiologia funcionem sem problemas, aplicando regras pré-definidas de progressão do estudo, valores de transição e mapeamentos de fluxo de trabalho. O gerenciamento adequado dos status do estudo previne interrupções no fluxo de trabalho e garante rastreabilidade por meio de logs de auditoria. Os administradores podem personalizar os status dentro de restrições definidas, garantindo conformidade com as melhores práticas dos fluxos de trabalho de radiologia.

## O que são Etapas do Fluxo de Trabalho?

Uma **Etapa do Fluxo de Trabalho** define uma fase no processo de radiologia que corresponde a status específicos do estudo. As etapas do fluxo de trabalho são usadas para categorizar e acompanhar o progresso do estudo desde a solicitação até a conclusão.

## Mapeamento de Status do Estudo & Etapa do Fluxo de Trabalho

Os status do estudo são mapeados para etapas do fluxo de trabalho para manter a consistência e conformidade com os fluxos de trabalho de radiologia. Esse mapeamento garante que cada estudo siga uma sequência pré-definida de status.

### Como Funciona o Mapeamento

Cada status do estudo está associado a uma ou mais etapas do fluxo de trabalho.

Quando um estudo avança para uma nova etapa do fluxo de trabalho, seu status é atualizado de acordo.

Regras de transição (valores mínimos/máximos) definem o movimento permitido entre status para evitar interrupções indesejadas no fluxo de trabalho.

## Valores de Status do Estudo & Regras de Transição

Os status do estudo possuem valores pré-definidos, juntamente com valores mínimos e máximos de transição. Esses valores determinam como os estudos se movem entre os status. Atualmente, os status do estudo podem ser marcados como inativos mesmo que estejam mapeados para uma etapa do fluxo de trabalho. Toda transição de status do estudo é verificada em relação aos seus valores Mínimo e Máximo de Transição.

**Nota:**

As regras de transição mínima/máxima se aplicam nas páginas de Lista de Trabalho (Worklist) e Informações do Estudo.

Os valores Mínimo e Máximo de Transição se aplicam apenas a atualizações manuais (não para atualizações automáticas via Automação de Fluxo de Trabalho, ingestão DICOM ou sincronização de agendamento).