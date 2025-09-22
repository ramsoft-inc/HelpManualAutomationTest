---
sidebar_position: 5
title: Recursos de Reconhecimento de Voz e Comando de Voz
tags:
  - Reconhecimento de Voz
  - Comando de Voz
  - Macros de RV
  - Speech Mike
  - Integração com ChatGPT
  - Augnito VR
  - Barra de Formatação
---

# Recursos de Reconhecimento de Voz e Comando de Voz

## Visão Geral

O OmegaAI integra recursos avançados de reconhecimento e comando de voz, permitindo que os usuários naveguem e insiram dados por meio da voz, aumentando a eficiência e a acessibilidade. Este recurso é benéfico para profissionais de saúde que precisam de operação mãos-livres enquanto se concentram no cuidado ao paciente.

## Reconhecimento e Comando de Voz

### Ativando o Reconhecimento de Voz

1. Clique no ícone de círculo localizado no canto superior direito da janela principal para ativar o reconhecimento de voz.

2. Fale o comando, como "Criar Relatório", para executar ações específicas.

3. Dicte o conteúdo que precisa ser incluído no documento; o texto falado será transcrito diretamente no editor.

4. Para desativar ou colocar o reconhecimento de voz em modo de espera, passe o mouse sobre o ícone e clique no botão de cancelar.

## Configuração e Uso de Macros de RV

1. **Acessando Macros de RV:**

   - Navegue até seu Perfil pelo painel de navegação à esquerda.

   - Selecione Configurações do Usuário e clique no botão Macro dentro da seção de miniaturas.

   - Escolha o idioma no menu suspenso no canto superior direito.

2. **Criando e Gerenciando Macros:**

    - Clique no ícone de Comando + para adicionar uma nova macro.

    - Selecione a função desejada (Ação ou Texto) no menu suspenso.

    - Defina a palavra ou frase de ativação e associe-a a uma ação ou entrada de texto específica.

    - Confirme e salve as configurações clicando na marca de seleção à direita.

    - As macros podem ser editadas ou excluídas conforme necessário neste menu.

3. **Usando Macros na Prática:**

    - No Visualizador de Documentos ou na Lista de Trabalho, ative o botão de Reconhecimento de Voz.

    - Fale o texto ou comando predefinido. O sistema executará a ação ou exibirá o texto com base na macro definida.

## Integração com Speech Mike

- **Philips Speech Mike:** Certos dispositivos Speech Mike são suportados pelo OmegaAI para entrada de voz. Use o botão "Detectar Mike" para conectar o Speech Mike.

  **Configuração do Registro para conceder permissão à API WebHID**

  **Chrome**

  1. Navegue até o seguinte caminho no registro:

     Computador\HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome

  2. Crie um novo Valor de Cadeia de Caracteres:

    - Nomeie o valor: WebHidAllowAllDevicesForUrls

  3. Clique duas vezes no novo valor de cadeia criado e atualize o campo de dados do valor com o seguinte:

     \[ "https://www.omegaai.com", "https://pre-us01.omegaai.com" \]

  4. Para verificar se a política foi aplicada:

    - Abra o Chrome e vá para chrome://policy/.

    - Verifique se a política WebHidAllowAllDevicesForUrls está listada e corretamente configurada.

    **Edge:**

    1. Navegue até o seguinte caminho no registro:

    Computador\HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge

    2. Crie um novo Valor de Cadeia de Caracteres:

      - Nomeie o valor: WebHidAllowAllDevicesForUrls

    3. Clique duas vezes no novo valor de cadeia criado e atualize o campo de dados do valor com o seguinte:

       \[ "https://www.omegaai.com", "https://pre-us01.omegaai.com" \]

    4. Para verificar se a política foi aplicada:

    - Abra o Edge e vá para edge://policy/.

    - Verifique se a política WebHidAllowAllDevicesForUrls está listada e corretamente configurada.

    **Atualizador de Registro do Windows para OmegaAI Produção**

    Set-Omegaai-WebHIDPolicy.reg

    Siga os passos abaixo para atualizar as configurações do registro para produção do OmegaAI:

    1.**Baixe o Arquivo de Registro**

    - Baixe o arquivo Set-Omegaai-WebHIDPolicy.reg fornecido acima e salve-o em sua máquina local.

    2.**Execute o Arquivo de Registro**

    - Clique duas vezes no arquivo Set-Omegaai-WebHIDPolicy.reg para iniciar a atualização do registro.

    3. **Confirme a Atualização do Registro**

    - Quando solicitado, clique em **Sim** para confirmar que deseja atualizar seu registro.

    4.**Mensagem de Sucesso**

    - Você deve receber uma mensagem de sucesso indicando que seu registro foi atualizado com sucesso.

