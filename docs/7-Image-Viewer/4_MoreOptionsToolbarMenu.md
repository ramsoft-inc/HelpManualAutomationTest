---
sidebar_position: 4
title: More Options Toolbar Menu in OmegaAI Image Viewer
tags:
  - More Options
  - Download Study
  - toggles
  - Mouse presets
  - calibration tool
  - save bookmarks
  - Pop Up Window
  - Toggle Overlay
  - Link Series
  - Display Settings
  - Customize Wheel
  - Full Screen Mode
---
# More Options Toolbar Menu in OmegaAI Image Viewer

## Overview

The "More Options" menu (3 dots menu) in the OmegaAI Image Viewer
toolbar offers a variety of functionalities that enhance user
interaction with medical images.

This menu provides tools for downloading studies, managing view
settings, linking series, and more, all aimed at optimizing the viewing
and handling of medical imaging data.

## Accessing the More Options Menu

To open the menu:

1.  Open a study in the **Image Viewer**.

![More](./img/motm_1.png#small)

2.  Locate the **⋮ (three-dot) icon** in the top toolbar.

3.  Click the icon to expand the **More Options** dropdown.

![More](./img/motm_2.png#small)


## Features of the More Options Toolbar Menu

Select the desired tool or settings from the list.

## Burn Study

This feature allows users to burn the current study onto a CD or DVD.
Initiates the download of a small executable file to enable image and
document burning and displays the Size of the Study that will be burnt
on the disc, helping users confirm that the contents will fit on the
selected media.

If there are no documents or images in the study, the size will be shown
as 0 MB.

![More](./img/motm_3.png#small)

## Toggles

The **Toggles** submenu provides quick on/off controls for commonly used
display elements within the Image Viewer. These options will help users
customize the viewing environment without the need to navigate to the
full settings panel.

You can click any toggle to enable or disable it.

- A **blue checkmark (✓)** indicates that the option is active.

![More](./img/motm_4.png#small)

**Available Toggle Options**

### 1. Overlay

- **Function:** Shows or hides the informational overlay displayed on
  the images.

- **Includes:** Patient details, study metadata, image orientation,
  slice number, zoom level, and other contextual information.

- **Use Case:**

  - Enable overlays for detailed review and orientation guidance.

  - Disable overlays for presentation, screenshots, or an unobstructed
    viewing experience.
    
![More](./img/motm_5.png#small)

![More](./img/motm_6.png#large)

<u>*[Learn more about customizing overlays](https://help.omegaai.com/docs/Image-Viewer/Customize_Overlay_Annotations_in_OmegaA)*</u>

### 2. Scout Lines

- **Function:** The **Scout Line** feature visually links the **scout
  (localizer) image** with the corresponding **cross-sectional images**
  (CT, PT or MR slices). When enabled, a horizontal or vertical
  reference line appears on the scout image, indicating the exact
  anatomical position of the currently displayed slice in the image
  viewer.

- **Use Case:**

  - Quickly understand slice location within patient anatomy

  - Correlate axial/sagittal/coronal images with the scout

  - Navigate large image stacks more confidently

  - Improve anatomical orientation during review

The scout line updates dynamically as you scroll through images,
providing real-time spatial feedback.

![More](./img/motm_7.png#small)

![More](./img/motm_8.png#medium)


### 3. Calibration Ruler

- **Function:**
  Displays or hides an on-screen **calibration ruler**, which represents
  real-world measurement units (e.g., centimeters or millimeters). The
  ruler provides a visual reference scale adjacent to the image,
  allowing users to interpret anatomical size and proportion accurately.

- **Use Cases:**

- Useful for **quick visual estimation** of anatomical size, depth, or
  spatial relationships.

- Recommended for **measurement-related workflows**, such as lesion
  assessment, planning, or quality control.

- May be **disabled** when generating clean screenshots, exporting
  images, or preparing teaching materials where the scale is not
  needed.
  
![More](./img/motm_9.png#small)

![More](./img/motm_10.png#large)

*Learn more about the Calibration tool*

## Link Series

**Purpose**
The Link tool allows users to synchronize multiple images or series
across viewports. When linking is enabled, interactions such as
scrolling, zooming, and positioning are mirrored across the linked
viewports.

**Useful for**
Comparing images from different time points, modalities, or anatomical
regions---enables efficient side-by-side analysis.

**Link Menu Modes**

- **Unlink** -- Disables synchronization between viewports.

- **Manual Link** -- Allows users to manually link selected viewports
  for synchronized viewing.

- **Plane Link** -- Links viewports based on anatomical planes (e.g.,
  axial, sagittal, coronal) for coordinated multi-plane navigation.

![More](./img/motm_11.png#small)

## Download

The Download tool enables users to export imaging content directly from
the Image Viewer for sharing, reporting, or offline reference and audit
purposes. Users can either download the complete study in DICOM format,
including all series and images, or download a single displayed image
along with its annotations from the active viewport.

![More](./img/motm_12.png#small)

##  Mouse Presets

Mouse Presets define how mouse buttons and the scroll wheel behave in
the Image Viewer. These presets are modeled after commonly used
radiology PACS vendors, allowing users to work with familiar mouse
controls for tasks such as window/level adjustment, panning, zooming,
measurements, and scrolling through image stacks or series.

Each preset maps specific viewer actions to:

- **Left Click**

- **Right Click**

- **Middle Click**

- **Left + Right Click (Hold & Drag)**

- **Scroll Wheel**

This approach ensures a smoother transition for users to move between
different PACS systems and helps maintain efficiency in daily radiology
workflows.

**How to Access Mouse Presets**

1.  Open a study in the **Image Viewer**.

2.  Click the **More Options (⋮)** menu located in the viewer toolbar.

3.  Select **Mouse Presets** from the dropdown menu.

4.  Choose the preset that matches your preferred vendor workflow (e.g.,
    RamSoft/Fuji, GE/eRAD, Visage, Sectra).

5.  The selected preset is applied immediately and remains active until
    changed.

![More](./img/motm_13.png#small)

**Mouse Preset Options:**

| Viewer (Vendor) | Left Click (Default Tool)            | Right Click        | Middle Click | L+R Hold and Drag | Scroll Wheel                                                                 |
|-----------------|--------------------------------------|--------------------|--------------|-------------------|-------------------------------------------------------------------------------|
| RamSoft, Fuji   | **Scroll** (or selected tool)         | **Window/Level**   | **Zoom**     | **Pan**           | Image scroll, Series scroll                                                    |
| GE, eRAD        | **Pan** (or selected tool)            | **Window/Level**   | –            | **Zoom**          | Image scroll, Series scroll, navigation based on modality settings            |
| Visage          | **Scroll** (or selected tool)         | **Pan**            | **Zoom**     | **Window/Level**  | Image scroll, Series scroll                                                    |
| Sectra          | **Pan** (or selected tool)            | **Window/Level**   | **Zoom**     | **Scroll**        | Image scroll, Series scroll                                                    |

## Settings

The Settings menu provides access to configuration and customization
options for the Image Viewer. It allows users to control viewing
behavior, personalize tools and overlays, manage calibration and DICOM
metadata display, and adjust workflow preferences such as bookmarks,
viewport behavior, and tool resets to support efficient and consistent
image review.

![More](./img/motm_14.png#small)

## 1. Hanging Protocols

- **Purpose:** Allows users to customize existing hanging protocols or
  create new ones.
- **Functionality:** Users can adjust the layout, sequence, and display
  preferences based on study details. Customizing hanging protocols
  enables more efficient review processes tailored to specific
  modalities or types of studies.

<u>*[Learn more about Hanging Protocols](https://help.omegaai.com/docs/Image-Viewer/Hanging_Protocols_in_OmegaAI)*</u>

## 2. Customizing Overlay

- **Purpose:** Enables customization of overlay information on the image
  viewports.
- **Functionality:** Users can choose which patient data, study
  information, and annotations appear directly on the images. This tool
  supports selecting data fields such as patient name, study date, and
  acquisition time, helping radiologists focus on relevant data without
  excess screen clutter.

<u>*[Learn more about Customizing Overlay](https://help.omegaai.com/docs/Image-Viewer/Customize_Overlay_Annotations_in_OmegaAI)*</u>

## 3. Customizing Toolbar

- **Purpose:** Allows modification of the toolbar layout.
- **Functionality:** Users can add, remove, or rearrange tools to match
  their workflow, supporting a more streamlined experience. This
  includes moving tools like zoom, measure, annotate, and adjusting
  presets to the desired positions.

<u>*[Learn more about Customizing Toolbar](https://help.omegaai.com/docs/Image-Viewer/Image_Viewer_Toolbar#customizing-your-toolbar)*</u>

## 4. Customizing Wheel

- **Purpose:** Provides options for modifying the tool wheel.
- **Functionality:** Users can organize and update tools within the tool
  wheel for quicker access. This feature enhances navigation by placing
  the most frequently used tools at the forefront.

<u>*[Learn more about Customizing Wheel](https://help.omegaai.com/docs/Image-Viewer/Customizingimageviewer)*</u>

## 5. Calibration Tool

**Accessing the Calibration Tool**

1.  Open the **OmegaAI Image Viewer**.

2.  Select the required viewport.

3.  Click the **More Options (⋮)** menu in the toolbar.

4.  From the **Settings** section, select **Calibration Tool**.

![More](./img/motm_15.png#small)

**Using the Calibration Tool:**

1.  After selecting the **Calibration Tool**, the cursor changes to a
    **line icon**, indicating that calibration mode is active.

2.  The user can draw a straight reference line on the image within the
    active viewport to define the measurement scale.

![More](./img/motm_16.png#medium)

3.  Once the line is drawn, the **Calibrate Ruler** dialog box appears
    automatically.

4.  In the dialog box:

- Enter the actual real-world measurement corresponding to the drawn
  line.

- Select the appropriate unit from the available options: **mm**,
  **cm**, or **inches**.

![More](./img/motm_17.png#medium)

5.  Click **Save** to apply and finalize the calibration.

- Once calibration is completed, all subsequent measurements in the
  viewport will be displayed using the calibrated scale.

## 6. DICOM Header Tags

- **Purpose:** Displays the DICOM header information.
- **Functionality:** This section provides an overview of DICOM header
  metadata, which is essential for clinical image interpretation and
  validation.

<u>*[Learn more about DICOM Header Tags](https://help.omegaai.com/docs/Image-Viewer/DICOM_Tag_Browser_Feature)*</u>

## 7. Toggle Auto Open Study Explorer

- **Purpose:** Controls the automatic opening of the Study Explorer upon
  launching the Image Viewer.
- **Functionality:** Users can toggle this feature on or off to
  automatically view the Study Explorer or start directly in the main
  viewer. This can improve focus by minimizing navigation steps.

<u>*[Learn more about Study Explorer](https://help.omegaai.com/docs/Image-Viewer/Study_Explorer_and_Image_QC_Module)*</u>

## 8. Toggle Reset Markup Tools

- **Purpose:** Manages the automatic reset behavior of markup tools.
- **Functionality:** When enabled, this setting resets markup tools back
  to the pointer tool after each use, allowing users to quickly return
  to a neutral tool without additional clicks.

Learn more about Markup Tools

## 9. Toggle Autohide Viewport Menu

- **Purpose:** Controls the visibility of the viewport menu.
- **Functionality:** Users can toggle this setting to automatically hide
  or show the viewport menu for a cleaner workspace. When enabled, the
  menu remains hidden until the user actively interacts with it.

Learn more about Viewport Menu

## 10. Save Bookmarks Feature

#### Purpose

The **Save Bookmarks** feature allows users to control whether the Image
Viewer should automatically retain or discard layout and tool changes
made during a viewing session. This provides users with the flexibility
to maintain their personalized viewing setup or revert to the default
layout after closing a study. It helps streamline workflows by avoiding
repetitive reconfiguration between studies.

Each user can view and manage only their own saved viewer state.

#### Functionality

• When **"Save Bookmarks"** is **enabled**, all changes made to the
viewer layout and tools are automatically saved and persist in future
sessions.

• When **disabled**, any changes made during the session are temporary
and revert once the session ends, restoring the default bookmark state.

#### Viewer Configurations Saved with Bookmarks

The following viewer settings are preserved when bookmarks are saved:

• Viewport layout and location

• Viewing protocol

• Scout line display

• Study Explorer orientation and height

• Maximize/Restore viewport state

#### Recommended Usage

• **Enable** Save Bookmarks if you frequently customize your viewer
layout and want to maintain those settings across sessions.

• **Disable** Save Bookmarks if you prefer starting with a default
layout each time or are demonstrating temporary configurations.

## 11. About Image Viewer

- **Purpose:** Accesses general information about the Image Viewer.
- **Functionality:** Opens the "About" section, where users can view
  software version details, user guides, and other application-related
  information.

Display & Viewing Options

![More](./img/motm_18.png#medium)

1.  **Popout in Window**

Allows you to open the current image in a separate window.

2.  **Fullscreen Mode (Toggle Button)**

The Fullscreen Mode allows you to view the active image in full-screen
display for an enhanced, distraction-free viewing experience.

Click the toggle button to enter full-screen mode. Click the toggle
again to exit full-screen mode and return to the standard viewer layout.

<u>*[Learn more about Configuring Monitor Settings](https://help.omegaai.com/docs/Communication-and-Organization-Tools/Omegaai%20Multimonitor%20Guide)*</u>

 • **Disable** Save Bookmarks if you prefer starting with a default
  layout each time or are demonstrating temporary configurations.
