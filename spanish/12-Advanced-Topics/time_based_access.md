---
sidebar_position: 7
title: Políticas de Acesso Baseadas em Horário
tags:
- Acesso Condicional
- Segurança
- Acesso de Usuário
- Federação B2B
- Política de Acesso
- Microsoft Azure
- Autenticação
- Gerenciamento de Identidade
- Segurança de Sistema
- Controle de Acesso
---

# Visão Geral: Implementando Políticas de Acesso Baseadas em Horário no OmegaAI

Para aumentar a segurança do OmegaAI, você pode utilizar o Microsoft Azure Active Directory (Azure AD) para implementar políticas de acesso baseadas em horário. Esse recurso permite restringir o acesso dos usuários ao OmegaAI durante o horário comercial designado, garantindo que os usuários não possam fazer login fora dos horários especificados. Essa abordagem ajuda a manter a segurança do sistema e o controle sobre quando os usuários podem acessar aplicações críticas.

Além disso, o OmegaAI oferece suporte à federação B2B, um recurso que permite colaboração segura com parceiros externos. A federação B2B possibilita que usuários de organizações parceiras acessem o OmegaAI de forma segura usando suas próprias credenciais. Após a configuração da federação B2B, as organizações parceiras podem gerenciar políticas de segurança baseadas em horário de forma independente através do próprio ambiente Azure AD.

## Etapas para Configurar o Acesso Baseado em Horário no Azure AD

### Etapa 1: Integre Sua Organização ao Azure Active Directory (Azure AD)

Antes de configurar o acesso baseado em horário, certifique-se de que sua organização está integrada ao Azure AD. O Azure AD fornece as ferramentas necessárias, como políticas de Acesso Condicional, para gerenciar o acesso dos usuários com base em horário, localização e outros critérios. Certifique-se de que todas as contas de usuário estejam sincronizadas e gerenciadas pelo Azure AD.

### Etapa 2: Defina uma Política de Acesso Baseada em Horário no Azure AD

O recurso de Acesso Condicional do Azure AD permite definir políticas de acesso com base em várias condições, incluindo restrições de horário. Siga estas etapas para configurar uma política de acesso baseada em horário:

1. **Acesse o Acesso Condicional do Azure AD**:
   - Faça login no [portal do Azure](https://portal.azure.com) e navegue até **Azure Active Directory**.
   - Selecione **Segurança** e, em seguida, escolha **Acesso Condicional**.

2. **Crie uma Nova Política**:
   - Clique em **Nova Política** e atribua um nome relevante (por exemplo, "Política de Acesso em Horário Comercial").
   - Em **Atribuições**, selecione **Usuários ou Workloads** e escolha os grupos de usuários aos quais a política se aplicará (por exemplo, "Equipe Interna" ou "Usuários Cliente X").

3. **Defina as Condições**:
   - Em **Condições**, você pode configurar vários parâmetros, como **Risco de Entrada**, **Plataformas de Dispositivo** ou **Localizações**, dependendo das necessidades de segurança.
   - Para o controle de acesso baseado em horário, em **Frequência de Entrada**, especifique os horários durante os quais os usuários podem acessar o sistema. Por exemplo, restrinja o acesso ao horário comercial (ex.: das 9h às 17h em dias úteis).

4. **Configure os Controles de Sessão**:
   - Em **Conceder**, especifique as ações que os usuários podem realizar durante os horários permitidos. Por exemplo, permita o login apenas nos horários especificados e configure a Autenticação Multifator (MFA) para aumentar a segurança durante o horário comercial.

5. **Aplique e Monitore a Política**:
   - Após configurar a política, salve e ative-a. O Azure AD aplicará automaticamente as restrições de acesso com base nas condições especificadas. Você pode monitorar a efetividade da política e a conformidade dos usuários através do portal do Azure.

## Recursos da Microsoft para Suporte Adicional

- [Top 10 ações para proteger seu ambiente: Defina políticas de acesso condicional](https://www.microsoft.com/security/blog)
- [Configurar Acesso Condicional no Azure AD](https://cloudguides.microsoft.com)

Esse processo garante que o acesso ao OmegaAI esteja protegido de acordo com o horário comercial da sua organização, aumentando o controle e aprimorando a segurança em todo o ambiente de aplicações.