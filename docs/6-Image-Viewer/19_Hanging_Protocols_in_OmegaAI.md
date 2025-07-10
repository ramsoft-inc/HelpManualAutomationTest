---
sidebar_position: 19
title: Hanging Protocols in OmegaAI
---
# Hanging Protocols in OmegaAI

## Overview

The Hanging Protocol feature in OmegaAI allows radiologists and technologists to standardize the layout of images on the viewer. These protocols define how images should be displayed based on modality, series description, and other criteria.

This document outlines how to access, use, and configure Hanging Protocols in the Image Viewer.

// ![1](./img/Hanging1.png)

## Accessing Hanging Protocols

There are two methods to access Hanging Protocols in the OmegaAI Image Viewer:

### Method 1: Quick Access

1. On the top toolbar of the Image Viewer, click on the Hanging Protocol button.

2. The Hanging Protocol Selector will appear.

3. This allows users to:

- Instantly change the Viewport Configuration.

- View all saved Hanging Protocols for the active modality.

- Access default protocols and any user-saved configurations.

Hanging Protocol Selector Features:

- Right Arrow ( > ): Expand to view all available Hanging Protocols.

- First Icon - Blank Protocol:

  - Click this to go to the Hanging Protocol Configuration screen.

  - A small "Save" button appears here; click it to save the current active Viewport Configuration.

- The active protocol is visually highlighted in blue in the expanded view.
### Method 2: Access via Settings

1. Click on the three-dot menu (More) in the top right corner of the Image Viewer.

2. Select "Settings" from the dropdown.

3. Then click on "Hanging Protocols" to open the configuration screen.


## Hanging Protocol Configuration

When a user clicks into the Hanging Protocol Configuration screen, they will access the Saved Hanging Protocol section.

### Configuration Panel Options:

1. **Star Button:**

- Clicking this displays a list of saved protocols created by users and the default Hanging Protocols.

- The list is sorted by the active modality, which appears at the top.

2. **Duplicate Hanging Protocol:**

- This button allows users to duplicate an existing protocol.

- Users can save the duplicated protocol with a new name after making changes.

3. **Add New Protocol (+):**

- Clicking the "+" button allows users to create a brand-new Hanging Protocol with a completely new configuration.


### Default Hanging Protocols:

Default Hanging Protocols in OmegaAI are designed to offer immediate value and streamline the diagnostic workflow for radiologists. Whether you are new to the platform or an experienced user, Default Hanging Protocols provide a robust starting point to suit a variety of modalities and use cases.

- You can view a curated list of pre-configured protocols to begin using standard workflows without requiring any setup and duplicate and customize these default protocols to better match their personal or institutional preferences.

- All Hanging Protocols are neatly organized in collapsible sections under "Default Protocols" and "Saved Protocols" to simplify navigation and enhance protocol management.
There are:

- 11 for MG (Mammography)

- 7 for XR (X-ray)

- 2 for US (Ultrasound)

- 7 for CT (Computed Tomography)

- 5 for MR (Magnetic Resonance)

protocols created for user convenience. 

### Hanging Protocol Matching Criteria
Hanging Protocols match based on:

- Modality

- Body Parts available in the study

## Creation of the Hanging Protocols

On the viewport section, right-click will allow the user to set the viewport configuration by selecting the boxes. Once selected, the user can now drag and drop the viewcodes or modifiers from the bottom section, and on the right-hand side, the user will be able to see the viewport configuration (Hanging Protocol Rules) section. The user can click on the "+" button and choose between the following:

1. Orientation
2. Toggles
3. Scaling
4. Window Presets
5. Conditions

On clicking any of these toggles, the user will be able to further configure the viewport as needed.

On the viewport, the user will also be able to see the bottom toggle section with a downward arrow. On clicking, the user will be able to further divide the viewport into different parts. By clicking the Prior button, the user will be able to select preceding priors among:
- 1st Preceding Prior
- 2nd Preceding Prior
- 3rd Preceding Prior
- Or set up the prior rule by themselves by clicking on the Select Matching Model button.

### Saving the Hanging Protocol
Once the user is happy with the configuration made, they can click on the "Star" button and name the Hanging Protocol. Additional fields are available to improve the matching of the Hanging Protocol. Finally, the user can click on the Save button to save the Hanging Protocol.
### Monitor Configuration Adaptability

OmegaAI's Hanging Protocols are designed to adapt automatically to your
monitor setup:

- **Single Monitor Setup:** If using a single monitor, the viewport
  configured in the Hanging Protocol will be displayed on that monitor.

- **Multiple Monitors Setup:** If multiple monitors are in use, the same
  number of viewports will be expanded and utilized across all available
  monitors, ensuring a consistent viewing experience regardless of the
  number of screens.
