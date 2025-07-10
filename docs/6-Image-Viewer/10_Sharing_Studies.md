---
sidebar_position: 10
title:  Sharing Studies
tags:
  - Share Study
  - Share Icon
  - User Privileges
  - Share History,
  - Organization Search
  - User Search
  - Add Comment
  - Notifications
---
# Sharing Studies

## Overview

The Share Study feature in OmegaAI allows users to easily share their
studies with colleagues within their organization. This function
facilitates collaboration by providing an interface to manage sharing
permissions, search for users, and add comments to shared studies. This
guide will detail the steps required to use the Share Study feature
effectively.

## Accessing the Share Study Feature

1.  **Locate the Share Icon**:

    - Open the OmegaAI software.

    - Identify the share icon on the toolbar. This icon is specifically
      designed for sharing studies.

      ![1](./img/Sharing1.png)

2.  **Opening the Share Drawer**:

    - Click on the share icon.

    - A drawer will open on the left side of your screen. Here, you will
      see the history of previously shared studies.

## Sharing a Study with a New User

1.  **Initiate a New Share**:

    - At the top of the share drawer, click the plus (+) icon to begin
      sharing a study with a new user.

2.  **Selecting the Organization**:

    - In the 'Add New' screen, you will first select the organization to
      which the recipient belongs. This ensures that the study is shared
      within the correct institutional context.

3.  **Searching for the User**:

    - Use the dropdown menu with a search option to locate the username
      of the individual you wish to share the study with.

    - As you type, the search function will suggest matches, making it
      easier to find the correct user quickly.

4.  **Setting Privileges**:

    - Decide if you want to grant the recipient the privilege to further
      share the study. This setting controls the spread of the study and
      maintains appropriate access levels.

5.  **Adding a Comment**:

    - Below the user and privilege settings, there is a space to add a
      simple comment about the study. This comment will be visible to
      the recipient and can provide context or instructions.

6.  **Finalizing or Canceling the Share**:

    - Once all information is correctly filled out, click the 'Share'
      button to finalize the request and send a notification to the
      other user.

    - If you decide not to proceed, click 'Cancel' to discard the
      request.

      ![2](./img/Sharing2.png)
      
## Notification Process

- Once a study is shared, the recipient will receive a notification
  informing them of the share. The notification includes the comment
  added by the sharer, which helps the recipient understand the context
  of the shared study.

  ![3](./img/Sharing3.png)
## Presentation State

### Overview
Presentation State (PR) in OmegaAI is a critical feature designed to capture and preserve the exact visual representation of medical images as configured by the user. This includes settings such as window level, zoom, pan, rotation, flip, and any applied measurements or annotations. These saved states ensure consistency and compatibility when images are shared, exported, or reloaded for viewing.

### What is a Presentation State (PR)?

A Presentation State is a DICOM-compliant object that stores the visual and interactive configuration of an image or series at a specific point in time.

PR ensures that settings like Window Width/Level, Display Area, Zoom, Flip, Rotate, Pan, and Annotations remain intact when images are reopened or transferred to another system.

Included Tools in a Presentation State while sending and recieving the studies:

- Window Level

- Zoom

- Pan

- Flip

- Rotate

- Measurement & Annotation

### When is a Presentation State Created?

A PR is automatically saved when a user with proper permissions clicks “DONE” or “DONE & NEXT” in the Image Viewer/QC Module, for any study not yet marked as VERIFIED.

The PR can also be manually saved if the user has appropriate access.

PR is also saved with bookmarks that retain view state and tool configuration.

### Presentation State Conversion to DICOM:

When exporting studies, burning to CD, or transmitting via OAI Link, PRs are converted into DICOM objects.

This conversion retains key PR elements for consistency and interoperability across systems.

### User Access Control (UAC) for PR Creation:

Admins can manage which roles or individual users can create and save Presentation States.

Access Settings Path: Home → Image Viewer → QC Module → Presentation State

#### Toggles Available:

Application PR: On → Apply PR | Off → Do not apply PR (Default)

Edit PR: On → Save PR | Off → Do not save PR (Default)

#### Permissions:

By default, only users with the roles Reading Physician or Performing Physician have the ability to create PRs.

Admins can override this default setting to extend PR creation capabilities to other custom roles as per business requirements.

#### Automatic Behavior:

On loading a study in the Image Viewer, the last saved Presentation State is automatically applied for a seamless review experience.

If a PR exists for a study, it overrides the default auto-window leveling to preserve intended image interpretation.



