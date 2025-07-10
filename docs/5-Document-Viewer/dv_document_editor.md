---
sidebar_position: 3
title: Document Editor
tags:
  - Document Editor
  - Header Format 
  - Font Style
  - Text Formatting
  - Colour Change
  - Text Alignment
  - Insert Options
  - Annotations
---

# Document Editor

## Overview

The Document Editor provides a user-friendly interface for editing and
customizing medical documents directly in the viewport. Equipped with a
toolbar, it emulates the functionality of familiar word processors,
offering users the ability to tailor document aesthetics and structure
to their specific needs.

## Toolbar Features and Functionality

**Navigation Steps:**

1. Navigate to a preliminary report in Document viewer

2. The **Report Editing Toolbar** is docked at the top of the viewer
for easier access. The toolbar includes all standard editing actions
including the following:

![DT](./img/DT1.png)

- **Undo**: Revert your last action.

- **Redo**: Reapply an undone action.

![DT](./img/DT2.png)

**Font Style Change**:

Modify the typeface to suit the professional tone of medical
documents. Options include serif, sans-serif, and monospaced fonts.

![DT](./img/DT3.png)

**Font Size Change**:

Resize text to emphasize key points or ensure clarity for all readers. Font sizes can be adjusted up or down as needed.

![DT](./img/DT4.png)

**Text Formatting**

Enhance text readability and emphasis through formatting options such as Bold, Italics, Underline, and Strikethrough.

![DT](./img/DT5.png)

**Font Colour Change**

Personalize the colour of text to improve visual engagement or highlight important sections. Choose from a wide palette of colours.

![DT](./img/DT6.png)

**Fill Colour**

Apply background colours to text blocks for emphasis or to categorize information visually within the document.

![DT](./img/DT7.png)

**Alignment and Spacing**

Align text to the left, centre, right, or justify to maintain a clean and professional appearance. Adjust line and paragraph spacing to enhance document readability.

![DT](./img/DT8.png)

![DT](./img/DT9.png)

**Insert Options**

Incorporate various elements like images, tables, number lists, bullet points, and checklists to enrich the document's information delivery.

![DT](./img/DT10.png)

**Add Comments**

1. Select the text you want to comment on in the report.
 
2. The “Add Comment” icon will appear in the toolbar above.

   ![DT](./img/DT11.png)

4. Click the Add Comment icon.

5. Enter your comment in the text box that appears and click on send icon.

   ![DT](./img/DT12.png)

7. Your comment will now be visible on the right side of the selected highlighted content.

8. You can also Edit or Delete your comment using the respective icons or reply to a comment to start a discussion thread.

   ![DT](./img/DT13.png)



**Context Menu & Spell Check in Report Editor**

1.	**Right-click on any selected content**

    The browser’s default context menu appears. This provides familiar user experience for quick actions like cut/copy/paste.

2.	**To paste content**

  	Right-click in an empty area or on selected content and choose Paste from the context menu.

3.	**Right-click on a red-underlined word (possible spelling error)**

    A spell check suggestion list appears, along with the browser’s context menu. You can quickly correct spelling by clicking on the suggested word.

   ![DT](./img/DT14.png)


## Step-by-Step Guide

1.  **Editing Text:**

    - Select the text you want to modify.

    - Use the toolbar options to change the font style, size, and
      colour. Apply text formatting like bold or italics as necessary.

2.  **Organizing Content:**

    - Use the header format options to delineate sections clearly.

    - Adjust alignment and spacing to ensure the content is neatly
      presented.

3.  **Enhancing the Document:**

    - Click on the 'Insert' options to add images, tables, or lists.
      These elements can help break up text and provide additional
      context or data visualization.

4.  **Collaborating with Comments:**

    - To add comments or annotations, select the relevant text or area
      and choose 'Add Comment' from the toolbar. Input your notes or
      feedback in the provided space.

## Using AI Assistance in the Document Viewer

The Document Viewer provides AI-powered tools to help you quickly review and interpret final reports.

## Generating an AI Summary

In the **Study Explorer**, locate and select the final study. The document will appear on the viewport

- In the upper-right corner of the document, you will see an **AI button** highlighted in blue.

![DT](./img/Aidv1.png)

- Click the **AI label** to generate a report summary created by the AI system.

![DT](./img/Aidv2.png)

- A warning message will be displayed below the summary:

