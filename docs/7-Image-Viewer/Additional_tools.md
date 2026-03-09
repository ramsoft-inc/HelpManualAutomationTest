# Additional Tools 

## Overview

The Additional Tools section provides extended functionality for
managing, reviewing, and sharing imaging studies within the Image
Viewer. These tools support tasks such as exporting studies to optical
media, playing multi-frame sequences, copying or downloading images,
performing fusion viewing, marking key images, synchronizing viewports,
reconstructing multi-planar views, printing images, and arranging custom
viewport layouts. Together, these tools enhance diagnostic efficiency by
offering precise control over visualization, comparison, and
data-sharing workflows.

## List of Tools

The following tools are available in the Additional Tools section. Click
a tool name to navigate its detailed description:

1.  [**Burn Study**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#1-burn-study)

2.  [**Cine**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#2-cine)

3.  [**Copy**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#3-copy)

4.  [**Download**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#4-download)

5.  [**Fusion**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#5-fusion)

6.  [**Key Image**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#6-key-image)

7.  [**Link**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#7-link)

8.  [**MPR (Multi-Planar Reconstruction)**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#8-mpr-multi-planar-reconstruction)

9.  [**Print**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#9-print)

10. [**Tile Mode**](https://help.omegaai.com/docs/Image-Viewer/Additional_tools#tile-mode)


## 1 Burn Study

**Purpose**

The Burn Study feature allows users to write the current study onto a CD
or DVD. This is useful for sharing patient imaging data with other
facilities, providing patients with their own records, and archiving
studies for compliance or backup.

**Accessing the Burn Study Tool**

You can access the tool from:

- The toolbar

- The **More Options** menu

 ![Additional Tools](./img/at_1.png#medium)

**How to Burn a Study**

1.  Open the study you want to burn in the Image Viewer.

2.  Click the **Burn Study** option from the toolbar or the More Options
    menu.

3.  The study size is displayed next to the Burn Study option,
    indicating the total size that will be written to the disc.
    
4.  A small executable file will be downloaded---run this file to enable
    the burning process.

5.  Follow the on-screen instructions to complete burning the images and
    documents onto the disc.

**Note**:
Ensure permissions and security practices are followed before
transferring patient data to removable media.


## 2. Cine

**Purpose**

The Cine tool allows users to play image series as a continuous loop,
similar to a video.

**Useful for**

Reviewing dynamic studies or multi-slice sequences such as CT, MRI,
Fluoroscopy, and ultrasound. The Cine tool helps observe motion, detect
abnormalities, and compare changes across slices.

**Accessing the Cine Tool**

Visibility and Activation:

- The Cine tool becomes available only when the loaded study contains
  more than two images.

- It can be accessed through:

  - From the **toolbar**

    ![Additional Tools](./img/at_2.png#small)

  - The **Cine** icon- located at the bottom of the **viewport menu**

    ![Additional Tools](./img/at_3.png#medium)

  - By pressing the **C** key (quick-access hotkey)


**Cine Controls Overview**
When the Cine tool is activated, a control panel appears, allowing users
to manage playback of multi-frame image series. The controls include:

- **Jump to First Frame** -- Moves directly to the beginning of the
  series.

- **Step Backward** -- Moves one frame backward at a time.

- **Play / Pause** -- Starts or stops continuous playback of the image
  sequence.

- **Step Forward** -- Moves one frame forward at a time.

- **Jump to Last Frame** -- Moves directly to the end of the series.

- **Speed Control (FPS Indicator)** -- The speed control displays the
  current FPS (Frames Per Second) value, indicating how fast the Cine
  playback is running. Users can adjust the playback speed by clicking
  and holding the left mouse button on the FPS indicator, then dragging
  left or right to decrease or increase the speed.


- The FPS value is automatically set based on the DICOM data for the
  selected series (active viewport).

- If no FPS information is available, the system applies a default FPS
  value according to the series modality.

   ![Additional Tools](./img/at_4.png#small)

These controls provide smooth and precise navigation through dynamic or
multi-slice studies, supporting detailed frame-by-frame analysis.


## 3. Copy

**Purpose**

The Copy tool allows users to quickly copy the current image---including
annotations---from the viewport directly to the clipboard. The copied
image can be pasted into reports, presentations, emails, or messaging
applications.

**How to Use the Copy Tool**

1.  Click anywhere inside the viewport to activate it.

2.  Copy tool can be accessed through:

    - From the **toolbar**

        ![Additional Tools](./img/at_6.png#small)

    - Click the **Copy** icon located at the bottom **viewport menu**

       ![Additional Tools](./img/at_5.png#small)

  1.  The active image (with annotations) will be copied to the
      clipboard.

   - A toast message will appear stating "**Copied to Clipboard.**"

## 4. Download

**Purpose**

The Download feature allows users to export imaging content directly
from the Image Viewer.

**Useful for**

Sharing imaging data with other care teams, including images in reports
or presentations, and creating offline copies for reference or audit
purposes.

**How to Use**

1.  **Access the Download tool** using either of the following methods:

- Click the **Download** icon in the Image Viewer toolbar, or

- Click the **More options (three-dot) menu** in the toolbar and select
  **Download**.

2.  Click the dropdown arrow beside the icon to expand the download
    menu.

   ![Additional Tools](./img/at_7.png#medium)

a.  **Download Study**

  - Downloads the entire study, including all series and images, in
  **DICOM** format.

- Useful for sharing the full dataset or creating offline archives.

b.  **Download Image**

   The **Download Image** option allows users to export only the image
    currently displayed along with the annotations in the active
    viewport. When selected, the Download Image dialog appears with the
    following options:

- **File Name:** Enter or modify the name of the image file before
  downloading.

- **Image Width (px):** Shows the width of the image in pixels. Users
  may adjust the width if resizing is needed.

- **Image Height (px):** Shows the height of the image in pixels. This
  value can also be edited as needed.

- **Preview Area:** Displays a preview of the selected image, including
  the series name, ID, and date for quick identification.

   ![Additional Tools](./img/at_8.png#medium)

**Dialog Actions**

- **Cancel** -- Closes the dialog without downloading.

- **Download** -- Saves the image using the selected file name and
  dimensions.


## 5. Fusion

**Purpose**

**PET-CT Fusion mode** in OmegaAI allows users to view PET (Positron
Emission Tomography) and CT (Computed Tomography) images together in a
single, blended display.

<u>*[Learn more about Fusion mode](https://help.omegaai.com/docs/Image-Viewer/PET)*</u>

## 6. Key Image

**Purpose**

The Key Image tool allows users to mark a specific image or frame within
a series as clinically important or noteworthy.

**How it works**

- When selected, the chosen image is highlighted as a key reference and
  automatically saved in the **Study Explorer** under the corresponding
  study. This makes it easy to access, review, and includes the marked
  image in reports or follow-up evaluations.

**Creating a Key Image**

- Click the **Key Image** icon from the toolbar or the viewport menu.

- The selected image will be marked with a key symbol and automatically
  saved as a Key Image in the Study Explorer.

  ![Additional Tools](./img/at_9.png#small)

   ![Additional Tools](./img/at_10.png#small)

**Removing a Key Image**

- Hover over the Key Image thumbnail in the Study Explorer.

- Click and hold the **Delete (trash)** icon or select **Remove Key
  Image** from the toolbar prompt.

- The key marking will be removed, and the image will no longer appear
  in the Key Image list.

   ![Additional Tools](./img/at_12.png#small)

   ![Additional Tools](./img/at_11.png#medium)
   
**Renaming a Key Image**

- Hover over the Key Image thumbnail in the Study Explorer.

- Click the **Edit (pencil)** icon.

- Enter the desired name.

    ![Additional Tools](./img/at_13.png#medium)

## 7 Link

**Purpose**

The Link tool allows users to synchronize multiple images or series
across viewports. When linking is enabled, interactions such as
scrolling, zooming, and positioning are mirrored across the linked
viewports.

**Useful for**

Comparing images from different time points, modalities, or anatomical
regions---enables efficient side-by-side analysis.

**Accessing the Link Tool**

It can be accessed through:

- The **More Options** menu

![Additional Tools](./img/at_15.png#medium)

- From the **toolbar**

  ![Additional Tools](./img/at_14.png#small)

**Link Menu Modes**

- **Unlink** -- Disables synchronization between viewports.

- **Manual Link** -- Allows users to manually link selected viewports
  for synchronized viewing.

- **Plane Link** -- Links viewports based on anatomical planes (e.g.,
  axial, sagittal, coronal) for coordinated multi-plane navigation.


## 8. MPR (Multi-Planar Reconstruction)

**Purpose**

MPR mode allows users to view volumetric imaging data---such as CT or
MRI scans---in multiple anatomical planes simultaneously.

<u>*[Learn more about Multi-Planar Reconstruction](https://help.omegaai.com/docs/Image-Viewer/MPR)*</u>

## 9. Print

**Purpose**

The Print tool allows users to print the currently displayed image. This
provides a quick way to generate hard copies for documentation, case
discussions, or offline reference.

**Accessing the Print Tool**

It can be accessed through:

- The **Print** icon- located at the bottom of the **viewport menu**
 
 ![Additional Tools](./img/at_17.png#small)

- From the **toolbar**

 ![Additional Tools](./img/at_16.png#small)

**How to Print**

1.  Click the **Print** icon from the toolbar, or open the viewport menu
    and select **Print**.

2.  A print preview window will open, displaying the selected image.

3.  Review the preview to ensure the correct image is selected.

4.  Select the desired printer, page layout, or print settings supported
    by the system.

5.  Click **Print** to generate the hard copy.



## Tile Mode

**Purpose**

Tile Mode allows users to display multiple images or series
simultaneously by arranging them in a grid layout.

**Useful for**

Side-by-side comparisons across different studies, time points, or
anatomical regions.

**How to Use Tile Mode**

1.  Click the **Tile Mode** icon from the toolbar or open the viewport
    menu and select **Tile Mode**.

   ![Additional Tools](./img/at_18.png#small)

   ![Additional Tools](./img/at_19.png#small)

2.  A grid selector will appear, showing different layout
    configurations.

3.  Click on the desired grid pattern---blue squares represent active
    viewports, and grey squares indicate inactive ones.

4.  The viewer will update to display the selected number of viewports
    in the chosen layout.
