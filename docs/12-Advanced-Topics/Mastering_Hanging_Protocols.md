---
sidebar_position: 3
title: Mastering Hanging Protocols 
---

# Mastering Hanging Protocols

## Overview

The **Hanging Protocols Configuration Screen** in OmegaAI is a
comprehensive interface designed to help users configure and customize
how medical imaging studies are displayed. It enables radiologists and
technologists to create tailored viewing layouts that align with
clinical workflows and preferences. The screen is organized into three
main sections, each supporting a different part of the configuration
process.

Refer <u>*[Hanging Protocols in OmegaAI](https://help.omegaai.com/docs/Image-Viewer/Hanging_Protocols_in_OmegaAI)*</u>

## Configuration Screen Layout
The Configuration Screen Layout provides a visual workspace where you define how images are arranged, assigned, and displayed within the viewer. This screen is divided into intuitive panels that guide you through setting up viewports, assigning view codes and modifiers, and managing rules for each viewport.

![mhp](./img/mhp_1.png#large)

### 1. Viewport Setup

**Location:** Top-left panel

**Purpose:** Allows you to configure the structure and organization of
viewports within the imaging viewer.

- The Viewport Setup area displays the grid where you can define the
  number and arrangement of viewports (e.g., 1×1, 2×2, 3×1).

- **A single left-click** on the Viewport Setup area opens the **Select
  a layout** option, where you can choose their preferred viewport grid.

  - Click on the grid cells to assign active viewports (highlighted in
    blue).

![mhp](./img/mhp_3.png#large)

#### Resetting the Layout

- To restore the default layout, click the **Reset** button located in
  the top-right corner of the **Viewport Setup** panel.

- From the dropdown, select **Reset Viewport**.

- This action clears all assigned layouts and configurations and returns
  the workspace to the default single-viewport setup.

![mhp](./img/mhp_4.png#large)

## 2. View Codes and Modifiers Panel

**Location:** Bottom-left panel
**Purpose:** Provides a searchable list of predefined **View Codes** and
**MG Modifiers** used to accurately assign images to the correct
viewports.

#### View Codes

**View codes** represent specific imaging orientations, projections, or
series types.
They help the system determine **which images should be placed into each
viewport** when a hanging protocol is executed. By selecting the
appropriate View Code, you ensure that the correct image type populates
the corresponding viewport during the protocol setup.

**Examples include:**

- AP (Anteroposterior)

- PA (Posteroanterior)

- LAT (Lateral)

- OBLIQUE

- CT: AXIAL

- CT: CORONAL

- ANY X-RAY

![mhp](./img/mhp_5.png#large)

#### MG Modifiers

Modifiers provide additional descriptors specific to mammography,
capturing variations in breast positioning, orientation, or specialized
imaging techniques. These are essential for exams involving modified
projections.

**Examples include:**

- ID -- Implant Displaced

- RM -- Right Mediolateral

- RI -- Right Inferior

- RS -- Right Superior

- RL -- Right Lateral

- NP -- Nipple in Profile

![mhp](./img/mhp_6.png#large)

### How View Codes and MG Modifiers Are Used

- Users **drag and drop** View Codes or MG Modifiers into the desired
  viewport within the layout.

- The system then uses these assignments to automatically load the
  correct image series or orientation when a study is opened.

- This ensures consistent, accurate, and predictable image placement
  according to modality, orientation, and exam type.

  ![mhp](./img/mhp_7.png#large)

### Search Functionality

- A **search** icon is available in the top-right corner of the View
  codes panel.

- It allows you to quickly find specific **View Codes** or **MG
  Modifiers** by typing relevant keywords or abbreviations.

  ![mhp](./img/mhp_8.png#large)

## 3. Hanging Protocol Rules Panel:

**Location:** Right side of the configuration screen.
**Purpose:** Defines how each viewport behaves when a hanging protocol
is applied.

The **Hanging Protocol Rules Panel** provides a comprehensive set of
configuration options that control how images behave, appear, and are
selected within each viewport when a hanging protocol is executed. These
rules allow you to fine-tune the viewing experience, ensuring that
images are displayed consistently and in alignment with clinical
workflow requirements.

Each rule applies specifically to the **selected viewport**, and
together they determine everything from visual behavior and image sizing
to windowing, orientation, and metadata-driven image selection. The
Rules Panel includes the following categories:

- Click on the viewport name (e.g., *Viewport 1*) to select it.
  Click the **"+"** button to add a new rule configuration.
  After clicking **"+"**, options appear around the button, such as

  a.  **Toggles**

  b.  **Conditions**

  c.  **Scaling**

  d.  **Window Presets**

  e.  **Orientation**

Select the desired rule type to configure how images are displayed and
interact with in the selected viewport.

![mhp](./img/mhp_9.png#medium)![mhp](./img/mhp_10.png#medium)

#### a. Toggles

The **Toggles** option allows you to enable or disable specific viewing
features for the selected viewport. These settings define which tools,
visual elements, and interaction behaviors are active when the hanging
protocol loads.

When a toggle rule is added, you can choose from the following options:

![mhp](./img/mhp_11.png#medium)

**• Linking**

Synchronizes scrolling, planning, zooming, and slice navigation across
linked viewports.

**• Scroll Between Series**

It allows you to scroll through multiple series within the same
viewport.

**• Show Annotations**

Displays system-generated or user-created annotations within the
viewport.

**• Show CAD Findings**

Shows computer-aided detection (CAD) markers when available for the
study.

**• Show Overlay**

Enables DICOM or system overlays such as patient demographics, study
metadata, and acquisition details.

**• Show Reference Lines**

Displays cross-reference (scout) lines between linked viewports.

**• Show Scout Image Overlay**

Displays scout (topo-gram) locator lines on CT images when scrolling
through slices.

- Each toggle can be set to **Active** or **Inactive**, giving users
  complete control over how the selected viewport behaves and what
  visual elements are displayed.

#### b. Scaling

The **scaling** option defines how images are sized and displayed within
the selected viewport when the hanging protocol is applied. These
settings ensure consistent zoom behavior and image fit across different
studies and series.

Users can configure the following:

- **Zoom (%)**
  Zoom applies a fixed zoom level to the image, allowing precise control
  over magnification.

- **Fit Type**
  Determines how the image fits within the viewport:

- **Viewport**---Fits the entire image within the viewport while
  maintaining aspect ratio.

- **Fill**---Fills the viewport completely, which may crop parts of the
  image.

- Use **scaling** settings to maintain a uniform viewing experience,
  particularly when comparing multiple series, modalities, or
  orientations.

![mhp](./img/mhp_12.png#medium)

#### c. Window Presets

The **Window Presets** option allows you to define the window level
(WL) and window width (WW) that will be applied to the **selected
viewport** when the hanging protocol is loaded. This ensures
consistent brightness and contrast settings across studies.

  You can either:

- Select **Custom** and enter **WL/WW values**, or

- Select from **predefined imaging presets**, such as

- Brain (70/30)

- Bone (2000/500)

- Abdomen (400/40)

- Soft Tissue (350/50)

- Liver (160/60)

- Lung (1500/600)

- Mediastinum (500/50)

- Window presets help standardize image appearance and streamline review
  across body regions and modalities.

- The **Window Level Preset Sync** feature in OmegaAI ensures any
  presets created using the **Window Level Tool** are automatically
  available for use in Hanging Protocols.

- Any hanging protocol saved with a specific **window level
  configuration** will also be listed under the available window
  presets, allowing for easy reuse and consistency across studies.

![mhp](./img/mhp_13.png#medium)

 #### d. Conditions

- The **Conditions** option lets you set rules that decide **when a
  viewport configuration should be applied**.

- These rules are based on **DICOM tags**, so the system can match
  images using specific metadata.

  Each condition includes:

- **DICOM Tag** -- The attribute you want to check (example: *0008,103e
  -- Series Description*).

- **Operator**---How the value should be compared:

  - **Equal** -- Value must match exactly.

  - **Not equal** --- Value must be different.

  - **Includes**---Value must contain the text you enter.

  - **Not include**---Value must *not* contain the text you enter.

- **Value**---The text or number you want to match (example: *LUNG 1.25
  MM*).

 **Purpose:**\
 Conditions help the system select the correct images for each viewport
 based on modality, series description, body part, or any other DICOM
 header tag.

![mhp](./img/mhp_14.png#medium)

#### e. Orientation

 The **Orientation** option allows you to control how images are
 flipped, rotated, or aligned within the **selected viewport** when the
 hanging protocol is applied. These settings ensure that images always
 appear in consistent and clinically appropriate orientation.

 You can configure:

- **Flip**---Flip the image horizontally or vertically.

- **Rotate**---Rotate the image clockwise or counterclockwise.

- **Align**---Align the image to a specific side of the viewport:

  - **Top**

  - **Bottom**

  - **Right**

  - **Left**

 Orientation rules help standardize image presentation across different
 studies and modalities.

![mhp](./img/mhp_15.png#medium)

## Hanging Protocol Stages Management

Hanging Protocol Stages Management allows you to organize and control
how images are displayed across multiple stages within a hanging
protocol. Each stage represents a specific viewing layout or
configuration tailored for different parts of the interpretation
workflow---such as localizer views, core series review, or comparison
studies.

The **Hanging Protocol Stages Management** panel is located along the
**bottom border of the Hanging Protocol Configuration screen**. It
appears as a horizontal navigation bar below the **Viewport Setup** and
**View Codes** sections.

![mhp](./img/mhp_16.png#large)

### Creating a Stage

- Click the **"+" (Add Stage)** icon located at the bottom-left of the
  stage bar.

- A new stage will be added to your Hanging Protocol.

- You can create **as many stages as required**, depending on your
  workflow or multi-step reading process.

- Each stage is represented by a **dot indicator** on the bar, and each
  dot is labeled with a unique stage number.

- Click on any dot indicator to **review, configure, or switch** between
  stages.

### Deleting a Stage

- Click on the **stage indicator dot** for the stage you want to delete.

- A **trash can icon** will appear next to the selected stage.

- **Right-click and hold** the trash icon to delete the stage.

- The stage will be removed, and the remaining stages will automatically
  be renumbered.

![mhp](./img/mhp_17.png#large)

### Stage Navigation in the Image Viewer

 Stage navigation in the OmegaAI Image Viewer allows you to move
 between different stages defined within a Hanging Protocol. Each stage
 represents a unique layout or configuration designed to guide the
 reading workflow.

- In a **multi-stage protocol**, use **Page Up** to move to the previous
  stage and **Page Down** to move to the next stage.

- In a **single-stage protocol**, Page Up/Page Down will load the **next
  series** instead of switching stages.

- **Empty stages** (stages with no matching images) are automatically
  skipped during navigation.
  

## Prior Matching Model Configuration in OmegaAI

The **Prior Matching Model Configuration** in OmegaAI enables you to
define how previous imaging studies are matched to the current study
based on specific criteria, ensuring accurate and relevant prior
retrieval for diagnostic review.

### Accessing the Prior Matching Model

To access the Prior Matching Model Configuration:

1.  **Open the Configuration**
 Drawer, which displays all created matching models, with the active
 model for the current hanging protocol highlighted.

2.  **Identify the Default Model**\
  Indicates which matching model is automatically applied across all
  hanging protocols.

### Creating and Managing Matching Models

 **Adding a New Model**

- **Create New Model**
  Initiates the setup of a new matching model for prior study retrieval.

![mhp](./img/mhp_20.png#large)

![mhp](./img/mhp_21.png#small)

- **Managing Existing Models**

 The **three-dot menu** beside each model provides quick management
 options.

- **Edit**---Modify the existing model configuration.

- **Delete**---Remove the model permanently.

- **Set as Default** -- Assign the model as the default selection for
  future use.

![mhp](./img/mhp_22.png#medium)

### Configuration Options

**a. Model Name**

- **Purpose:** Defines a unique and identifiable name for the matching
  model.
  Enter a clear and descriptive name in the **Query model name** field.

**b. Body Part**

- **Purpose:** Ensures prior studies are selected based on the relevant
  anatomical region.

- **Default:** Matches the body part of the current study.

- **Customization:** Specify one or more body parts to broaden or refine
  the matching criteria.

![mhp](./img/mhp_23.png#medium)

**c. Study Date**

- **Purpose:** Filters prior studies based on how recent they are
  relative to the current exam.
  Enter the desired range in months (up to **360 months**) to identify
  relevant prior studies.

![mhp](./img/mhp_24.png#medium)

**d. Study Status**

- **Purpose:** Includes prior studies based on their workflow or
  completion status.

- **Default:** Matches the status of the current study.

- **Custom Options:** Select one or more statuses, such as
  **\"Completed\" or \"In Progress**\"

![mhp](./img/mhp_25.png#medium)

**e. Modality**

- **Purpose:** Ensures matching is limited to relevant imaging
  modalities.

- **Default:** Matches the modality of the current study.

- **Customization:** Select one or more modalities to expand or restrict
  matching.

![mhp](./img/mhp_26.png#medium)

**f. Laterality**

- **Purpose:** Matches prior studies based on the anatomical side being
  scanned.

- **Default:** Matches the laterality of the current study.

- **Options:** **Left**, **Right**, **Both**, **Unpaired**.

![mhp](./img/mhp_27.png#medium)

**g. Procedure Code**

- **Purpose:** Matches prior studies using standardized procedure codes.

- **Default:** Uses the current study's procedure code.

- **Expansion:** Select additional procedure codes to ensure inclusion
  of relevant exams.

![mhp](./img/mhp_28.png#medium)

**h. Study Description**

- **Purpose:** Allows filtering of prior studies based on keywords or
  phrases within the study description.\
  Supports text-based conditions such **as \"includes,\" \"does not
  include**,**\" \"equals,\" and \"does not equal**.\"

![mhp](./img/mhp_29.png#medium)

**Saving the Matching Model**

- Review all configured criteria for accuracy.

- Click **Save** to store the newly created or updated matching model.

- The saved model will appear in the list and can be assigned to
  viewports during Hanging Protocol configuration.

## Managing organizations in Hanging Protocols.

- When saving a Hanging Protocol, organizations determine **where** the
  protocol will be available and **who** can use it. OmegaAI supports
  flexible organization selection using ancestor and descendant
  structures.

- After configuring the desired layout, click the **Star** button in the
  top-right corner to open the **Save Protocol** dialog.

- Under the **Organization** dropdown, you can assign the protocol to
  one or more organizational levels:

![mhp](./img/mhp_18.png#medium)

### Organization Selection

Under the **Organization** dropdown, you can assign the protocol to one
or more organizational levels:

You can select organizations in different ways based on your
requirements:

- **Selecting an Ancestor Organization:**
  Selecting an Ancestor (e.g., *Ancestor A*) automatically includes all
  its Descendants (e.g., *Descendant 1, 2, 3*).
  *Example:* Choosing *Ancestor B* will auto-select *Descendant X, Y,
  Z.*

- **Selecting Mixed Organizations:**
  Selecting one ancestor (e.g., *Ancestor A*) and individual Descendants
  from another (e.g., *Descendant X, Y* under *Ancestor B*) will include
  all Descendants under *Ancestor A* plus the chosen Descendants from
  *Ancestor B.*

- **Selecting Only Descendants:**
  You can manually select individual Descendant Organizations (e.g.,
  *Descendant 2, 3* from *Ancestor A* and *Descendant X, Y* from
  *Ancestor B*).
  When a Descendant is selected, its peer Descendants will also be
  displayed for multi-selection.

- **Selecting Only Ancestors:**
  To select only an Ancestor Organization without its Descendants, check
  the Ancestor box and deselect its Descendants as needed.

**Default Behavior:**
If no organization is selected, the **organization of the study
currently being viewed** is automatically applied by default.
 
 ![mhp](./img/mhp_19.png#medium)
