---
sidebar_position: 3
title: Mastering Hanging Protocols 
---

# Mastering Hanging Protocols

## Overview

The Hanging Protocols Configuration Screen in OmegaAI is a robust
interface designed for setting up and customizing the display of medical
imaging studies according to specific user preferences or clinical
requirements. This screen is segmented into three main areas, each
serving a distinct purpose in the configuration process.

## Configuration Screen Layout

### Viewport Setup (Top Left)

This section is dedicated to defining the layout and specific settings
of the viewports used in a hanging protocol.

![Mastering Hanging Protocols](./Images/1.png)

- **Defining Viewports**: Click on any viewport to select and configure
  it. Options include setting specific modifiers, particularly useful in
  mammography studies for applying special viewing conditions.

- **Search Functionality**: Use the search icon to look through
  available view codes and modifiers to find specific settings quickly.

  ![Mastering Hanging Protocols](./Images/2.png)

### View Quotes and Modifiers (Lower Left)

Here, you will find a list of view codes along with applicable
modifiers, with enhanced options for mammography.

- **Adding Modifiers**: For specialized studies like mammography,
  modifiers like implant displacement can be added to viewports to
  refine what images are displayed.

### Hanging Protocol Rules (Right Side)

This area allows for the customization of rules and additional options
for the hanging protocols.

- **Accessing Existing Protocols**: Click the star icon to view a list
  of existing hanging protocols available to your user profile.

- **Duplicating and Sharing Protocols**: Options for duplicating and
  sharing protocols are available to facilitate collaborative settings
  and standardize practices across users.

  ![Mastering Hanging Protocols](./Images/3.png)

## Creating and Managing Hanging Protocols

### Adding and Editing Protocols

- **Creating New Protocols**: Click the "+" icon to initiate the
  creation of a new protocol. Customize by dragging and dropping view
  codes into the desired viewports.

  ![Mastering Hanging Protocols](./Images/4.png)

- **Editing Protocols**: Hover over an existing protocol to see options
  such as accessing configuration settings (information icon) or
  deleting the protocol (delete icon).

  ![Mastering Hanging Protocols](./Images/5.png)

### Configuring Viewport Display

- **Tile Mode Setup**: This option allows you to configure whether the
  viewport displays images in tile mode or stack mode, along with
  choosing a layout for tile mode.

  ![Mastering Hanging Protocols](./Images/6.png)

  ![Mastering Hanging Protocols](./Images/7.png)

- **Prior Study Display**: Set up viewports to display prior studies by
  selecting the appropriate prior from the menu. Adjustments include
  matching models and labeling for clarity in the viewport.

  ![Mastering Hanging Protocols](./Images/8.png)

## Advanced Configuration Options

### Manipulations

- **Orientation and Windowing**: Customize image orientation (e.g.,
  flipping, rotating) and window settings (manual or preset
  adjustments).

  ![Mastering Hanging Protocols](./Images/9.png)

  ![Mastering Hanging Protocols](./Images/10.png)

- **Scaling**: Set the zoom level or fit options to optimize how images
  fill the viewport.

  ![Mastering Hanging Protocols](./Images/11.png)

### Toggles for Enhanced Viewing

- **Linking and Scrolling**: Configure settings for linking series in
  the same plane and scrolling through series within a viewport.

- **Visibility Toggles**: Control the display of annotations, findings,
  overlays, and reference lines. Activate cine mode as needed.

  ![Mastering Hanging Protocols](./Images/12.png)

### Conditions for Filtering

- **Filtering with DICOM Tags**: Define conditions to filter series
  based on specific DICOM tags, enhancing the relevance of displayed
  images.

  ![Mastering Hanging Protocols](./Images/13.png)

## Prior Matching Model Configuration in OmegaAI

The Prior Matching Model Configuration in OmegaAI allows users to define
how previous studies are matched to current studies based on a variety
of criteria. This functionality is crucial for ensuring relevant
historical data is accessible and appropriately aligned with new imaging
studies for diagnostic assessments.

### Accessing the Prior Matching Model

To access the Prior Matching Model Configuration:

