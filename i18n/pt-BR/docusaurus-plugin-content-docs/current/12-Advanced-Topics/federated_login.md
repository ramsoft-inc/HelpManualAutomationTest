---
sidebar_position: 5
title: Login Federado, Autenticação e Configuração de MFA
tags:
  - Federação B2B
  - Login Federado
  - OAI
  - OpenID
  - SAML
  - Provedores de Identidade
  - Autenticação
  - Atualização de Política
  - Teste do Cliente
  - Mapeamento de Papéis
---

# Login Federado, Autenticação e Configuração de MFA

## Visão Geral

Esta seção descreve como configurar a federação Business-to-Business (B2B)
com a OmegaAI (OAI), com foco no login federado por meio de
provedores de identidade OpenID e SAML. O login federado permite que os usuários
acessem múltiplos aplicativos com um único conjunto de credenciais, garantindo tanto conveniência quanto segurança.
O processo descrito inclui a coleta das informações necessárias do cliente, a coordenação de atualizações de políticas com
os desenvolvedores da OmegaAI, a realização de testes pelo cliente e um passo opcional de mapeamento de papéis.

## Informações Necessárias

Para iniciar a integração de login federado, é necessário fornecer uma lista de detalhes para autenticação via provedores de identidade OpenID e SAML.

### OpenID

Por favor, forneça os seguintes detalhes:

- **Client ID**: Um identificador único para sua aplicação.

- **Secret**: Uma chave secreta usada para proteger a comunicação.

- **Response Type**: O tipo de resposta esperada.

- **Scope**: O escopo de acesso solicitado.

- **Response_mode**: Como a resposta é entregue ao seu cliente.

- **MetadataURL**: URL contendo metadados sobre a configuração do OpenID.

- **Domain_hint**: Direciona a solicitação de autenticação para o domínio correto.

- **ClaimsMapping**: Mapeia as declarações do token para atributos do usuário.

- **User Attributes**: UserID, DisplayName, GivenName, SurName e
  Email.

### SAML

Por favor, forneça os seguintes detalhes para configuração SAML:

- **WantsEncryptedAssertions**: Indica se as declarações devem ser
  criptografadas.

- **WantsSignedAssertions**: Indica se as declarações devem ser
  assinadas.

- **PartnerEntity**: O identificador da entidade do seu parceiro SAML.

- **IssuerUri**: O URI do emissor.

- **Domain_hint**: Usado para simplificar o processo de login.

- **Certificate**: Seu certificado de chave pública usado para verificar as declarações SAML.

- **ClaimsMapping**: Mapeia os atributos das declarações SAML para atributos do usuário.

- **User Attributes**: UserID, DisplayName, GivenName, SurName e
  Email.

Além disso, por favor, adicione a seguinte URL como URL de redirecionamento nas configurações do seu aplicativo federado:
\<https://omegaai.b2clogin.com/omegaai.onmicrosoft.com/oauth2/authresp\>

## Coordenar Atualização de Política com a Equipe RamSoft

Após fornecer os detalhes necessários, por favor, coordene com o
Suporte RamSoft para atualizar as políticas de autenticação. Essa coordenação
é crucial para integrar as novas configurações sem causar interrupções
no serviço.

## Realizar Testes de Usuário

Assim que as atualizações de política forem concluídas, é essencial que você realize
testes completos para verificar a funcionalidade do login federado.
Esses testes garantem que todas as integrações estejam operacionais e seguras antes
de entrar em produção.

## Mapeamento de Papéis (Opcional)

Se sua organização requer acesso baseado em papéis, podemos auxiliar no
mapeamento de papéis com base nas declarações fornecidas pelo seu Provedor de Identidade
(IDP).
