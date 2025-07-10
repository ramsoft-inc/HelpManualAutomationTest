---
sidebar_position: 3
title: Barra de Ferramentas do Visualizador de Imagens
tags:
  - Seletor de Layout
  - Protocolos de Exibição
  - Viewport
  - Configuração
  - Estudos de Mamografia
---
# Barra de Ferramentas do Visualizador de Imagens

## Usando o Seletor de Layout no OmegaAI

O Seletor de Layout é um recurso poderoso dentro do Visualizador de Imagens OmegaAI que permite aos usuários personalizar o arranjo dos viewports de acordo com suas necessidades específicas. Esta ferramenta é acessível pela barra de ferramentas e oferece opções para gerenciar protocolos de visualização padrão e específicos para mamografia.

### Acessando o Seletor de Layout

1.  **Abrindo o Seletor de Layout:**

    - Clique na opção "Seletor de Layout" na barra de ferramentas.

    - Isso exibirá uma grade de três por três com o layout de viewport atual destacado em azul.

### Personalizando Layouts de Viewport

1.  **Ajustando o Número de Viewports:**

    - Aumente ou diminua o número de viewports exibidos no monitor arrastando os viewports visíveis no seletor de layout para a esquerda, direita, para baixo ou para cima.

    - Você pode configurar até uma grade de 8x8 em cada um dos seus monitores.

2.  **Aplicando Protocolos de Exibição (Hanging Protocols):**

    - À direita do seletor de layout, há uma gaveta que exibe os protocolos de exibição disponíveis para o estudo selecionado.

    - Selecione o protocolo desejado clicando com o botão esquerdo sobre ele.

    - Em uma configuração de monitor único, selecionar um protocolo de exibição afetará apenas o monitor atual. Em uma configuração multi-monitor, será aplicado a todos os monitores conectados.

## Recurso de Window Level

O **Window Level** no OmegaAI permite aos usuários ajustar o brilho e o contraste das imagens médicas, aprimorando a visibilidade de estruturas anatômicas e lesões. Este recurso é crucial para radiologistas, pois ajuda a destacar detalhes em tecidos ou regiões de interesse específicas. As configurações de Window Level incluem ajustes personalizados, Auto Window Level, ajustes Sigmoid e predefinições de window level, todos projetados para oferecer flexibilidade e otimizar a visualização conforme as necessidades do estudo.

---

### Ativação do Modo Window Level

1. **Condição Inicial**: Navegue até uma imagem carregada dentro do Visualizador de Imagens.
2. **Ativando Ajustes de Window Level**:
   - Acesse a **ferramenta Window Level** na barra de ferramentas superior ou no painel de ajustes.
   - Após a seleção, os usuários podem ajustar manualmente os parâmetros de window e level arrastando o mouse sobre a imagem, ajustando contraste e brilho conforme necessário.

---

#### Auto Window Level

A opção **Auto Window Level** foi projetada para eficiência, proporcionando um aprimoramento rápido sem ajustes manuais. Este recurso calcula e aplica o brilho e contraste ideais com base no histograma da imagem.

**Passos para Aplicar o Auto Window Level**:
Ao abrir o estudo, o "Auto Window Level" é aplicado automaticamente.
Para acessá-lo manualmente, o usuário pode seguir os seguintes passos:
1. Abra a ferramenta **Window Level** na seção de ajustes da barra de ferramentas ou roda.
2. Clique com o botão esquerdo no viewport e selecione **Auto Window Level** na lista de predefinições.
3. O sistema ajustará automaticamente as configurações da imagem para equilibrar brilho e contraste para a região de interesse selecionada, permitindo melhor visibilidade.

*Nota*: O Auto Window Level pode ser desativado a qualquer momento, revertendo a imagem para as configurações manuais anteriores ao "Reset to Default".

---

#### Ajuste Sigmoid para Window Level

O recurso **Ajuste Sigmoid** oferece uma opção de escala não linear para controlar brilho e contraste com mais precisão, especialmente para áreas com grande variação de densidade.

**Usando o Ajuste Sigmoid**:
1. Abra a ferramenta **Window Level** na seção de ajustes da barra de ferramentas ou roda.
2. Acesse a opção **Sigmoid** dentro das configurações de Window Level clicando com o botão esquerdo no viewport.
3. Os ajustes sigmoid são especialmente benéficos para diferenciação de tecidos complexos, oferecendo uma alternativa ao nivelamento linear ao enfatizar faixas de intensidade específicas.

