---
sidebar_position: 17
title: Mammography Features
tags:
  - Mammography Viewer
  - Image Synchronization
  - Hanging Protocols
  - DICOM Metadata
  - CAD (Computer-Aided Detection)
---
# Mammography Features

## Overview

OmegaAI Image Viewer is equipped with specialized features designed to
enhance the viewing and analysis of mammography studies. This section
provides a detailed overview of these features, including image
synchronization, annotations, hanging protocols, and CAD object
detection.

![1](./img/Mammography1.png)

## Image Synchronization and Mirroring

The image viewer allows for side-by-side comparison of mammography
images from different laterality'right and left. This functionality is
enhanced by a synchronization feature that mirrors movements across the
two sides. This means that when you adjust the view on one side, the
corresponding area on the opposite side is adjusted in a mirrored
fashion, facilitating easier comparison of similar areas across
different images.

## Enhanced Annotations

During mammography viewing, annotations and image views are displayed
prominently. The viewer automatically increases the font size of overlay
annotations to improve readability. This is useful when annotations
contain critical information about the mammography study.

## Mammography Hanging Protocols

Users can select from 10 predefined mammography hanging protocols, each
tailored to the types of views available in the study. These protocols
help streamline the workflow by automatically organizing the images
according to the predefined stages of viewing.

![2](./img/Mammography2.png)

## Auto-Rotation and Alignment

The viewer possesses the capability to auto-rotate images based on the
laterality information contained within the DICOM metadata. This ensures
that images are always presented in the correct orientation.
Additionally, overlay alignments are adjusted automatically depending on
the image's laterality; for instance, overlays on right-laterality
images are aligned to the left, and vice versa.

## CAD Object Notification

When reviewing mammography images, if a CAD (Computer-Aided Detection)
object is present, the system notifies the user by displaying a brief
message at the lower part of the viewport. This feature helps in quickly
identifying significant findings.

## CAD Object Display Controls

Within the hanging protocols, users have the option to define visibility
settings for CAD objects. These settings determine whether CAD objects
should be visible at a specific stage or protocol. Furthermore, CAD
objects can be toggled on and off directly from the viewport menu,
providing users with flexibility in how they review and analyze images.

## Measurement Panel and CAD Detection

The measurement panel updates to display an entry whenever a CAD object
is detected in the active viewport. This feature assists in the
quantitative analysis of the findings and ensures that all detected
objects are accounted for during the study review.