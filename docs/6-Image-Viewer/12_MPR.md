---
sidebar_position: 12
title: Multi-Planar Reconstruction (MPR) Mode 
tags:
  - MPR Mode
  - Multi-Planar Reconstruction
  - CTS Study
  - Multi-Frame Series
  - Viewport Menu
  - Axial
  - Sagittal
  - Coronal
  - Crosshair
  - Stack Scroll
  - Pan
  - Zoom
  - Rotate
  - Window Level
  - Mouse Wheel Scrolling
---
# Multi-Planar Reconstruction (MPR) Mode

## Overview

OmegaAI includes a feature known as Multi-Planar Reconstruction (MPR) M
ode, essential for viewing complex imaging data in three orthogonal
planes: axial, sagittal, and coronal.

## Activate MPR Mode

1.  **Starting Condition**: Ensure you are within a CT-Scan study on
    OmegaAI. MPR Mode requires a multi-frame series with locational data
    suitable for reconstruction.

2.  **Accessing MPR Mode**:

    - Navigate to the viewport displaying the relevant series.

    - Open the viewport menu. If the series supports MPR reconstruction,
      you will find an option to activate MPR Mode.

    - Select the MPR Mode option. If unavailable, the series does not
      support MPR and will not display the option.

    ![1](./img/MPR1.png)

## Interface and Navigation in MPR Mode

Upon entering MPR Mode, the interface adjusts to display three
viewports, each corresponding to one of the orthogonal planes:

- **Axial Viewport**: Marked with a red dot at the top right corner.

- **Sagittal Viewport**: Marked with a green dot.

- **Coronal Viewport**: Marked with a yellow dot.

Each viewport will also display a full-screen crosshair with color-coded
lines correlating with the view they represent:

- **Red Line**: Axial

- **Green Line**: Sagittal

- **Yellow Line**: Coronal

  ![2](./img/MPR2.png)

## Tools and Functionalities

- **Enabled Tools**: Stack scroll, pan, zoom, rotate, and window level
  adjustments are active.

- **Disabled Tools**: Some tools might be disabled in this mode to
  ensure stability and performance.

- **Frame Navigation**: Use the mouse wheel to scroll between frames.
  Frame number and total frames are indicated via overlay annotations.

- **Crosshair Interactivity**:

  - **Square Node** (near center): Drag to adjust the thickness of the
    Maximum Intensity Projection (MIP) slab in that specific plane.

  - **Circular Node** (further from center): Drag to rotate the axes
    around the center.

## Obliquity Lines in MPR Mode

OmegaAI's MPR mode now features two obliquity lines for more precise control and orientation adjustments within PET/CT studies.

**Key Functionalities:**

  - Independent Movement: Clicking on a line’s circle node enables independent rotation, allowing one line to move without affecting the other.
  - Synchronous Movement: Clicking outside the circle rotates both lines together, maintaining alignment for broader adjustments.
  - View-Specific Control: Adjustments in one viewport (e.g., axial) do not impact the obliquity lines in other views (e.g., sagittal or coronal), preserving view-specific configurations.