*Caso de Uso Clínico*: Ajustes sigmoid podem ser usados em imagens de tecidos moles, onde o controle fino do contraste ajuda a destacar diferenças sutis de densidade.

*Nota*: Aplicado apenas nas modalidades DX, MG e CR.

---

#### Predefinições de Window Level

As predefinições de window level agilizam o processo de visualização, permitindo que os usuários apliquem configurações pré-definidas com um único clique. Radiologistas podem criar predefinições personalizadas, aplicar as padrão ou alternar rapidamente entre elas usando teclas de atalho para fluxos de trabalho eficientes.

**Criando uma Predefinição de Window Level**:
1. Abra a ferramenta **Window Level** na seção de ajustes da barra de ferramentas ou roda.
2. Clique com o botão esquerdo no viewport, selecione **Configurar Predefinições** e depois clique em **+** na seção de Configuração de Window Level que aparece no painel direito.
3. Atribua um nome à predefinição, com Window Width, Window Level e Modalidade, e salve. Esta predefinição aparecerá na lista de Predefinições para uso futuro.

**Aplicando Predefinições com Teclas de Atalho**:
1. Os usuários podem atribuir teclas de atalho a cada predefinição, permitindo alternância rápida.
2. No menu **Configuração de Window Level**, navegue até **Alterar Teclado Numérico** correspondente a cada Predefinição disponível no Menu sob o botão "3 pontos".
3. Para definir a "Tecla de Atalho", o usuário deve pressionar a tecla desejada e depois clicar no botão "Tick".
4. Uma vez definido, pressionar a tecla de atalho aplicará instantaneamente a predefinição escolhida.

**Implementando Predefinições de Window Level**:
- Os usuários podem aplicar predefinições em vários estudos ou séries, permitindo configurações de visualização consistentes para estudos similares. Predefinições são particularmente úteis para padronizar o window level para órgãos ou patologias específicas.

### Gerenciando Protocolos de Exibição (Hanging Protocols)

1.  **Criando um Novo Protocolo de Exibição:**

    - Clique no ícone **+** para começar a criar um novo protocolo de exibição baseado em suas preferências de layout atuais.

    - Alternativamente, configure o layout desejado e clique em **Salvar** para preservar este arranjo como um novo protocolo de exibição.

2.  **Protocolos Específicos para Mamografia:**

    - Ao visualizar estudos de mamografia, você terá acesso a 11 protocolos de exibição padrão pré-definidos para mamografia.

    - Estes podem ser selecionados e aplicados para aprimorar a visualização de imagens mamográficas.

# Personalizando a Barra de Ferramentas no OmegaAI

## Visão Geral da Barra de Ferramentas
O recurso de Personalizar Barra de Ferramentas no OmegaAI permite aos usuários personalizar o layout da barra de ferramentas para otimizar seu fluxo de trabalho no Visualizador de Imagens. Este guia explica como acessar e ajustar as configurações da barra de ferramentas, gerenciar ferramentas em categorias distintas e aplicar personalizações em diferentes monitores.

## Acessando o Recurso de Personalizar Barra de Ferramentas

  **Navegue até Personalizar Barra de Ferramentas:**
    -	Abra o Visualizador de Imagens.
    -	Clique na seção "Mais" (3 pontos) na barra de navegação principal.
    -	Selecione "Configurações" no menu suspenso.
    -	Clique no botão "Personalizar Barra de Ferramentas" para entrar no modo de edição.
      
## Entendendo as Seções da Barra de Ferramentas

**A barra de ferramentas é organizada em três seções principais:**
- **Ferramentas de Marcação:**
   - Ferramentas disponíveis: Ângulo, Anotação, Bidirecional, CTR, Arrastar Sonda, Rotulagem da Coluna, Comprimento, ROI (ROI Retangular, ROI Circular, ROI Livre), Linha de Prumo.
- **Ferramentas de Ajuste:**
   - Ferramentas incluídas: Ponteiro de Crosshair, Pan, Rotacionar, Zoom, Espelhar, Inverter, Ampliar, Quad Zoom, Shutter, Rolagem de Pilha, Window Level.
