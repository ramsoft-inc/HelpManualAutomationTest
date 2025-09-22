---
sidebar_position: 6
title: Solicitações de Agendamentos Passados
---

# Solicitações de Agendamentos Passados

A seguir estão as funcionalidades relacionadas às solicitações de agendamentos passados e modificações do Agendador:

1.  **É permitida a solicitação direta de agendamentos passados até uma janela de T - 2 dias,
    onde T é a data do sistema do usuário**.

    a) Ex: A data de hoje T é 3 de setembro de 2024. No Agendador, o usuário poderá
    solicitar um agendamento para 1, 2 ou 3 de setembro de 2024 ou qualquer
    data futura.

    b) Ex: A data de hoje T é 3 de setembro de 2024. No Agendador, o usuário **não poderá**
    solicitar um agendamento para 31 de agosto ou qualquer outra data passada.

2.  **Qualquer agendamento não concluído (Status do Agendamento diferente de
    Concluído) pode ser editado e movido para uma data de até T - 2
    dias, onde T é a data do sistema do usuário**.

    a) Ex: A data de hoje T é 3 de setembro de 2024. No Agendador, se um
    agendamento datado de 20-ago-2024 estiver com status **Agendado**, o usuário poderá
    editar e alterar o status do agendamento e a data pode ser 1, 2 ou 3 de setembro de 2024 ou qualquer data futura.

    b) Ex: A data de hoje T é 3 de setembro de 2024. No Agendador, se um
    agendamento datado de 31-ago-2024 estiver com status **Não Compareceu**, o usuário poderá
    editar e alterar o status do agendamento e a data pode ser 1, 2 ou 3 de setembro de 2024 ou qualquer data futura.

3.  **Agendamentos concluídos (Status do Agendamento é Concluído) podem ser
    editados apenas até uma janela de T - 2 dias, onde T é a data do sistema
    do usuário.**

    a) Ex: A data de hoje T é 3 de setembro de 2024. No Agendador, se um
    agendamento datado de 31-ago-2024 estiver com status **Concluído**, o usuário poderá
    editar e alterar o status do agendamento e a data pode ser 1, 2 ou 3 de setembro de 2024 ou qualquer data futura.

    b) Ex: A data de hoje T é 3 de setembro de 2024. No Agendador, se um
    agendamento datado de 30-ago-2024 estiver com status **Concluído**, o usuário
    **não poderá** editar e alterar o agendamento.