## Integração com ChatGPT

- **Correção de Erros:** O ChatGPT funciona em segundo plano para corrigir erros gramaticais, de vocabulário e articulação durante a digitação por voz e o uso de macros, garantindo documentação precisa e profissional.

## Formatação e Integração com Augnito

1. **Barra de Formatação:**

    - Utilize a barra de formatação ao criar macros de texto para aplicar uma formatação consistente. Esta formatação persiste quando o conteúdo é copiado ou adicionado a um relatório.

2. **Configuração do Augnito VR:**

    - No menu de navegação à esquerda, vá para Meu Perfil e depois para Configurações do Usuário.

    - Clique no botão Comando de Voz e selecione o sotaque desejado no menu suspenso.

    - No Visualizador de Documentos, abra o registro do paciente e o modelo necessário.

    - A barra de ferramentas exibirá "Voice Dictation Powered by Augnito". O cursor estará posicionado no topo por padrão.

    - Ative a digitação por voz clicando no botão Comando de Voz e comece a ditar as informações campo a campo.

    - Para encerrar a gravação, desative o ícone de Comando de Voz.
  
<br/>**Criar/Editar Relatório RadPair**

1. Vá para o Painel do Visualizador de Documentos.

2. Clique na opção Criar Relatório no canto superior esquerdo.

3. Abra a interface Radpair automaticamente, desde que o usuário tenha a licença Radpair.

4. Clique em Gravar dentro da interface Radpair.

    O Cabeçalho e o Rodapé permanecem os mesmos, mas o corpo do relatório deve ser substituído pelo conteúdo do RadPair.

    O modelo será selecionado automaticamente com base no código do procedimento e em alguns critérios predefinidos. Caso contrário, o usuário deve selecionar manualmente os valores conforme sua necessidade.

6. Clique no botão PARAR para interromper a gravação.

7. Clique no botão Aprovar e Editar para processar o relatório ou clique no botão Assinar para concluir o relatório.

<br/>**Uso do Speech Mic com Radpair**

O usuário conecta o Speech Mic ao dispositivo e a cor do indicador LED muda de vermelho para verde. Speech Mics compatíveis garantem uso contínuo com a solução Radpair Voz-para-Texto.

**Iniciar Gravação**

1. O usuário está no Visualizador de Documentos e possui um dispositivo Speech Mic conectado.

2. Clique no botão Iniciar.

3. A gravação começa.

**Parar Gravação**

1. O usuário está no Visualizador de Documentos e possui um dispositivo Speech Mic conectado.

2. Clique no botão Parar Gravação.

3. A gravação é interrompida.

**Processar Relatório**

1. O usuário está no Visualizador de Documentos e possui um dispositivo Speech Mic.

2. Clique no EOL no Speech Mic.

3. O relatório é processado.

**Assinar Relatório**

1. O usuário está no Visualizador de Documentos e possui um dispositivo Speech Mic conectado.

2. Clique duas vezes no botão EOL.

3. O relatório é assinado.

**Campos Anterior e Próximo**

1. O usuário está no Visualizador de Documentos e possui um dispositivo Speech Mic conectado.

2. Clique no botão Avançar Rápido.

3. O usuário avança para a Próxima Variável [] (o cursor deve se mover para dentro do colchete).

1. O usuário está no Visualizador de Documentos e possui um dispositivo Speech Mic conectado.

2. Clique no botão Retroceder.

3. O usuário retorna para a Variável Anterior [] (o cursor deve se mover para dentro do colchete).

**Rascunho de Relatório**

1. O usuário está no Visualizador de Documentos e possui um dispositivo Speech Mic conectado.

2. O usuário inicia a digitação e o relatório é processado.

3. Clique no botão Ins/Ovr para salvar o relatório como rascunho.