- **Ferramentas Adicionais:**
  - Recursos incluem: Cine, Fusão, Imprimir, MPR, Imagem-Chave, Modo Grade, Vincular, Copiar, Download (Download de Estudo e Download de Imagem), Burn Study
    
## Personalizando Sua Barra de Ferramentas

**1.	Adicionando e Removendo Ferramentas:**

   - Para adicionar uma ferramenta à barra de ferramentas, arraste-a da seção de edição para a seção superior do cabeçalho.
   - Para remover uma ferramenta, clique no botão de cruz ao lado da ferramenta na barra de ferramentas.

**2.	Salvando Alterações:**
   - Para salvar as alterações, clique no botão de cruz ao final do painel, permitindo acesso imediato à barra de ferramentas personalizada.

**3.	Reiniciando Alterações:**
   - Os usuários podem desfazer alterações ou redefinir a barra de ferramentas para as configurações padrão, se necessário.

### Gerenciando Ferramentas Padrão e Essenciais

Certas ferramentas como Protocolo de Exibição, Resetar, Concluir, Concluir & Próximo, e a seção Mais com o ícone de Microfone (para Transcrições) e o botão Compartilhar são fixas e não podem ser removidas devido ao seu papel essencial na funcionalidade do software.

### Personalização Multi-Monitor

Usuários podem configurar uma barra de ferramentas diferente para cada monitor no modo monitor, atendendo às necessidades específicas de cada tela.

### Disponibilidade de Ferramentas Baseada na Modalidade

Ferramentas não aplicáveis para a modalidade ativa no viewport são automaticamente desativadas, garantindo acesso apenas às ferramentas relevantes.

### Comportamento da Ferramenta Crosshair nos Modos MPR e Fusão

Nos **modos MPR e Fusão** em estudos PET/CT, a **ferramenta Crosshair** é especificamente habilitada para navegação e alinhamento precisos entre diferentes visualizações.

- **Disponibilidade**: Quando o modo Fusão ou MPR é ativado, a ferramenta Crosshair aparece automaticamente em estado ativo na barra de ferramentas superior, tornando-se facilmente acessível para marcação nesses modos especializados.
- **Exibição Restrita**: Fora dos modos Fusão e MPR, a ferramenta Crosshair fica oculta na barra de ferramentas superior. Os usuários verão apenas o ponteiro crosshair para navegação básica.

## Ferramentas de Ajuste

**Ferramenta Pan**

- **Uso**: Move a imagem dentro do viewport.

- **Operação**: Segure o botão esquerdo do mouse e arraste.

- **Atalhos**: 'T' (Windows/Mac)

- **Utilidade Clínica**: Permite exame detalhado navegando por imagens grandes ou detalhadas.

**Ferramenta Stack Scroll**

- **Uso**: Para navegar por séries de imagens multiframe.

- **Operação**: Movimento vertical do mouse.

- **Atalhos**: 'S' (Windows/Mac)

- **Utilidade Clínica**: Crucial para visualizar imagens sequenciais em modalidades como RM ou TC.

**Ferramenta Window Level**

- **Uso**: Ajusta brilho e contraste.

- **Operação**: Movimentos horizontais e verticais do mouse ajustam brilho e contraste, respectivamente.

- **Atalhos**:  'W' (Windows/Mac)

- **Utilidade Clínica**: Otimiza a visualização da imagem para destacar diferentes tecidos ou anomalias.

**Ferramenta Crosshair**

- **Uso**: Alinha pontos anatômicos idênticos em diferentes planos.

- **Atalhos**: 'J' (Windows/Mac)

- **Utilidade Clínica**: Facilita estudos precisos em cortes transversais em cenários de imagem multiplanar.

**Rotação Livre**

- **Uso**: Gira a imagem livremente dentro do viewport.

- **Operação**: Clique e arraste para girar; clique único para ângulos predefinidos.

- **Utilidade Clínica**: Útil para ajustar a orientação da imagem para posições anatômicas padrão.

**Zoom**

- **Uso**: Altera a escala da imagem dentro do viewport.

- **Operação**: Clique direito e arraste para dar zoom.

- **Atalhos**: 'Z' (Windows/Mac).

- **Utilidade Clínica**: Essencial para examinar detalhes como microcalcificações ou estruturas finas de tecido.

