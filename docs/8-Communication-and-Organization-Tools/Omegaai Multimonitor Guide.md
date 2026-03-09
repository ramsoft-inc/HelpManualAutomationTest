# Multi-Monitor Setup Guide

This guide will walk users through enabling and disabling the multi-monitor setup in **OmegaAI** ensuring optimal use of Image Viewer, Document Viewer, and Scheduler functionalities across multiple displays.

## **Pre-Requisite**

Ensure you’re using a compatible browser such as **Google Chrome** or **Microsoft Edge**, and that window management (pop-ups) are properly configured for [www.omegaai.com](https://www.omegaai.com) (see [System Requirements](/docs/Getting-Started/System_Requirements#multimonitor-setup)
).

:::warning
Enabling multi-monitor support without granting window management permission in the browser may cause some monitors to not display expected windows, such as the image viewer.
:::

## **Enabling Multi-Monitor Setup**

###  *Login and Navigation*

1. Log in to your **OmegaAI account**.

2. Click the **My Profile** icon at the bottom-left corner.

![Multimonitor](./Images/Multimonitor1.png)

 3. In the sidebar, select **User Settings**.

![Multimonitor](./Images/Multimonitor2.png)

###  *Access Display Settings*

1. On the User Profile page, under the left panel, click the **Display Settings** icon (monitor symbol below “Organization and Roles”).

![Multimonitor](./Images/Multimonitor3.png)

2. First-time users will see a pop-up:

\
  **www.omegaai.com wants to manage windows on all your displays**.

\
  3. Click **Allow** to continue.

  ![Multimonitor](./Images/Multimonitor4.png)

### *Configure Each Monitor*

1. Once detected, OmegaAI will show all connected screens.
2. Click the **Edit (pencil icon)** on the top-right to enter edit mode.

![Multimonitor](./Images/Multimonitor5.png)

3. Each monitor will show a **dotted square icon** in the center.

![Multimonitor](./Images/Multimonitor6.png)

4. Click this icon to assign a view from the following options:
  - **Image Viewer**
  - **Document Viewer**
  - **Scheduler**
  - **Reset Selection** (resets to default)

![Multimonitor](./Images/Multimonitor7.png)

Note:

*Only “Image Viewer” can be applied to multiple screens simultaneously.*\
*Document Viewer or Scheduler can only be assigned to one monitor at a time; selecting it on a second monitor will unassign it from the first.*

5. After assigning views, click **Save** to finalize your layout.
  
![Multimonitor](./Images/Multimonitor8.png)

### *Using Multi-Monitor in Action*

- When you open a study from the **Worklist**, OmegaAI auto-triggers the multi-monitor layout:
  - Document Viewer opens on its assigned screen.
  - Image Viewer and Scheduler populate their designated monitors.

![Multimonitor](./Images/Multimonitor9.png)

- In the **Image Viewer**, you can:
  - Select different **layouts** to view multiple image sections.
  - Exit full-screen via the **three-dot menu** > scroll down > toggle off **Full Screen Mode** to see navigation panels on the main screen.
- The **main monitor** allows access to:
  - Worklist
  - Home
  - Organizations
  - Back button (top-left corner)
  - Left and right menu panels (when not in full screen)

### *Navigating Away and Refreshing*

- When you click **Back** from the main screen, the secondary screens go **black**.
- Selecting a new study from the Worklist will re-populate the assigned displays as per the saved configuration.

## **Disabling Multi-Monitor Setup**

You can disable the multi-monitor setup in either of the following ways:

### *Disable from Display Settings*

1. Go to **Profile** > **User Settings** > **Display Settings**.
2. Use the **Toggle Button** on the top-right to **disable multi-monitor** functionality.

![Multimonitor](./Images/Multimonitor10.png)

### *Reset Individual Screens* 

1. Click the **Edit (pencil icon)** on Display Settings.
2. On each monitor, click the **dotted square icon**.
3. Choose the **Reset Selection** to revert to the default and remove any assigned views.

**Note**:

*Manual disabling of the multi-monitor setup is not required when using a single monitor. The system will automatically operate in single-monitor mode if only one display is detected and will switch to multi-monitor mode when multiple displays are available.*

![Multimonitor](./Images/Multimonitor11.png)

4. Save changes to complete.

# Browser Configuration for Multi-Monitor Setup

## For Google Chrome

#### Enable Pop-ups and Window Management:

1.  Open **Chrome** and go to [www.omegaai.com](https://www.omegaai.com)
2.  Click the **Site Settings icon** next to the URL in the address bar.

![Multimonitor](./Images/Mms1.png)

3.  From the dropdown, click **Site settings**.
4.  Find **Pop-ups and redirects** and **Window Management** in the
    list.
5.  Change the setting to **Allow**.

![Multimonitor](./Images/Mms2.png)
>
![Multimonitor](./Images/Mms3.png)

#### For the Installed OmegaAI Application: Enable Pop-ups and Window Management

1.  Open the **OmegaAI** installed app on your computer.
2.  Click the **three dots (⋯)** in the top-right corner of the app
    window.
3.  From the dropdown menu, select **App info**.

![Multimonitor](./Images/Mms25.png)

4.  In the **App info** dropdown, click on **Settings**.

![Multimonitor](./Images/Mms26.png)

5.  In **App settings**, go to **More settings and permissions**.

![Multimonitor](./Images/Mms27.png)

6.  In the **Permissions** section, make sure:
    - **Pop-ups and redirects** is set to **Allow**.
    - **Window management** is set to **Allow**.

![Multimonitor](./Images/Mms28.png)
>
![Multimonitor](./Images/Mms29.png)

7.  Close the settings tab and return to the OmegaAI app --- your
    changes will be saved automatically.

#### Alternative method: Enable **pop-ups and redirects**. 

1.  Click the **three-dot menu** (top-right corner) \> **Settings**.

![Multimonitor](./Images/Mms4.png)

2.  Go to **Privacy and Security** \> **Site Settings** \> **Pop-ups and
    redirects**.

- Or copy and paste the following URL directly into the Chrome address bar:
  **chrome://settings/content/popups**
  
![Multimonitor](./Images/Mms5.png)
![Multimonitor](./Images/Mms6.png)

3.  Under **Allowed to send pop-ups and use redirects**, add:
    [www.omegaai.com](https://www.omegaai.com)
    
![Multimonitor](./Images/Mms7.png)

#### Alternative method: Enable **Window management**. 

1. Go to **Settings \>** **Privacy and Security** \> **Site> Settings** \> **Window management**

- In **Site settings**, scroll down to **Permissions**, then click
  **Additional permissions** to find **Window management**.
- Or copy and paste the following URL directly into the Chrome address
  bar:
  **chrome://settings/content/windowManagement**
  
![Multimonitor](./Images/Mms8.png)

2. Under **Allowed to manage windows on all your displays**, **Add**:
   [www.omegaai.com](https://www.omegaai.com)
   
![Multimonitor](./Images/Mms9.png)

#### Disable Pop-ups (if needed):

1.  Follow the steps above to navigate to **Pop-ups and redirects**.
2.  Under "**Allowed to send pop-ups and use redirects**," click the
    **three-dot menu** next to  [www.omegaai.com](https://www.omegaai.com)
    and choose **Block** or **Remove**.

![Multimonitor](./Images/Mms10.png)

### ***For Microsoft Edge***

#### Enable Pop-ups and Window Management:

1.  Go to www.omegaai.com
2.  Click the **lock icon** next to the URL in the address bar.

![Multimonitor](./Images/Mms11.png)

3.  Select **Permissions for this site**.
4.  Look for **pop**-**ups**, **redirects**, and **window management**
    in the list.
5.  From the dropdown menu, select **Allow**

![Multimonitor](./Images/Mms12.png)

![Multimonitor](./Images/Mms13.png)

#### For the Installed OmegaAI Application: Enable Pop-ups and Window Management

1.  Open the **OmegaAI** installed app on your computer.
2.  Click the **three dots (⋯)** in the top-right corner of the app
    window.
3.  Select **App settings** from the dropdown menu.

![Multimonitor](./Images/Mms22.png)

4.  In the **App settings** window, locate the **Permissions** section.
5.  Click on **See permission details for
    [www.omegaai.com](http://www.omegaai.com)**.

![Multimonitor](./Images/Mms23.png)

6.  In the new window, ensure that:

- **Pop-ups and redirects** is set to **Allow**.
- **Window management** is set to **Allow**.

![Multimonitor](./Images/Mms24.png)

#### Alternative method: Enable **Pop-ups and redirects**. 

1.  Open **Edge** \> Click the **three-dot menu** (top-right corner) \> **Settings**.

![Multimonitor](./Images/Mms14.png)

2.  Go to **Privacy, search, and services** \> **Site permissions** \>
    **All permissions\> Pop-ups and redirects**

- Or, copy and paste the following URL directly into the Edge address bar :
   **edge://settings/privacy/sitePermissions/allPermissions/popups**

![Multimonitor](./Images/Mms15.png)
![Multimonitor](./Images/Mms16.png)
![Multimonitor](./Images/Mms17.png)

3.  Click Add site [www.omegaai.com](https://www.omegaai.com) under
    **Allowed to send pop-ups** **and use redirects**.

![Multimonitor](./Images/Mms18.png)

#### Alternative method: Enable **Window management.** 

1.  Go to **Settings\> Privacy, search, and services \> Site permissions
    \> All permissions \> Window management**

- Or copy and paste the following URL directly into the Edge addressbar:
**edge://settings/privacy/sitePermissions/allPermissions/windowManagement**

![Multimonitor](./Images/Mms19.png)

2.  Under **Default behaviour,** switch the toggle to **Allowed
    (recommended)**.

![Multimonitor](./Images/Mms20.png)

#### Disable Pop-ups (if needed):

1.  In the **Pop-ups and redirects** section, locate
    [www.omegaai.com](https://www.omegaai.com) under the "**Allowed to
    send pop-ups and use redirects**" list.
2.  Click the **three-dot menu** next to it, then select **Remove** or
    switch it to **Block** to prevent pop-ups.

![Multimonitor](./Images/Mms21.png)

## **Summary Table**

|Task|Action|
| :- | :- |
|Enable multi-monitor|Profile > User Settings > Display Settings > Assign screens > Save|
|Disable multi-monitor|Use the Toggle Button OR reset screens individually|
|Supported Views|Image Viewer (multiple), Document Viewer, Scheduler (only one screen at a time)|
|Browser Setup|Allow pop-ups for [www.omegaai.com](https://www.omegaai.com) in Chrome/Edge|












