---
sidebar_position: 7
title: Custom Overlay Annotations in OmegaAI
tags:
  - Customize Overlay
  - Display Settings
  - Annotations 
  - Viewport
  - DICOM Tags
---
# Customize Overlay Annotations in OmegaAI

## Overview

OmegaAI provides a sophisticated feature that allows users to customize
overlay annotations on images. This guide will walk you through
accessing and configuring overlay annotations to enhance your
visualization needs. The overlay customization interface supports
detailed adjustments to each side of an image viewport, along with
options for font and color changes.

![1](./img/CustomizeOverlay1.png)

## Accessing Overlay Customization Settings

1.  **Open More Options**: Start by navigating to the 'More Options'
    menu within the OmegaAI software interface.

2.  **Display Settings**: In the 'More Options' menu, select 'Display
    Settings'.

3.  **Overlay Customizations**: Within the 'Display Settings', choose
    'Overlay Customizations'. This will take you to the customization
    screen.

## Customizing Viewport Sides

You can customize annotations on any of the eight sides of each
viewport:

- Top Left

- Top

- Top Right

- Right

- Bottom Right

- Bottom

- Bottom Left

- Left

To customize, simply click on the area you wish to modify. Here you can:

- Add free text.

- Select from predefined annotations.

- Delete existing annotations (if not required).

  ![2](./img/CustomizeOverlay2.png)

## Minimal and Full Overlay Annotations

- **Automatic Adjustment**: If the viewport size is smaller than 500
  pixels, OmegaAI automatically switches to minimal overlays to ensure
  clarity and usability.

- **Toggle Option**: You can toggle between minimal and full overlays
  using the switch located at the top left of the customization screen.

## Font and Color Settings


- **Font Selection**: Click on the farmer's name adjacent to 'System Font' at the top left of the screen to change the font.

- **Color Adjustment**: Click on 'Color' to open a palette and select
  your preferred color for the annotations. The chosen color will be
  applied to all annotations across the viewports.

## Using DICOM Tags

