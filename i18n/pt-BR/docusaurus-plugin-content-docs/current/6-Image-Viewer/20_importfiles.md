---
sidebar_position: 20
title: Importar Imagens, Vídeos e Documentos
tags:
  - OmegaAI
  - Visualizador de Imagens
  - QC
  - Importar Séries
  - Importar Documentos
  - Importar Imagens
  - Importar DICOM
---

# Importar Imagens, Vídeos e Documentos

O módulo QC também inclui um recurso robusto de importação de imagens, vídeos e relatórios. Isso permite que você importe vários tipos de arquivos simplesmente arrastando e soltando-os no estudo de destino dentro do Visualizador de Imagens.

**Tipos de Arquivos Suportados:**

- **JPEG**

- **PDF**

- **Texto**

- **DICOM**

- **MP4**

**Processo de Importação:**

1. Siga os passos mencionados para [Acessar o Visualizador de Imagens](https://po-us01-help-manual-app-webapp.azurewebsites.net/docs/Image%20Viewer/1%20Accessing%20the%20Image%20Viewer%20in%20OmegaAI#access-methods).

2. **Arrastar e Soltar:**

    - Arraste e solte os tipos de arquivos suportados do seu explorador de arquivos para o painel lateral esquerdo do Visualizador de Imagens.

3. **Processamento com Base no Tipo de Arquivo:**

    - **Arquivos de Texto ou PDF:**

      - Você pode importá-los como objetos DICOM de cópia física para o Visualizador de Imagens ou como documentos do estudo para o Visualizador de Documentos.

    - **Arquivos DICOM:**

      - O sistema verifica se a mesma série ou quadros DICOM já existem no estudo. Se quadros adicionais forem detectados, eles são adicionados à série existente. Se os objetos DICOM pertencerem a uma série separada, uma nova série é criada.

    - **Arquivos JPEG:**

      - Você pode importá-los para a mesma série ou como séries separadas.

**Tempo de Processamento:**

- O tempo para processar e importar os arquivos depende do tamanho deles.

- Se você sair da tela do Visualizador de Imagens durante o processo de importação, uma mensagem solicitará a confirmação para cancelar ou continuar a importação.

- Após o processamento, os arquivos importados ficarão visíveis no Explorador de Estudos do Visualizador de Imagens.