---
sidebar_position: 7
title: Anotações de Sobreposição Personalizadas no OmegaAI
tags:
  - Personalizar Sobreposição
  - Configurações de Exibição
  - Anotações
  - Janela de Visualização
  - Tags DICOM
---
# Personalize Anotações de Sobreposição no OmegaAI

## Visão Geral

O OmegaAI oferece um recurso sofisticado que permite aos usuários personalizar
as anotações de sobreposição nas imagens. Este guia irá orientá-lo
no acesso e configuração das anotações de sobreposição para aprimorar suas
necessidades de visualização. A interface de personalização de sobreposição suporta
ajustes detalhados para cada lado da janela de visualização da imagem, juntamente com
opções para alteração de fonte e cor.

## Acessando as Configurações de Personalização de Sobreposição

1.  **Abrir Mais Opções**: Comece navegando até o menu 'Mais Opções'
    dentro da interface do software OmegaAI.

2.  **Configurações de Exibição**: No menu 'Mais Opções', selecione 'Configurações
    de Exibição'.

3.  **Personalizações de Sobreposição**: Dentro de 'Configurações de Exibição', escolha
    'Personalizações de Sobreposição'. Isso o levará para a tela de personalização.

## Personalizando os Lados da Janela de Visualização

Você pode personalizar as anotações em qualquer um dos oito lados de cada
janela de visualização:

- Superior Esquerdo

- Superior

- Superior Direito

- Direito

- Inferior Direito

- Inferior

- Inferior Esquerdo

- Esquerdo

Para personalizar, basta clicar na área que deseja modificar. Aqui você pode:

- Adicionar texto livre.

- Selecionar entre anotações predefinidas.

- Excluir anotações existentes (se não forem necessárias).

## Anotações de Sobreposição Mínimas e Completas

- **Ajuste Automático**: Se o tamanho da janela de visualização for menor que 500
  pixels, o OmegaAI alterna automaticamente para sobreposições mínimas para garantir
  clareza e usabilidade.

- **Opção de Alternância**: Você pode alternar entre sobreposições mínimas e completas
  usando o interruptor localizado no canto superior esquerdo da tela de personalização.

## Configurações de Fonte e Cor

- **Seleção de Fonte**: Clique no nome do fazendeiro ao lado de 'Fonte do Sistema' no canto superior esquerdo da tela para alterar a fonte.

- **Ajuste de Cor**: Clique em 'Cor' para abrir uma paleta e selecionar
  sua cor preferida para as anotações. A cor escolhida será
  aplicada a todas as anotações em todas as janelas de visualização.

## Usando Tags DICOM

