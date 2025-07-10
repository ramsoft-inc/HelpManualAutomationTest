---
sidebar_position: 8
title:  Study Explorer and Image QC Module
tags:
  - Study Explorer
  - Image Quality Control (QC) Module
  - Patient Demographics
  - Study Filtering
  - Series Management
  - Importing Media
  - Viewports
---
# Study Explorer and Image QC Module

## Overview

The Study Explorer in OmegaAI serves as an essential tool for both
navigating and managing medical imaging studies, as well as performing
detailed quality control checks. This guide provides an in-depth
explanation of the functionalities available in the Study Explorer and
Image QC Module, focusing on patient information handling, study and
series management, and the importation and viewing of various media
types.

## Components and Functionalities

1.  **Patient Banner and Demographic Information**:

    - **Overview**: At the top of the Study Explorer, the patient banner
      displays essential demographic information such as the patient ID,
      confidentiality status, phone number.

    - **Expansion for More Details**: By hovering your mouse over the
      patient banner, it expands to reveal additional information. This
      expanded view is critical for gaining a understanding of the
      patient's background and the specifics of their associated
      studies.

      ![1](./img/StudyExplorer1.png)

2.  **Study Cards and Filtering Options**:

    - **Study Representation**: Each patient's study is represented on a
      study card, which includes the date of the study, the modalities
      used, and a brief description of the study.

    - **Visibility and Filtering**: A blue dot indicates the study
      currently displayed on the screen. Above the study cards, there
      are three filtering options to tailor the view:

      - Filter to show only the current study.

      - Filter to show only prior studies.

      - A view that displays all studies.

      ![2](./img/StudyExplorer2.png)
      
3.  **Thumbnail Navigation and Series Management**:

    - **Thumbnail Details**: Each study card shows thumbnails for series
      and individual images. Thumbnails for multi-frame images display
      the total frame count.

    - **Series Interaction**:

      - Hovering over a thumbnail presents three interactive options:

        - A circular checkbox to select the series, which brings up a
          lower menu for further actions.

        - An **X** icon to deselect the series.

        - A **trash bin** icon allows for series deletion by holding the
          left mouse button until the action completes.

        - A **plus (+)** icon to initiate the creation of a new study
          from the selected series, requiring input for the imaging
          organization and study set.

     - User can easily drag and drop the images to a different study in the Study Explorer to reparent the study.     

4.  **Loading Series to Viewports**:

    - **Drag and Drop**: Series can be loaded into specific viewports by
      dragging and dropping them onto the desired viewport.

    - **Double Clicking**: Alternatively, double-clicking on a series
      thumbnail loads it into the currently active viewport. This method
      provides a quick and efficient way to view series without
      adjusting viewport arrangements manually.
    - Note: When the study is loaded, the first viewport will be automatically selected.

5.  **Advanced Options and Importing New Objects**:

    - **Renaming and Merging**: Additional options include renaming
      series or merging multiple selected studies. An unmerge option is
      also available for studies created by merging different studies.

    - **Import Functionality**: New objects such as JPEG images, DICOM
      objects, PDFs, or RTF documents can be imported by dragging and
      dropping into the Study Explorer. A dialogue box will appear,
      offering different handling options based on the file type,
      enhancing the flexibility in managing study materials.
   - User can click on the delete button on the viewport or within the Study Explorer to delete a frame or a series.
