---
sidebar_position: 6
title: DICOM Tag Browser 
tags:
  - DICOM Tag Browser
  - Image Viewer
  - Series Selection 
  - Object Selection
  - Tag Search
  - Download Study
  - Third Party DICOM Browser
---

# DICOM Tag Browser 

## Overview

The DICOM Tag Browser is an integrated feature within the OmegaAI Image
Viewer that enables users to access detailed metadata about the images
in a study. This tool provides an interface for viewing and searching
tags related to the DICOM (Digital Imaging and Communications in
Medicine) files.

## Accessing the DICOM Tag Browser

1.  **Open Image Viewer**: Launch the OmegaAI Image Viewer where your
    medical imaging files are accessible.

2.  **Navigate to More Options**: In the Image Viewer, locate and click
    on the 3 dot **More Options** menu. This can typically be found on
    the toolbar or under a settings icon.

3.  **Select DICOM Header Tags**: From the drop-down menu, click the
    **DICOM Header Tags** option. This action will trigger the DICOM Tag
    browser panel to open on the right side of the screen.
    
    ![1](./img/DICOMTag1.png)

## Using the DICOM Tag Browser

Once the DICOM Tag Browser is activated, you will see a new panel on the right side of your screen. Here's how to navigate and use this panel:


1.  **Panel Layout**: The panel is positioned at the top right of the
    screen, providing a clear and unobstructed view of the image data.

2.  **Series and Object Dropdown Menus**:

    - **Select Series**: The left dropdown menu allows you to select a
      series within the study. A series typically consists of a specific
      set of related images.

    - **Select Object**: The right dropdown menu enables you to select
      an object within the chosen series. These objects are individual
      images or data points.

    - **Automatic Selection**: Clicking on a viewport automatically
      selects the corresponding series and object, aligning the DICOM
      tags displayed with the image or data you are viewing.

3.  **Viewing and Searching Tags**:

    - **Columns**: Tags are presented in four columns within the panel:
      Tag Number, Type of Tag, Value Stored in the Tag, and Name of the
      Tag.

    - **Searching Tags**: To search within these columns, hover over the
      column header, click, and then enter your search term in the
      search box that appears. This feature allows you to quickly find
      specific tags by any of the listed attributes.

## Important Note on Tag Visibility

Please note that to enhance the performance of the Image Viewer, not all
DICOM headers present in the DICOM objects will be displayed in the Tag
Browser. If you require access to all DICOM headers:

- **Download the Study**: You can download the entire study to your
  local machine.

- **Use a Third-Party DICOM Browser**: Once downloaded, you can open the
  study using a third-party DICOM browser to view all available DICOM
  headers.