- **Integração de Tags**: Usando o símbolo de hashtag (#) no campo de anotação,
  você pode abrir um menu de pesquisa para localizar as tags DICOM disponíveis.

- **Adicionando Tags**: Digite a tag DICOM diretamente ou pesquise por ela para adicionar
  pontos de dados específicos às suas anotações. Essas tags podem incluir
  informações do estudo do paciente ou dados calculados que normalmente não estão disponíveis
  como dados DICOM.

## Lista de Anotações Formatadas

|**Palavra-chave (Nome)**|**Fonte do Valor**|**Formato Exibido**|
| :- | :- | :- |
|Centro e Largura da Janela|0028,1050 + 0028,1051|C+valor da tag-W+valor da tag<br/>exemplo:<br/>C150-W210|
|Nitidez & Grau de Máscara de Desfocagem |0016,004A + 310d,1020|<p>S+ valor da tag - U: + valor da tag</p><p>exemplo:</p><p>S122 - U444</p>|
|Kernel de Convolução|(0018,1210) |**CK:** + valor da tag|
|Matriz de Aquisição|0018,1310|**Matriz ACQ:** + valor da tag|
|Número de Médias|0018,0083|**NEX:** + valor da tag|
|Comprimento do Trem de Eco|0018,0091|**ETL:** +valor da tag|
|Tipo de Aquisição MR|00180023|**MAT:** + valor da tag|
|Nome da Sequência|00180024|**SEQ:** + valor da tag|
|Variação da Sequência |00180021|**SV:** + valor da tag|
|ID do Paciente|(0010,0020) |**PID:** + valor da tag|
|Data de Nascimento|(0010,0030)|**DOB:** + valor da tag|
|ID do Estudo|(0020,0010)|**SID:** + valor da tag|
|Número da Série|(0020,0011)|**S#:** +valor da tag|
|Sexo|0010,0040|**Sexo:** +valor da tag|
|Espessura do Corte: + “ mm”|(0018,0050)|**ST:** +valor da tag+ **mm**|
|Espaçamento Entre Cortes: |(0018,0088)|**SBS:** +valor da tag+ **mm**|
|Meio de Contraste|(0018,0010) |limitar a 30 caracteres|
|KVP|0018,0060|**KVP:** + valor da tag|
|Exposição|0018,1152|**Exp:** + valor da tag+ **mAs**|
|Tempo de Exposição |0018,1150|**ET:** + valor da tag+ **ms**|
|Força de Compressão|0018,11a2|**CF:** + valor da tag+ **N**|
|Diâmetro de Reconstrução |0018,1100|**RD:** + valor da tag+ **mm**|
|Dose no Órgão|0040,0316|<p>**OD:** + valor da tag+ **dGy**</p><p>máx. dois decimais</p>|
|Ângulo Primário do Posicionador|0018,1510 |<p>**PPA:** + valor da tag+ **° \{símbolo de grau\}**</p><p>máx. dois decimais</p>|
|Espessura da Parte do Corpo |0018,11a0|<p>**Thk:** + valor da tag+ **mm**</p><p>máx. dois decimais</p>|
|Tempo de Repetição |0018,0080|<p>**TR:** + valor da tag+ **ms**</p><p>máx. dois decimais</p>|
|Tempo de Eco|0018,0081|<p>**TE:** + valor da tag+ **ms**</p><p>máx. dois decimais</p>|
|Tempo de Inversão|0018,0082|<p>**TI:** + valor da tag+ **ms**</p><p>máx. dois decimais</p>|
|Tempo de Disparo|0018,1060|<p>**TD:** + valor da tag+ **ms**</p><p>máx. dois decimais</p>|
|Ângulo de Flip |0018,1314|<p>**Flip:** + valor da tag+ **° \{símbolo de grau\}**</p><p>máx. dois decimais</p>|
|Matriz de Aquisição|0018,1310|**Matriz:** + valor da tag|
|Número de Médias|00180083|**Excite:** + valor da tag|
|Comprimento do Trem de Eco|00180091|<p>**ETL:** + valor da tag</p><p>máx. dois decimais</p>|
|Largura de Banda do Pixel |00180095|<p>**BW:** + valor da tag+ **Hz**</p><p>máx. dois decimais</p>|
####

#### *Tags Especiais:*

**Tags Condicionais**

|**Palavra-chave (Nome)**|**Fonte do Valor**|**Formato Exibido**|
| :- | :- | :- |
|Idade|(0010,1010) se vazio, então calcular com base na diferença de tempo entre agora e (0010,0030) DOB|<p>(0010,1010) → sem formatação</p><p>se calculado, formato:</p><p>- \>2 anos: 25A</p><p>- 2 A: 1A, 6M</p><p>- \<1M: 25D</p>|
|Número da Instância|(0020,0013)/contagem total de frames (0028, 0008)|25/125|
|Localização do Corte|(0020,1041), se presente, senão Posição da Mesa (0018,9327), se presente, senão um valor derivado de Posição da Imagem (Paciente) (0020,0032) |<p>**SL:** +valor da tag+ **mm**</p><p>máx. dois decimais</p>|
|Indicador Atual ou Prévio|<p>Se estudo atualmente aberto mostrar: **Atual**</p><p>Se outros estudos para o paciente, mostrar: **Prévio**</p>|**Atual** ou **Prévio**|

**Tags de Data/Hora:**

|**Palavra-chave (Nome)**|**Fonte do Valor**|**Formato Exibido**|
| :- | :- | :- |
|**Aquisição**|<p>(0008,002A), se presente, </p><p>senão </p><p>Data de Aquisição (0008,0022) e Hora de Aquisição (0008,0032) se presentes, </p><p>senão </p><p>Data de Conteúdo (0008,0023) e Hora de Conteúdo (0008,0033), </p>|<p>**Acq: mm-dd-aaaa + hora** </p><p>Exemplo:</p><p>Acq: 1982-21-2 23:32</p>|
|**Data do Estudo**|<p>Data do Estudo (0008,0020) e Hora do Estudo (0008,0030)} </p><p>senão</p><p>Data da Série (0008,0021) e Hora da Série 1000 (0008,0031)</p>|**mm-dd-aaaa + hora** |

**Tags Inalteradas:**

|**Palavra-chave (Nome)**|**Fonte do Valor**|**Formato Exibido**|
| :- | :- | :- |
|Comentários do Estudo|(0020,4000)|valor da tag inalterado|
|Descrição do Estudo|(0008,1030)|valor da tag inalterado|
|Descrição da Série|(0008,103E)|valor da tag inalterado|
|Descrição da Derivação|0008,2111|valor da tag inalterado|
|Nome do Técnico |0008,1070|valor da tag inalterado|
|Nome da Estação |0008,1010|valor da tag inalterado|
|Nome da Instituição|0008,0080|valor da tag inalterado|