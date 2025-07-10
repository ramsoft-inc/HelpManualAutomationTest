---
sidebar_position: 2
title: Pre-Caching Images
tags:
  - Caching
  - OmegaAI Link Caching
  - Auto-Precache
  - Browser Caching
  - DICOM Images
  - Virtual Machine
  - AESGCM Encryption
  - HTTPS
  - Web Cache
  - Predictive Caching
---

# Pre-Caching Images

## Overview

Caching is a vital feature in OmegaAI designed to improve the efficiency
of image retrieval and enhance DICOM viewing performance. This
functionality is implemented through two main methods: OmegaAI Link
Caching and Auto-Precache using the browser. Each method optimizes data
access differently to suit varying user needs and infrastructure setups.

## OmegaAI Link Caching

Link Caching accelerates data retrieval by storing pixel data locally as
it is received, which avoids repeated fetches from the server, a process
that can be both costly and slow.

### How it Works

- **Identification of Local Link:** The system uses the public IP
  address to identify local Links where OmegaAI is installed.

- **Storage of Pixel Data:** To protect patient health information
  (PHI), pixel data is encrypted using the AESGCM algorithm before
  storage on the local disk.

- **Running the Link Server:** A secure web server is initiated with the
  start of the link, and a domain certificate (HTTPS) is attached to
  ensure secure data transmission.

### Predictive Auto-Link Caching (Using Web Cache)

This advanced feature is designed to further speed up the application
usage through predictive caching mechanisms.

#### Steps Involved

- **Login Trigger:** Upon user login, the system begins auto-precache
  operations.

- **Data Request and Caching:** If a link is available, it requests
  specific pixel data. The Link checks if this data is already cached;
  if not, it retrieves and caches it from the server. Subsequently, this
  cached data is quickly available for the next user access.

#### Auto-Precache Using Browser

This method targets a broader user base and is activated upon opening a
study. It aims to provide predictive caching to facilitate immediate
access to necessary images.

#### Caching Methodology:

- **Selection of Studies:** The system selects the top-listed studies in
  the worklist based on the set priority or default order.

- **Batch Caching:** Initially, the first five studies are cached. Once
  complete, the next batch of studies (6-10) is processed, with a
  limitation to cache up to 15 studies.

- **Background Caching:** When a user logs in, all assigned studies are
  cached in the browser in priority order using a web-worker. This
  includes downloading the studies and any relevant prior images in the
  background.

- **Purge Management:** The browser automatically manages the purging of
  cached data.
