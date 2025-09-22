---
sidebar_position: 2
title: Processo de Login e MFA
tags:
  - Login
  - Autenticação Multifator
  - Segurança
---

# Processo de Login e Autenticação Multifator (MFA)

O OmegaAI da RamSoft oferece medidas de segurança aprimoradas para contas por meio do procedimento de Autenticação Multifator (MFA), garantindo a confidencialidade e segurança das informações de todos os usuários.

Esta seção fornecerá um passo a passo do Login e Criação de Conta no OmegaAI da RamSoft, bem como do processo de MFA aplicado a diversos cenários:
- Login em Navegador Comum
- Navegador Anônimo (sem fechar o navegador)
- Navegador Anônimo (fechando o navegador)
- Navegador Diferente
- Endereço IP Diferente
- Dispositivo Diferente e Impressão Digital de OTP

## Verificação de Nova Conta de Usuário (Senha de Uso Único/código de verificação)

Se você optou por criar uma conta, insira os campos obrigatórios e clique em “Continuar”. Você será solicitado a verificar sua conta. Você receberá uma Senha de Uso Único (OTP) por e-mail ou SMS.

O cenário abaixo exibe o OTP enviado por e-mail:



Recupere seu OTP na caixa de entrada do seu e-mail e insira-o no campo solicitado.

Nota: Se você não recebeu o código de verificação na primeira vez, clique no link “reenviar e-mail” e siga o Passo 1.

Pressione “Verificar”. Sua conta foi verificada com sucesso.

## Processo de Login para Usuário Existente

Acesse [https://www.omegaai.com/](https://www.omegaai.com/). Assim que estiver na página de login, siga os passos abaixo para acessar sua conta:

Clique em OmegaAI.



Agora você verá a seção Bem-vindo ao OmegaAI.



Digite seu endereço de e-mail.
Clique em “Continuar”.
Agora você verá a seção Inserir PIN. Digite seu PIN.



Clique em “Continuar”. Agora você fez login com sucesso no OmegaAI e será direcionado para a página inicial do OmegaAI.



## Procedimento de MFA Aplicado a Múltiplos Cenários de Login

O fluxo de login com MFA difere conforme os cenários exibidos nos diagramas abaixo.
- Login via Navegador Comum



- Login via Navegador Anônimo (sem fechar o navegador)



- Login via Navegador Anônimo (fechando o navegador)



- Login com Navegador Diferente



- Login com Endereço IP Diferente



- Login com Dispositivo Diferente



- Login via Impressão Digital de OTP



## Como evitar ter que realizar o MFA toda vez que fizer login

Nota: Os gatilhos do MFA são rastreados pelo armazenamento local do navegador.

No entanto, em alguns casos, as configurações de segurança do navegador são configuradas para excluir os dados armazenados no armazenamento local do navegador (conforme mostrado abaixo), exigindo que o usuário realize o MFA toda vez que fizer login no OmegaAI.

### Solução

Acesse as configurações do seu respectivo navegador (por exemplo, Chrome) e siga os passos abaixo:
- Selecione Privacidade e Segurança no menu de navegação à esquerda.
- Selecione Configurações do site.
- Selecione a antepenúltima opção da lista Dados do site no dispositivo.
- Selecione a primeira opção Permitir que sites salvem dados no dispositivo.

Seus dados de login agora serão armazenados no armazenamento local do navegador, não acionando mais uma solicitação de MFA.