1.  **Open the Configuration Drawer**: This drawer includes all the
    prior matching models that you have created. The model currently in
    use for the hanging protocol will be highlighted.

2.  **Default Model Identification**: A default label indicates the
    model that is set as the default for all hanging protocols.

### Creating and Editing Matching Models

#### Adding a New Model

- **Create New Model**: Select **Matching Model** option from the
  dropdown, then click the "+" icon at the top of the drawer to initiate
  the creation of a new matching model.

  ![Mastering Hanging Protocols](./Images/14.png)

  ![Mastering Hanging Protocols](./Images/15.png)

#### Managing Existing Models

- **Edit or Delete**: Click on the three dots beside any existing model
  to open options for editing, deleting, or setting it as the default
  model.

  ![Mastering Hanging Protocols](./Images/16.png)

#### Configuration Options

Model Name

**Purpose**: Serves as the identifier for the matching model.

Body Part

**Default**: Automatically set to match the body part of the current
study.

**Customization**: Allows specification of one or more body parts for
matching.

Study Date

**Range**: Defines the timeframe within which to search for prior
studies, up to a maximum of 360 months from the date of the current
study.

Study Status

**Default**: Set to match the status of the current study by default.

**Custom Options**: Enables the inclusion of specific study statuses in
the matching model.

Modality

**Default**: Set to match the modality of the current study by default.

**Multiple Modalities**: Allows selection of additional modalities to be
included in the matching.

Laterality

**Default**: Matches the laterality of the current study by default.

**Additional Options**: Permits the addition of more laterality options
if required.

Procedure Code

**Default**: Matches the procedure code of the current study by default.

**Expansion**: Allows adding more procedure codes to the matching model.

Study Description

**Functionality**: A text search field that enables keyword searches
within study descriptions.

**Criteria Options**: Includes the ability to specify text using options
like includes, not includes, equals, or not equal.

#### Finalizing the Model

Once you have configured the desired settings:

- **Save Changes**: Click **Save** to apply and save the modifications
  or the creation of a new matching model.

## Publishing Hanging Protocols in OmegaAI

Publishing hanging protocols in OmegaAI involves finalizing the
configurations and settings of a protocol to ensure it is tailored for
specific clinical needs and then making it available for use within an
organization or for individual users. This process is crucial for the
efficient application of standardized viewing settings across different
studies and modalities.

### Steps for Publishing Hanging Protocols

#### Saving the Protocol

1.  **Finalize Configurations**: Ensure all desired changes and settings
    are properly adjusted in your hanging protocol.

2.  **Save the Protocol**: Click the **+** icon and then "Save" to save
    your configured hanging protocol.

    ![Mastering Hanging Protocols](./Images/17.png)

#### Setting Protocol Details

When saving a hanging protocol, you will need to provide specific
details to ensure the protocol is appropriately applied and accessible:

- **Protocol Name**: Enter a unique name for the hanging protocol to
  easily identify it later.

- **Organization Selection**: Choose the specific organization within
  which the hanging protocol will be used. This determines the scope of
  accessibility.

- **Modality**: Define which modalities (e.g., MRI, CT, X-ray) the
  hanging protocol should be applied to. This ensures that the protocol
  is only used with relevant imaging studies.

- **Procedure Code**: Specify the procedure codes that this hanging
  protocol is designed for. This narrows down its application to
  specific types of studies.

- **Body Part**: Indicate which body parts are relevant for this hanging
  protocol, ensuring it is triggered appropriately based on the images
  being viewed.

- **Laterality**: Determine if laterality (left, right, bilateral)
  should be considered in the application of the hanging protocol.

  ![Mastering Hanging Protocols](./Images/18.png)

#### Accessibility and Usage Level

- **Level Selection**: Choose between "Site" or "User" level for
  protocol accessibility:

  - **Site Level**: The hanging protocol will be available to all users
    within the selected organization, allowing for wide usage and
    modifications.

  - **User Level**: The protocol will be accessible only to your user
    account, making it private and tailored to your specific needs.

#### Setting as Default

- **Default Protocol**: You have the option to set this hanging protocol
  as the default for the specified modality. This means it will
  automatically be applied unless another specific protocol is chosen.