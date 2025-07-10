---
sidebar_position: 1
title: Compreendendo a Hierarquia Organizacional
tags:
  - Tipo de Organização
  - Organização Master
  - Organização Gerenciadora
  - Imagem
  - Organização
  - Organização Referenciadora
  - Gerenciamento de Estudos
  - Instalação de Dispositivos
  - Automação de Fluxo de Trabalho
  - Configurações RIS
  - Recursos de Saúde
---

# Compreendendo a Hierarquia Organizacional

Esta seção do manual de ajuda do OmegaAI fornece informações sobre os diferentes tipos de organizações dentro do sistema, suas capacidades específicas e como os estudos são gerenciados e vinculados a essas organizações. Também discute a importância das configurações organizacionais corretas durante a configuração inicial e considerações para alterações após a implementação.

## Tipos de Organização Atuais no OmegaAI

### Organização Master

A Organização Master representa o nível mais alto em qualquer hierarquia organizacional no OmegaAI. Ela detém capacidades sobre todo o sistema, voltadas para garantir uma gestão ampla e supervisão configuracional.

**Capacidades:**

- **Configuração de Papéis:** Gerenciar e configurar papéis em toda a organização.

- **Automação de Fluxo de Trabalho:** Automatizar processos e fluxos de trabalho para otimizar as operações.

- **Personalização de Status:** Personalizar e gerenciar vários status dentro do sistema para refletir processos organizacionais únicos.

- **Configurações RIS:** Configurar e gerenciar as configurações do Sistema de Informação em Radiologia (RIS) de acordo com as necessidades organizacionais.

### Organização Gerenciadora

Uma Organização Gerenciadora opera em qualquer nível dentro da hierarquia, mas abaixo da Organização Master. Ela desempenha um papel fundamental na gestão de usuários e no controle operacional dentro de seu escopo.

**Capacidades:**

- **Gerenciamento de Usuários:** Supervisionar papéis, permissões e atividades dos usuários dentro da organização.

- **Carimbo para Estudos Recebidos:** Utilizar credenciais organizacionais para marcar estudos de imagem.

- **Gestão de Recursos de Saúde:** Aceitar e gerenciar recursos de saúde necessários para a funcionalidade operacional.

- **Instalação de Dispositivos:** Instalar e configurar dispositivos usando tecnologias Link e FHIR.

### Organização de Imagem

Uma Organização de Imagem é um tipo específico de Organização Gerenciadora, focada principalmente no recebimento e manuseio de estudos de imagem.

**Papel Especial:**

- **Recepção de Estudos:** Atua como ponto de recebimento para estudos transmitidos através do OAI Link, garantindo que os estudos sejam gerenciados e catalogados adequadamente.

### Organização Referenciadora

Uma Organização Referenciadora geralmente existe fora da hierarquia organizacional do cliente, mas pode ser vinculada a uma organização gerenciadora dentro dela.

**Característica Única:**

- **Vinculação Externa:** Embora externa, pode ser vinculada para fins de referência ou acesso a estudos e recursos.

## Compreendendo o Relacionamento dos Estudos com as Organizações

### Gerenciamento de Estudos no Contexto Organizacional

- **Organização Gerenciadora:** Normalmente, o estudo é gerenciado pela Organização Master por padrão. No entanto, também pode ser definida como a organização da qual o estudo foi importado ou vinculado.

- **Organização de Imagem:** Indica a origem do estudo, geralmente alinhada à organização gerenciadora do dispositivo do qual o estudo foi recebido.

- **Considerações de Agendamento:** Ao agendar recursos, é crucial garantir que os recursos de saúde estejam definidos sob a mesma organização gerenciadora que hospedará o dispositivo de imagem. Esse alinhamento é necessário para que o sistema reconheça e gerencie corretamente a organização de imagem.

**Nota**: Quaisquer alterações no Tipo de Organização após a configuração inicial devem ser realizadas com cuidado para garantir o desempenho ideal do sistema e a conformidade com os requisitos operacionais.