*The AI technology serves as an analytical aid. The ultimate responsibility for patient diagnosis and care lies with licensed healthcare providers, who must interpret and validate any AI-generated reports.* [Detailed disclaimer]

## Obtaining AI Interpretation of Selected Text

If you would like to view an interpretation of a specific sentence or section:

1. Highlight the text you want to review.

![DT](./img/Aidv3.png)

2. “**AI says”** window will automatically appear with the AI’s interpretation.

![DT](./img/Aidv4.png)

3. A disclaimer will be shown below the interpretation:

*The AI technology serves as an analytical aid. The ultimate responsibility for patient diagnosis and care lies with licensed healthcare providers, who must interpret and validate any AI-generated reports.* [Detailed disclaimer]

To close the pop-up, simply click anywhere outside the window.


## Amendment Workflow

**For Non-Reading Physicians (with "Amend" access in UAC):**

1. Open the **final report** in the **Document Viewer (DV)**.
2. Click the **Amend icon** in the toolbar.

  ![AW](./img/amdnew1.png)

  <!-- [H3] removed or moved as appropriate -->

3. The **Amendment Request drawer** appears on the right.
4. Optionally enter a **reason for amendment**.

  ![AW](./img/amdnew2.png)

5. Click **Submit**.
6. The **report owner** will receive a **notification** to accept or reject the amendment request.

**For Reading Physicians:**

1. Open the **final report** in DV.
2. Click the **Amend icon** in the toolbar.
3. **Addendum** `<start>` **and** `<end>` **tags appear in the report.**

  ![AW](./img/amdnew3.png)

4. Enter your changes between these tags — add, delete, or format as needed.
5. Click **Done**.
6. The report is **finalized immediately** after clicking Done.

7. Finalizing the received amendment request

- If a **non-reading physician** requested the amendment:
  - The **reading physician (report owner)** must **accept and sign** or **reject** the request.



  ![AW](./img/amdnew4.png)

## Amendment Versioning and Report Access Behavior

When an **amendment** is made to a finalized report, either by a **reading physician** or after approval from a **non-reading physician's amendment request**, the system follows a version-controlled workflow to ensure traceability and data integrity.

  ![AW](./img/amdnew5.png)

**Key Behaviors:**

1. **New Copy for Every Amendment:**
   1. Each time an amendment is initiated and finalized, a **new version (copy)** of the report is automatically created.
   2. This new copy reflects all the **updated content**, including added, edited, or deleted information from the prior report.
2. **Read-Only Older Versions:**
   1. The **previous versions** of the report are automatically set to **read-only** status to prevent any further edits.
3. **Open Latest Amended Report:**
   1. A **button labeled “Open Now**” is provided within the older versions.

  ![AW](./img/amdnew6.png)

4. Clicking this button quickly navigates the user to the **most recent amended version** of the report.
5. **Support for Multiple Amendments:**
   1. The system allows **multiple rounds of amendments**.
   1. Each time a new amendment is made, a **new version is created**, and the previous one becomes read-only with an “Open Now” button.

## Header and Footer

**Header Format Change:**

    - Adjust the style of headers to organize document sections clearly.
      Choose from various header formats to structure content logically.

      ![header format](./img/headerformat.png)

## Page Number- in reports

1. Open the Header footer configuration in Document Viewer.

2. Click on the header, 3 option menu appears to the right side.

   ![Page Number1](./img/pagenumber1.png)

3. Click on the page number icon ”#”

4. Page number drawer appears on the right side.

5. Select Header or Footer from the Position radio button.

6. Select the **Number Format** from the dropdown menu.

   ![Page Number2](./img/pagenumber2.png)

7. Select **Alignment** from the dropdown menu.

   ![Page Number3](./img/pagenumber3.png)

8. Click on the tick mark to save the updates.

9. **Reset**- To reset the configuration, click on the reset button and click on tick mark to save the changes.

## Bookmarks

1.  Open Document Viewer.

2.  Open the report under studies.

3.  Go to the three dots on the top tool bar.

4.  Select Bookmark.

![bookmark](./img/BM1.png)

5.  Bookmark Selector draw appears on the right side.

6.  Search for Study Share URL bookmark and the Study Share QR code.

![bookmark](./img/BM2.png)

7.  Drag and drop the fields from right side.

![bookmark](./img/BM3.png)

