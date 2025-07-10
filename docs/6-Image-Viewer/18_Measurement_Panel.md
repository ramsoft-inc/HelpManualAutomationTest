---
sidebar_position: 18
title: Measurement Panel
tags:
  - Measurement Panel
  - Image Viewer
  - DICOM Annotations
  - User Interface
  - Measurement Management
---
# Measurement Panel

## Overview

The Measurement Panel in OmegaAI is a user interface element designed
for managing and reviewing measurements and annotations within the
medical imaging software. It is located on the right side of the image
viewer. By default, this panel is collapsed but can be expanded to
display a range of functionalities tailored for handling measurement
data associated with medical images.

## Accessing the Measurement Panel

To access the Measurement Panel:

1.  Locate the icon on the right side of the image viewer. This icon
    represents the Measurement Panel.

2.  Click on the icon to expand the drawer and reveal the measurement
    tools and data.

    ![1](./img/Measurement1.png)

## Functionality of the Measurement Panel

The Measurement Panel provides several options for managing and
interacting with measurements:

![2](./img/Measurement2.png)


1.  **Visibility Toggle:**

    - Each measurement in the panel has an eye icon to its left.

    - Click on the eye icon to toggle the visibility of that specific
      measurement.

2.  **Editing Measurements:**

    - Hover over a measurement item to see the pen icon, which indicates
      editability.

    - Click on the pen icon to rename or edit the measurement label.

3.  **User Identification:**

    - A circle with the initials of the user who created the measurement
      appears next to each entry.

    - Hovering over this circle displays the full name of the user.

4.  **Deleting Measurements:**

    - To delete a measurement, click and hold on the 'Delete' option
      next to the respective measurement.

5.  **Filtering Measurements:**

    - The Measurement Panel allows filtering of measurements and
      annotations by type, such as measurements, annotations, SR
      objects, and CAD findings.

    - Select from the dropdown menu to filter measurements by their
      respective types. The default setting is 'All'.

      ![3](./img/Measurement3.png)


6.  **Adding and Deleting Measurements Outside the Panel:**

    - Pressing 'Delete' on the keyboard removes the last created
      measurement or a selected measurement.

    - This functionality works without the Measurement Panel being open.

## Non-Persistent Visibility

- Any changes to the visibility of measurements in the Measurement Panel
  are temporary. After refreshing the browser or logging in again, all
  measurements will be displayed.

- Visibility settings do not impact other users.

## DICOM 6K Annotations

- Note that while the system supports DICOM 6K annotations, these are
  not displayed in the Measurement Panel.