**Ampliador**

- **Uso**: Amplia uma área específica da imagem.

- **Atalhos**: 'M' (Windows/Mac).

- **Utilidade Clínica**: Melhora a visibilidade de características pequenas ou sutis dentro de uma imagem.

**Inverter**

- **Uso**: Inverte as cores da imagem.

- **Atalhos**: ''\” (Windows/Mac)

- **Utilidade Clínica**: Pode melhorar a legibilidade de certos tipos de imagem ao alterar o contraste do fundo.

**Shutter**

- **Uso**: Mascara partes indesejadas da imagem.

- **Atalhos**:  '' (Windows/Mac)

- **Utilidade Clínica**: Foca a atenção do visualizador em uma parte específica da imagem ao obscurecer distrações.

**Quad**

- **Uso**: Específico para mamografia, amplia cada quadrante da imagem sequencialmente.

- **Atalhos**: 'K' (Windows/Mac)

- **Utilidade Clínica**: Facilita o exame detalhado de cada quadrante na imagem mamográfica.

**Espelhar Vertical/Horizontal**

- **Uso**: Capacidade de espelhar a imagem vertical ou horizontalmente.

- **Atalhos**: 'F' para vertical, 'H' para horizontal 

- **Utilidade Clínica**: Útil para corrigir a orientação para melhor correlação e interpretação anatômica.

## Ferramentas de Marcação

**Medição de Comprimento**

- **Uso**: Mede a distância entre dois pontos na imagem.

- **Atalhos**: 'D' (Windows/Mac).

- **Utilidade Clínica**: Utilizado para medir estruturas anatômicas ou tamanhos de lesões, auxiliando no diagnóstico e planejamento do tratamento.

**Medição de Ângulo**

- **Uso**: Calcula o ângulo entre duas linhas que se cruzam.

- **Atalhos**: 'A' (Windows/Mac).

- **Utilidade Clínica**: Importante para avaliações ortopédicas, como medir deformidades angulares.

**Linha de Prumo**

- **Uso**: Desenha uma linha de referência vertical.

- **Atalhos**: '\|' (símbolo de pipe, Windows/Mac).

- **Utilidade Clínica**: Auxilia na avaliação de alinhamentos estruturais, especialmente em imagens da coluna.

**ROI (Retangular, Elíptico, Livre)**

- **Uso**: Desenha regiões de interesse para análise quantitativa.

- **Atalhos**: 'G' para retangular, 'E' para elíptico, ';' para livre (Windows/Mac).

- **Utilidade Clínica**: Permite avaliação quantitativa de áreas da imagem, como cálculo de volume tumoral ou densidade tecidual.

**Sonda (Probe)**

- **Uso**: Coloca um marcador que exibe dados quantitativos sobre a imagem naquele ponto.

- **Atalhos**: 'Q' (Windows/Mac).

- **Utilidade Clínica**: Usado em TC para mostrar unidades Hounsfield, crucial para avaliação de densidades teciduais.

**Arrastar Sonda**

- **Uso**: Semelhante à ferramenta Sonda, mas sem deixar uma marca persistente.

- **Atalhos**: 'X' (Windows/Mac).

- **Utilidade Clínica**: Permite verificações temporárias de diferentes áreas sem alterar a imagem.

**Relação Cardiotorácica**

- **Uso**: Mede a razão entre a largura da silhueta cardíaca e a largura do tórax.

- **Atalhos**: ';' (Windows/Mac).

- **Utilidade Clínica**: Importante na avaliação de aumento cardíaco em radiografias de tórax.

**Ferramenta Bidirecional**

- **Uso**: Coloca duas linhas perpendiculares e mede seu comprimento.

- **Atalhos**: 'B' (Windows/Mac).

- **Utilidade Clínica**: Útil para medir dimensões de lesões ou outras estruturas em estudos radiográficos.

**Ângulo de Cobb**

- **Uso**: Mede o ângulo entre duas linhas não paralelas, colocadas separadamente (sem interseção no viewport), tipicamente usado para avaliações de escoliose.

- **Atalhos**: 'Ctrl+A' (Windows/Mac).

- **Utilidade Clínica**: Fundamental para avaliar alinhamento e curvatura da coluna.

**Rotulagem da Coluna**