8.  The QR code and study URL appears in the bookmarks area.

![bookmark](./img/BM4.png)

9.  Click on the URL, it will be redirected to the study.

10. Once the report is finalized and in the PDF form, the QR code will
    also be clickable.

11. This URL or QR code opens the study link in a new tab.

12. User must enter either patient ID or patient DOB as a verification.

![bookmark](./img/BM5.png)

13. Once verified, the study will be opened.

14. User must enter either patient ID or patient DOB as a verification.

15. Once verified, the study will be opened.

### Study Share URL/ Study Share QR code

1.  Open Document Viewer.

2.  Open the report under studies.

3.  Go to the three dots on the top tool bar.

4.  Select Bookmark.

![QR1](./img/QR1.png)

5.  Bookmark Selector draw appears on the right side.

6.  Search for Study Share URL bookmark and the Study Share QR code.

![QR2](./img/QR2.png)

7.  Drag and drop the fields from right side.

![QR3](./img/QR3.png)

8.  The QR code and study URL appears in the bookmarks area.

![QR4](./img/QR4.png)

9.  Click on the URL, it will redirect to the study.

10. Once the report is finalized and in the PDF form, the QR code will
    be clickable.

11. This URL or QR code opens the study link in a new tab.

12. User must enter either patient ID or patient DOB as a verification.

![QR5](./img/QR5.png)

13. Once verified, the study will be opened.

- User must enter either patient ID or patient DOB as a verification.

14. Once verified, the study will open.

**Blume Registration Page QR code**

1. Insert the bookmark **QR Code** to the report.

![QR6](./img/QR6.png)

2. Sign the report.

![QR7](./img/QR7.png)

3. An actual QR code gets assigned to the report.

4. Scan the QR code and get the report digitally.

## Header and Footer Configuration at Organization Level

**Access Organization Header and Footer**

1. Open the Document Viewer.

2. Click on the 3-dot menu located in the toolbar.

3. Select Organization Header & Footer from the dropdown.

   ![H&F_DropDown](./img/hfdropdown.png)

**Configure Header**

1. The Organization Header Footer configuration screen will appear.

2. Add desired images, tables, or text to the header.

3. Customize with options such as page numbers and margins if needed.

4. The header preview will be displayed in the left-side thumbnail.

**Configure Footer**

1. Add content to the footer section.

2. The footer preview will also appear in the left-side thumbnail.

3. Save or Cancel Configuration:

4. Click the **SAVE** button to apply and save the header and footer settings.

5. Click **CANCEL** to discard changes.

   ![Save H&F](./img/savehf.png)

**Note**: Template headers and footers take priority. If no template header/footer is applied, the organization's header and footer will be applied automatically to the report.

1. If template has no header, Organization header will be used.

2. If template has no footer, Organization footer will be used.

## Automated Key Image Placement

**Insert Key Image**

1.  Insert a table in the viewer using editor toolbar.

2.  Customize the number of columns and rows.

![KI1](./img/KI1.png)

3.  Click on the **Image** button on the top left side of the table.

Image Viewer opens on the right-hand side.

![KI2](./img/KI2.png)

All the key images appear at the bottom of the Image Viewer.

4.  Select or drag the images to the table.

![KI3](./img/KI3.png)

The images get copied to table cells respectively.

If the number of images selected are more than the number of cells, the
images get inserted beneath the table.

5.  Click on the table customization buttons on the left to insert rows
    and columns and to delete cells, rows, columns, or table.

6.  Click on the six dots on the left to **Place** the image from one
    cell to another.

**Note**: Key image can be placed anywhere in the report and not only
inside a table.

## Transcriptionist Flow V2

**Speed Experience**

1.  Open the report in Document Viewer.

2.  Click on the Audio Player icon.

![TF1](./img/TF1.png)

3.  The audio starts playing.

![TF2](./img/TF2.png)

4.  Click on the speed experience button.

![TF3](./img/TF3.png)

5.  Speed variants appear in a drop-down list.

6.  Select the number to control the speed of the audio.

**Forward and Rewind Button**

The audio player icon on click of it displays play bar of the audio
along with forward and rewind button.

On simple click and release forward and rewind changes by 5 secs.

On press and hold incrementally the speed increases or decreases by 10s
15s 20s etc till 60s. The time changes to minute after 60s and in
multiples of 60 secs, 2mins,5mins,10mins.
