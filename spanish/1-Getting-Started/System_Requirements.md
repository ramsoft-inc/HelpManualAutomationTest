---
sidebar_position: 1
title: Requisitos do Sistema
tags:
  - Especificações
  - Configurações de Navegador
  - Recomendações de Hardware
---

# Requisitos do Sistema

## Especificações de Hardware para Usuário Geral:

| Requisito        | Especificação            |
| ---------------- | ----------------------- |
| **CPU**          | CPU Quad-Core           |
| **RAM**          | 16 GB                   |
| **Armazenamento Livre** | 50 GB SSD         |
| **Tela**         | Resolução de 1920 x 1080 ou superior |

## Especificações de Hardware para Visualizador de Imagens

| Requisito        | Especificação                                                    |
| ---------------- | ---------------------------------------------------------------- |
| **CPU**          | CPU moderno de 8 núcleos (ex: Intel i7/i9, AMD Ryzen 7/9)        |
| **RAM**          | 32 GB                                                            |
| **Placa de Vídeo** | GPU dedicada com pelo menos 4 GB de VRAM (ex: NVIDIA GTX 1060) |
| **Tela**         | Resolução de 2560 x 1440 ou superior, calibrada para uso médico   |
| **Armazenamento Livre** | Pelo menos 100 GB SSD (unidade usada para cache do navegador) |
| **Rede**         | Conexão Ethernet cabeada de 1 Gbps                               |

## Requisitos de Software

| Requisito           | Especificação                                    |
| ------------------- | ------------------------------------------------ |
| **Sistema Operacional** | Windows 10 ou superior, macOS Catalina ou superior |
| **Navegador**           | Versão mais recente do Chrome, Edge ou outros navegadores baseados em Chromium |
| **Plugins/Add-ons**     | HTML5 e JavaScript habilitados para funcionalidade completa |
| **Configurações do Navegador** | Habilitar aceleração de hardware para melhor renderização e processamento de imagens |

## Considerações sobre o Navegador

| Especificação                             | Detalhes                                             |
| ----------------------------------------- | ---------------------------------------------------- |
| **Compatibilidade do Navegador**          | O software é compatível exclusivamente com navegadores baseados em Chromium. |
| **Versão do Navegador**                   | Certifique-se de usar a versão estável mais recente do navegador. Evite versões experimentais ou beta. |
| **Armazenamento de Credenciais & Cache**  | Cookies e Armazenamento Local devem estar habilitados para armazenar credenciais de login e preferências. |
| **Nível de Zoom do Navegador**            | Certifique-se de que o nível de zoom esteja em 100%, a menos que ajustes sejam necessários para monitores de baixa resolução. |
| **Utilização da GPU**                     | Certifique-se de que a aceleração de hardware esteja habilitada nas configurações do navegador (Chrome: `chrome://settings/system`). |
| **Conexão e Velocidade de Internet**      | A velocidade mínima recomendada de download é 100 Mbps. Verifique a velocidade real da internet usando ferramentas como o Speedtest da Ookla. |
| **Uso de VPN**                            | Avalie se o uso de VPN é necessário, pois pode impactar o desempenho. Se possível, configure para ignorar o VPN ao usar a plataforma. |
| **Problema com GPU Intel**                | Se ocorrerem problemas de renderização com GPUs Intel específicas, acesse `chrome://flags/#ignore-gpu-blocklist` e ative 'ignore-blacklist'. Configure o navegador para configurações Angle compatíveis em `chrome://flags/#use-angle`. |

## Problema com GPU Intel: Problemas de Renderização no Chrome

Usuários com determinados modelos de GPU Intel podem encontrar problemas de renderização no Visualizador de Imagens OmegaAI.

### Passos para Solução:

1. **Verifique o Status da Blacklist da GPU:** 
   - Acesse `chrome://flags/#ignore-gpu-blocklist` e ative 'ignore-blacklist’.
2. **Configure o Navegador para Configurações Angle Compatíveis:** 
   - Visite `chrome://flags/#use-angle`.
   - Selecione uma configuração angle compatível (opções: d3d11on12, vulkan e OpenGL).

### Recomendações Adicionais para Usuários de Mac:
- Mantenha as configurações Angle padrão.

## Guia de Configuração do Navegador

### Compatibilidade e Requisitos do Navegador

Nosso software é compatível apenas com navegadores baseados em Chromium, incluindo Google Chrome, Microsoft Edge e Opera. Estes navegadores fornecem as funcionalidades e compatibilidades necessárias.

### Versão do Navegador

Revise regularmente a versão do seu navegador para garantir que está atualizada, mas evite versões experimentais ou beta.

### Armazenamento de Credenciais & Cache

É essencial que o navegador aceite cookies e permita o armazenamento local para guardar credenciais de login e preferências.

#### Google Chrome

1. Abra as Configurações no menu.
2. Clique em “Mostrar configurações avançadas”.
3. Em Privacidade, selecione 'Configurações de conteúdo'.
4. Habilite 'Permitir que os dados locais sejam definidos (Recomendado)' e desabilite 'Bloquear cookies e dados de sites de terceiros'.
5. Clique em Concluído.

#### Microsoft Edge

1. Selecione **Mais** (...) > **Configurações** > **Exibir configurações avançadas**.
2. Em **Cookies**, selecione **Não bloquear cookies**.

### Configuração Multimonitor

Para usar o sistema em um ambiente multimonitor, é necessário garantir que o navegador tenha as permissões adequadas. Isso é feito por meio do gerenciamento de janelas, que será solicitado pelo navegador após o primeiro login do usuário. Caso tenha selecionado "não", é possível alterar isso clicando no ícone de informações do site (lado esquerdo da barra de endereços do navegador).



Depois, certifique-se de que o gerenciamento de janelas está permitido:


### Nível de Zoom do Navegador

Garanta que o nível de zoom do navegador esteja ajustado corretamente. Níveis de zoom incorretos podem impactar a exibição da interface do usuário.


### Escala e Resolução de Tela

Utilize os valores recomendados para escala e resolução de tela conforme sugerido pelo sistema operacional.



### Utilização da GPU para Visualizador de Imagens

Garanta que a aceleração de hardware esteja habilitada no navegador para melhor renderização e processamento de imagens.

- Chrome: Navegue até `chrome://settings/system`.


### Controles de Acesso

Verifique se o OmegaAI possui as permissões necessárias.

- Microfone (para gravação de voz e soluções de VR)
- Gerenciamento de janelas (para modo multimonitor)
- Downloads automáticos (para baixar estudos ou gravar em CD)
- Revise as Configurações do Site para alterações em relação ao padrão em `chrome://settings/content/siteDetails?site=https://www.omegaai.com`.

### Conexão e Velocidade de Internet

Verifique sua velocidade de internet usando ferramentas como o Speedtest da Ookla (https://www.speedtest.net/). Recomendamos uma velocidade de download de 50-100 Mbps. Observe que baixas velocidades de upload ou valores altos de ping podem resultar em problemas de desempenho.

### Uso de VPN

Reveja a necessidade de uso de VPN, pois pode afetar o desempenho. Se possível, considere ignorar o VPN para o OmegaAI, pois a comunicação do OmegaAI já é segura e utiliza os métodos de criptografia web mais recentes.