- **Uso**: Rotula vértebras em imagens da coluna para facilitar identificação e laudos.

- **Utilidade Clínica**: Melhora a precisão e clareza na documentação de estudos da coluna.

**Anotação**

- **Uso**: Permite a adição de anotações de texto e setas nas imagens. A seta pode ser usada sem adicionar texto.
  
---

## Ferramentas Adicionais

**Burn Study**

- **Uso**: Permite a adição de uma marca ou rótulo permanente em uma imagem para indicar uma área específica de interesse.

- **Atalhos**: Nenhum

- **Utilidade Clínica**: Útil para marcar áreas que requerem atenção especial, como achados anormais ou regiões de interesse em estudos de acompanhamento.

**Cine**

- **Uso**: Reproduz uma série de imagens como uma animação contínua ou filme.

- **Atalhos**: 'Ctrl + Setas' (Windows/Mac)

- **Utilidade Clínica**: Ideal para revisar dados de imagens dinâmicas, como estruturas em movimento ou fluxo de fluidos em estudos como RM ou angiotomografia.

**Copiar**

- **Uso**: Copia a imagem ou área selecionada para uso em outra visualização ou documento.

- **Atalhos**: 'Ctrl + C' (Windows), 'Cmd + C' (Mac)

- **Utilidade Clínica**: Útil para compartilhar dados de imagem ou comparar seções em diferentes visualizações.

**Download**

- **Uso**: Faz o download da imagem selecionada ou conjunto de imagens para o sistema local.

- **Atalhos**: Nenhum

- **Utilidade Clínica**: Facilita o salvamento de imagens para análise offline, laudos ou compartilhamento com sistemas externos.

**Fusão (Fusion)**

- **Uso**: Combina imagens de diferentes modalidades (por exemplo, RM e TC) em uma única visualização para análise abrangente.

- **Atalhos**: Nenhum

- **Utilidade Clínica**: Ajuda a fornecer uma visão mais completa da condição do paciente, aumentando a precisão diagnóstica.

**Imagem-Chave (Key Image)**

- **Uso**: Destaca uma imagem ou quadro específico dentro de uma série como referência ou ponto de interesse.

- **Atalhos**: Nenhum

- **Utilidade Clínica**: Útil para enfatizar imagens críticas em uma série, especialmente em estudos multiframe ou para destacar características anatômicas importantes.

**Vincular (Link)**

- **Uso**: Vincula múltiplas imagens ou séries para visualização sincronizada.

- **Atalhos**: Nenhum

- **Utilidade Clínica**: Essencial para comparar imagens de diferentes momentos, modalidades ou regiões anatômicas simultaneamente.

**MPR (Reconstrução Multiplanar)**

- **Uso**: Reconstrói imagens em múltiplos planos (axial, coronal, sagital) a partir de um conjunto de dados 3D.

- **Atalhos**: Nenhum

- **Utilidade Clínica**: Vital para visualizar dados tridimensionais em múltiplas perspectivas, auxiliando na localização e diagnóstico precisos.

**Imprimir**

- **Uso**: Envia a imagem selecionada para uma impressora ou a prepara para impressão em formato específico.

- **Atalhos**: 'Ctrl + P' (Windows), 'Cmd + P' (Mac)

- **Utilidade Clínica**: Permite cópias físicas de imagens para revisão, documentação do paciente ou compartilhamento com outros profissionais de saúde.

**Modo Grade (Tile Mode)**

- **Uso**: Exibe múltiplas imagens lado a lado em um layout em grade.

- **Atalhos**: Nenhum

- **Utilidade Clínica**: Ideal para revisar múltiplas imagens relacionadas ou comparar visualizações de diferentes modalidades, como comparar cortes de TC ou visualizar múltiplas vistas de mamografia.
  
## Salvando Personalizações

- **Aplicar e Salvar Alterações:**

  - Após configurar as ferramentas e atalhos conforme desejado, clique no botão "Salvar" para aplicar as alterações.

  - As personalizações são salvas no seu perfil de usuário e não afetam outros usuários do sistema.

## Melhores Práticas

- Atualize regularmente suas configurações de ferramentas para corresponder às necessidades atuais do seu fluxo de trabalho.

- Escolha atalhos que sejam intuitivos e fáceis de lembrar, mas que não interfiram com outros atalhos comumente usados.