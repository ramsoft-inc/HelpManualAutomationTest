---
sidebar_position: 17
title: How to Setup Third Party Integrations?
tags:
  - URL Launch 
  - Image Viewer
  - Document Viewer
  - Integration  
---

## Overview

OmegaAI allows administrators to configure **alternative viewers**—such as external image or document viewers—to be used in place of OmegaAI's native viewers. This can be particularly useful when an organization prefers to use third-party solutions like **PowerReader**, or other DICOM-compliant viewers.

Once configured, when a user opens a study in OmegaAI, the system will **launch the external viewer instead of the native viewer**. The third-party software then takes over window management and rendering.

:::warning
Because OmegaAI cannot control the window behavior of external applications, **multi-monitor layouts will not be preserved** on first launch. Users will need to manually move or configure the external viewer to their preferred display layout.
:::

---

## Key Requirements

### Consistent Study UID

The third-party viewer must support **study launch by Study Instance UID** (`<studyuid>`). This UID is a globally unique identifier assigned to each study and must be the same on both OmegaAI and the external system.

The launch URL provided to the external viewer **must include** the `<studyuid>` in a format it understands. If the UID does not match or is not supported, the study will not open as expected.

---

## How to Set Up an Alternative Viewer for a User

1. Navigate to the **Organizations** screen in OmegaAI.
2. Click **Details** for the relevant organization.
3. Find and click on the user who should use the external viewer.
4. Under the **OmegaAI Dial** section, paste the launch URL for the third-party viewer, using the appropriate format.

### Important for Self-Setup Users

If you are setting up an alternative viewer **for your own user account**, do **not** use the search bar at the top of OmegaAI to find yourself. This will open your **profile page**, which **does not include** configuration options for third-party integrations.

Instead:

- Go to one of the **Organizations** where you are listed as a user.
- Click **Details** for that organization.
- Go to the **Users** tab and locate your name in the list, and click on it to edit.
---

## Example: PowerReader Integration

PowerReader supports direct study launch via URL using a format similar to the following:


```plaintext
https://demo.ramsoftpacs.com/powerreader/login.aspx?username=REPLACEWITHUN&password=REPLACEWITHPW&studyuid=<studyuid>&app=powerreader
```
