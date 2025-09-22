---
sidebar_position: 7
title: Recursos de Exportação do OmegaAI
tags:
  - Exportação
  - CSV
  - Excel
  - Arquivo Zip
  - DICOM
  - Worklist
  - Exportação de Dados
---

# Recursos de Exportação do OmegaAI

O OmegaAI oferece opções robustas para exportação de dados das listas de trabalho (worklists) em formatos CSV, Excel ou como um arquivo Zip contendo todos os dados do estudo, incluindo imagens DICOM e documentos associados. Este guia fornece instruções passo a passo sobre como utilizar cada função de exportação, garantindo que os dados sejam extraídos do OmegaAI de forma precisa e eficiente.

## Exportando Dados para CSV ou Excel

- **Localização**: Página da lista de trabalho (worklist), no canto superior direito ao lado do número de estudos.

  

- **Passos**:

  1.  Clique em Exportar e então selecione Exportar como CSV ou Exportar como Excel, conforme sua necessidade.

      

2.  Uma vez selecionado, os dados da lista de trabalho serão convertidos para o formato de arquivo escolhido e salvos automaticamente na pasta Downloads do seu computador local.

3.  O nome do arquivo é atribuído por padrão como "Worklist\_\[data da exportação\]."

**Nota**: Apenas os campos (colunas) visíveis na sua lista de trabalho no momento da exportação serão incluídos no arquivo. Essas colunas aparecerão na mesma ordem em que estão exibidas na página da lista de trabalho.

## Exportando como Arquivo Zip ou Burn

- **Função**: Este recurso permite aos usuários exportar todos os dados do estudo, incluindo imagens DICOM e arquivos adicionais como laudos diagnósticos ou documentos digitalizados, em formato Zip.

- **Passos**:

  1.  Selecione os estudos que deseja exportar marcando a caixa de seleção ao lado de cada um na lista de trabalho. As caixas de seleção estão localizadas no lado mais à esquerda de cada linha de estudo.

  2.  Um menu aparecerá na parte inferior da tela. Clique em Download para prosseguir com o download como Zip, com opções para download anonimizado ou normal, ou escolha Burn para gravar os dados em uma mídia física.

  3.  Os dados exportados são salvos na pasta Downloads do seu computador.

  4.  A estrutura de pastas dentro do arquivo Zip segue os padrões DICOM:

      - **Pasta de nível superior**: Nomeada usando o número de Accession seguido pelo STUDYUID.

      - **Pastas de segundo nível**: Nomeadas de acordo com o SERIESUID.

      - **Pastas de terceiro nível**: Cada uma contém arquivos nomeados com seus respectivos SOPUIDs, representando as imagens ou IDs de objetos DICOM.

## Notas de Uso

- Certifique-se de que as configurações de visibilidade na sua lista de trabalho estejam ajustadas para exibir todas as colunas necessárias antes de exportar para CSV ou Excel.

- Confirme a precisão dos dados e nomes dos arquivos, especialmente ao exportar dados médicos sensíveis.

- Utilize a opção de anonimização de forma criteriosa para cumprir as regulamentações de privacidade do paciente ao exportar dados.