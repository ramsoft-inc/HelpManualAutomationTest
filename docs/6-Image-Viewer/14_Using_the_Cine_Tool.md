---
sidebar_position: 14
title:  Using the Cine Tool
tags:
  - Cine Tool
  - Ultrasound
  - Multi-frame Series
  - CT
  - MR
  - XA
  - DICOM
  - FPS
  - Viewport
  - Playback
  - Hanging Protocols

---
# Using the Cine Tool

## Overview

The Cine tool in OmegaAI is designed for real-time viewing of medical
imaging studies, such as Ultrasound, CT (Computed Tomography), MR
(Magnetic Resonance), and XA (X-ray Angiography). It enables users to
efficiently navigate through large multi-frame series without repetitive
manual interaction, enhancing the review process. This tool is
particularly useful in dynamic imaging where frame-by-frame analysis is
essential.

## Accessing the Cine Tool

1.  **Visibility and Activation:** The Cine tool is available only if
    the loaded study contains more than two images. It can be accessed:

    - Via the Cine icon located at the bottom of the viewport menu

    - From the toolbar

    - By pressing the "C" key, which serves as a hotkey for quick access

      ![1](./img/Cine1.png)

## Cine Tool Interface and Functions

Once activated, the Cine tool GUI (Graphical User Interface) appears
with several control options:

1.  **Go to First Frame:** Jumps directly to the first image of the
    series.

2.  **Move to Previous Frame:** Steps back to the previous image in the
    series.

3.  **Play/Stop:** Starts or stops the automatic playback of frames.

4.  **Move to Next Frame:** Advances to the next image in the series.

5.  **Move to Last Frame:** Moves directly to the last image of the
    series.

6.  **FPS (Frames Per Second) Indicator:** Shows the current frames per
    second rate. FPS can be adjusted by clicking and holding the left
    mouse button and dragging left or right. The FPS rate is set based
    on DICOM data for the selected series (active viewport), or a
    default value is used based on the series modality if no DICOM data
    is available.

    ![2](./img/Cine2.png)
    ![3](./img/Cine3.png)
    ![4](./img/Cine4.png)
    > **Note**: The Cine GUI can be moved within the viewport by dragging
    > and dropping it.

    ![5](./img/Cine5.png)

## Additional Features

- **Playback Progress Indicator:** An indicator at the top of the GUI
  displays the progress of the playback.

- **Automatic Playback in Hanging Protocols:** As part of the hanging
  protocols configuration, users can set the viewport to autoplay the
  cine when a study is opened, facilitating a more streamlined workflow.

## Using the Cine Tool Effectively

- To enhance workflow efficiency, familiarize with the hotkeys and GUI.

- Utilize the FPS adjustment feature to match the pace of image review
  to the specific requirements of the study being analyzed.

### Practical Example

In a clinical scenario where rapid assessment of a cardiac function is
required through an echocardiogram, the Cine tool allows clinicians to
play through the echocardiogram's image series swiftly, pause at
critical frames, or review specific segments repeatedly to ensure
accurate analysis and diagnosis.