- **Tag Integration**: By using the hashtag (#) in the annotation field,
  you can bring up a search menu to locate available DICOM tags.

- **Adding Tags**: Enter the DICOM tag directly or search for it to add
  specific data points to your annotations. These tags might include
  patient study information or calculated data not typically available
  as DICOM data.

## List of Formatted Annotations

|**Keyword (Name)**|**Source of Value**|**Displayed Format**|
| :- | :- | :- |
|Window Center & Width|0028,1050 + 0028,1051|C+tag value-W+tagvalue<br/>example:<br/>C150-W210|
|Sharpness & Unsharp Mask Degree |0016,004A + 310d,1020|<p>S+ tag value - U: + tag value</p><p>example:</p><p>S122 - U444</p>|
|Convolution Kernel|(0018,1210) |**CK:** + tag value|
|Acquisition Matrix|0018,1310|**ACQ Matrix:** + tag value|
|Number of averages|0018,0083|**NEX:** + tag value|
|Echo Train Length|0018,0091|**ETL:** +tag value|
|MR Acquisition Type|00180023|**MAT:** + tag value|
|Sequence Name|00180024|**SEQ:** + tag value|
|Sequence Variant |00180021|**SV:** + tag value|
|Patient ID|(0010,0020) |**PID:** + tag value|
|Date of Birth|(0010,0030)|**DOB:** + tag value|
|Study ID|(0020,0010)|**SID:** + tag value|
|Series Number|(0020,0011)|**S#:** +tag value|
|Sex|0010,0040|**Sex:** +tag value|
|Slice Thickness: + “ mm”|(0018,0050)|**ST:** +tag value+ **mm**|
|Spacing Between Slices: |(0018,0088)|**SBS:** +tag value+ **mm**|
|Contrast Agent|(0018,0010) |trim at 30 characters|
|KVP|0018,0060|**KVP:** +tag value|
|Exposure|0018,1152|**Exp:** + tag value+ **mAs**|
|Exposure Time |0018,1150|**ET:** + tag value+ **ms**|
|Compression Force|0018,11a2|**CF:** + tag value+ **N**|
|Reconstruction Diameter |0018,1100|**RD:** + tag value+ **mm**|
|Organ Dose|0040,0316|<p>**OD:** + tag value+ **dGy**</p><p>max two decimal</p>|
|Positioner Primary Angle|0018,1510 |<p>**PPA:** + tag value+ **° \{degree sign\}**</p><p>max two decimal</p>|
|Body Part Thickness |0018,11a0|<p>**Thk:** + tag value+ **mm**</p><p>max two decimal</p>|
|Repetition Time |0018,0080|<p>**TR:** + tag value+ **ms**</p><p>max two decimal</p>|
|Echo Time|0018,0081|<p>**TE:** + tag value+ **ms**</p><p>max two decimal</p>|
|Inversion Time|0018,0082|<p>**TI:** + tag value+ **ms**</p><p>max two decimal</p>|
|Trigger Time|0018,1060|<p>**TD:** + tag value+ **ms**</p><p>max two decimal</p>|
|Flip Angle |0018,1314|<p>**Flip:** + tag value+ **° \{degree sign\}**</p><p>max two decimal</p>|
|Acquisition Matrix|0018,1310|**Matrix:** + tag value|
|Number of Averages|00180083|**Excite:** + tag value|
|Echo Train Length|00180091|<p>**ETL:** + tag value</p><p>max two decimal</p>|
|Pixel Bandwidth |00180095|<p>**BW:** + tag value+ **Hz**</p><p>max two decimal</p>|
####








#### *Special Tags:*

**Conditional Tags**

|**Keyword (Name)**|**Source of Value**|**Displayed Format**|
| :- | :- | :- |
|Age|(0010,1010) if empty then calculate based on time difference between now and (0010,0030) DOB|<p>(0010,1010) → unformatted</p><p>if calculated format:</p><p>- \>2 years: 25Y</p><p>- 2 Y: 1Y, 6M</p><p>- \<1M: 25D</p>|
|Instance Number|(0020,0013)/total frame count (0028, 0008)|25/125|
|Slice Location|(0020,1041), if present, else Table Position (0018,9327), if present else a value derived from Image Position (Patient) (0020,0032) |<p>**SL:** +tag value+ **mm**</p><p>max two decimal</p>|
|Current or Prior indicator|<p>If currently opened study show: **Current**</p><p>If Other studies for the patient, show: **Prior**</p>|**Current** or **Prior**|


**Date/Time Tags:**

|**Keyword (Name)**|**Source of Value**|**Displayed Format**|
| :- | :- | :- |
|**Acquisition**|<p>(0008,002A), if present, </p><p>else </p><p>Acquisition Date (0008,0022) and Acquisition Time (0008,0032) if present, </p><p>else </p><p>Content Date (0008,0023) and Content Time (0008,0033), </p>|<p>**Acq: mm-dd-yyyy + time** </p><p>Example:</p><p>Acq: 1982-21-2 23:32</p>|
|**Study Date**|<p>Study Date (0008,0020) and Study Time (0008,0030)} </p><p>else</p><p>Series Date (0008,0021) and Series Time 1000 (0008,0031)</p>|**mm-dd-yyyy + time** |










**Unchanged Tags:**

|**Keyword (Name)**|**Source of Value**|**Displayed Format**|
| :- | :- | :- |
|Study Comments|(0020,4000)|unchanged tag value|
|Study Description|(0008,1030)|unchanged tag value|
|Series Description|(0008,103E)|unchanged tag value|
|Derivation Description|0008,2111|unchanged tag value|
|Tech’s name |0008,1070|unchanged tag value|
|Station Name |0008,1010|unchanged tag value|
|Institution Name|0008,0080|unchanged tag value|