---
sidebar_position: 4
title: Logs
tags:
  - Login
  - Multi-factor Authentication
  - Security
  - DICOM Log
  - Mirth
  - Notification
  - Email
  - SMS
  - Monitoring 
  - Search Filters
  - Sorting
  - Record Management
  - Retry/Cancel Tasks
  - Status Reason
---

# Logs

## Types of Logs

This chapter describes how to monitor and edit logs. OmegaAI provides
the ability to see tasks (DICOM/FHIR) being performed in a central
location and cancel outgoing tasks, if you have the required permission.

Logs includes the following:

- **DICOM Log**: The DICOM Log allows users to track the progress and
  status of the DICOM received and sent from the system.

- **Mirth**: The Mirth log allows users to track all Mirth details including: Status, Status Reason, Intent, Description, Study Instance UID, Patient Name, and Requester. 

- **Email**: The Email log allows users to track all Email details including: Status, Sender, Receiver, Trigger, and Message. 

- **SMS**: Allows users to track all SMS details including: Status, Sender, Receiver, Trigger, Message, etc. 

- **Notification**: Allows users to track all Notification details including: Status, Sender, Receiver, Trigger, Message, etc.

- **Audit Log**: The Audit Log tracks all system and user activities.

- **Activity History**: The Activity History is a read-only page that
  shows a record of all the activities you have performed. Note that you
  cannot view another user's activities.

- **Fax Log**: The Fax Log displays a list of incoming and outgoing faxes.

## Accessing and Monitoring DICOM Log in OmegaAI
This section provides detailed instructions on how to access and monitor
Logs within the OmegaAI system. Users will learn how to navigate
the Logs interface, utilize various functionalities like searching,
sorting, and managing task records, and understand the significance of
different columns and statuses associated with tasks.

### Steps to Access and Monitor DICOM Log

1.  **Accessing Logs**

    - Open the OmegaAI homepage. 

    - Click the Logs icon located on the side navigation bar to access
      the Logs page, which appears by default upon clicking the Logs
      icon.

2.  **Understanding the Logs Homepage**

    - **Header**:

      - **Portfolio Name**: Displays as 'DICOM Log'.

      - **Numeric**: Shows the total number of records available in the
        log.

      - **Search Icon**: Use this to enter the name of the patient and
        access various types of information such as General Information,
        Insurance Information, Activity, and Study History.

      - **All Drop-Down Menu**: Allows you to filter searches by
        categories like Study, DICOM Query, Patient, Organization, User,
        and Help.

3.  **Using the Menu Pane**

    - **Column Operations**:

      - **Search and Filter Records**: Apply filters based on any column
        through search filters.

      - **Sorting Records**: Sort the records either in ascending or
        descending order by clicking the drop-down arrow associated with
        any column and selecting the desired sorting option.

        ![Communication and Organization Tools](./Images/4.png)

    - **Rearrange Columns**: Drag columns to rearrange their order in the
      grid. Note that the Status Indicator and the Status column cannot be
      moved.

4.  **Menu Tab Features**

    - **Active**: Indicates whether the DICOM is active and includes
      Retry/Cancel buttons for DCIOM being sent (not applicable to received studies).

      - **Retry**: Click to retry a failed transmission, changing the
        DICOM status back to 'In Progress'.

      - **Cancel**: Click to cancel a transmission, changing the DICOM
        status to 'Cancelled'.

    - **Status**: Displays the current status of the task with options
      to filter records by multiple status fields.

    - **Priority and Other Columns**: Additional columns such as
      Priority, # of Objects, Task Start, Task End, and Duration
      provide detailed information about the DICOM specifics.

    - **Patient and Study Details**: Columns like Patient ID, Patient
      Name, Managing Organization, and others offer details about the
      patient and study associated with the respective DICOM.

5.  **Monitoring DICOM Details**

    - View detailed information for each DICOM, including the start and
      end times, duration, involved parties (like the patient and
      managing organization), and the purpose of the task (Study
      Reason).

### Steps to Customize DICOM Log Settings

1.  **Accessing DICOM Log Settings**

    - Navigate to the DICOM Log page by clicking on the Logs icon from
      the left side navigation bar of the OmegaAI homepage and selecting DICOM Logs if not already displayed.

    - Click the blue DICOM selector icon, then select **Settings** to open
      the DICOM Log Settings drawer.

2.  **Customizing Columns**

    - **Adding Columns**:  

      - Click the Add icon to introduce empty columns into the DICOM Log
        grid.

      - Click the empty columns and select the required column from the
        dropdown list that appears. This allows you to include
        additional information fields that are relevant to your tasks.

    - **Clearing Column Values**:

      - To remove specific data from a column while keeping the column
        visible, click the Clear (X) icon associated with that column.

    - **Deleting Columns**:

      - If a column is no longer needed, click the Delete icon associated
        with the column to remove it from the grid entirely.

3.  **Applying Filters**

    - Click the "Filters" button switch to Filters section. Enter details in the following fields: **Accession #**, **Study UID**, **Patient ID**, and **Patient Name**.

### Checking the DICOM Log

You can check or monitor the DICOM Log by looking at the values in the DICOM Log grid. The following table lists the different columns and their
descriptions.

<table>
   <thead>
        <tr class="header">
            <th>Column</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr class="odd">
            <td><strong>Status Indicator</strong></td>
            <td>
                <ul>
                    <li>
                        <p>The green tick mark indicates that the status is 'Completed',
                            which means the task is done.</p>
                    </li>
                    <li>
                        <p>The green circle indicates that the status is 'In Progress',
                            which means the study is currently being transferred.</p>
                    </li>
                    <li>
                        <p>The red circle indicates that the status is 'Cancelled', which
                            means the task is cancelled.</p>
                    </li>
                </ul>
                <blockquote>
                    <p>Note: In Omega AI, you cannot cancel any receive operation. Only the
                        sender can cancel their operation.</p>
                </blockquote>
                <ul>
                    <li>
                        <p>The grey circle indicates that the status is 'Ready', which means
                            the study is ready for transfer.</p>
                    </li>
                </ul>
                <blockquote>
                    <p>It is queued up and will be sent once the communication lines are
                        free or the scheduled time occurs.</p>
                </blockquote>
                <ul>
                    <li>
                        <p>The yellow '||' icon indicates that the status is 'On
                            Hold'.</p>
                    </li>
                    <li>
                        <p>The red exclamation mark indicates that the status is
                            'Failed'.</p>
                    </li>
                </ul>
            </td>
        </tr>
        <tr class="even">
            <td><strong>Status</strong></td>
            <td>
                <ul>
                    <li>
                        <p>By default, displays all the statuses of the studies that are
                            sent or received.</p>
                    </li>
                    <li>
                        <p>Receive operations have only two statuses, In Progress or Completed.</p>
                    </li>
                    <li>
                        <p>You can choose multiple fields in this filter to search for
                            records.</p>
                    </li>
                </ul>
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Reason</strong></td>
            <td>
                <p>Provides more information on the current status of the task
                    Note: For received objects, the reason is always DICOMReceive.</p>
            </td>
        </tr>
        <tr class="even">
            <td><strong>Priority</strong></td>
            <td>
                <p>The studies are sorted by priority, and then First-In, First-Out (FIFO) if priority values are identical.</p>
                <p>The priority options are sorted in the following order (from highest to the lowest priority):</p>
                <ol type="1">
                    <li><p><strong>STAT</strong></p></li>
                    <li><p><strong>ASAP</strong></p></li>
                    <li><p><strong>Urgent</strong></p></li>
                    <li><p><strong>Routine</strong></p></li>
                </ol>
                <p>If you have the edit privileges, you can change the priority of the studies. However, you can do so <em>only</em> for studies that are being sent.</p>
                Note: For received operations, the priority cannot be changed, it is always
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Number of Objects</strong></td>
            <td>Number of objects sent and received.</td>
        </tr>
        <tr class="even">
            <td><strong>Task Start</strong></td>
            <td>
                <ul>
                    <li>
                        <p>This field is a date range picker. You can use this to filter studies based on a certain start date.</p>
                    </li>
                    <li>
                        <p>Displays timestamps, if</p>
                        <ul>
                            <li><p>A task is started and completed.</p></li>
                            <li><p>A task is started and put on hold.</p></li>
                            <li><p>A task is started, put on hold, and resumed.</p></li>
                        </ul>
                    </li>
                </ul>
                <blockquote>
                    <p>In this case, the task start time is the time at which the task
                        resumed.</p>
                </blockquote>
                <ul>
                    <li><p>The first object in a receive operation is received.</p></li>
                </ul>
                <ul>
                    <li>
                        <p>This field is blank, if:</p>
                        <ul>
                            <li><p>A task is pending and has not started.</p></li>
                            <li><p>A task is put on hold and has not started.</p></li>
                        </ul>
                    </li>
                    <li><p>The time is precise to seconds.</p></li>
                </ul>
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Task End</strong></td>
            <td>
                <ul>
                    <li>
                        <p>This field is a date range picker. You can use this to filter
                            studies based on a certain end date.</p>
                    </li>
                    <li>
                        <p>Displays timestamps, if</p>
                        <ul>
                            <li><p>A task is started and completed.</p></li>
                            <li><p>A task is started, put on hold, resumed, and then
                                    completed.</p></li>
                        </ul>
                    </li>
                </ul>
                <blockquote>
                    <p>In this case, the task end time is the time at which the task
                        completed.</p>
                </blockquote>
                <ul>
                    <li><p>In a receive operation, no more objects are received for 30
                            seconds. After 30 seconds, the task is marked as
                            <em>Complete</em>.</p></li>
                </ul>
                <ul>
                    <li>
                        <p>This field is blank, if:</p>
                        <ul>
                            <li><p>A task is pending and has not started.</p></li>
                            <li><p>A task is put on hold and has not started.</p></li>
                            <li><p>A task is started and put on hold.</p></li>
                        </ul>
                    </li>
                    <li><p>The time is precise to seconds.</p></li>
                </ul>
            </td>
        </tr>
        <tr class="even">
            <td><strong>Duration</strong></td>
            <td>
                <p>Total duration from when the task started until its completion
                    time.</p>
                <p>For receive operations, it is calculated only after the task is
                    complete. Until the task is completed, the field is empty.</p>
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Progress Bar</strong></td>
            <td>
                <p>Shows the progress of the sent operation.</p>
                <p>For receive operations, the status for objects that are received is
                    0% until it is completed, after which it is updated to 100%. This is
                    because it cannot be determined how many objects are being received into
                    the system,</p>
            </td>
        </tr>
        <tr class="even">
            <td><strong>Patient ID</strong></td>
            <td>Patient ID of the patient associated with the study.</td>
        </tr>
        <tr class="odd">
            <td><strong>Patient Name</strong></td>
            <td>Name of the patient associated with the study.</td>
        </tr>
        <tr class="even">
            <td><strong>Managing Organization</strong></td>
            <td>Displays the Managing Organization of the record.</td>
        </tr>
        <tr class="odd">
            <td><strong>Service Name</strong></td>
            <td>
                <p>For send operations, it is the name of the device performing the
                    task.</p>
                <p>For receive operations, it is the name of DICOM Web or the OmegaAI
                    Link device.</p>
            </td>
        </tr>
        <tr class="even">
            <td><strong>Progress Bar</strong></td>
            <td>Shows the progress of the study that is sent.</td>
        </tr>
        <tr class="odd">
            <td><strong>Imaging Organization</strong></td>
            <td>Displays the Imaging Organization of the record.</td>
        </tr>
        <tr class="even">
            <td><strong>Number of Failures</strong></td>
            <td>The total number of failed attempts for the task.</td>
        </tr>
        <tr class="odd">
            <td><strong>Status Reason</strong></td>
            <td>A description or code indicating why this task needs to be
                performed.</td>
        </tr>
        <tr class="even">
            <td><strong>Destination</strong></td>
            <td>The destination device.</td>
        </tr>
        <tr class="odd">
            <td><strong>Peer Host</strong></td>
            <td>The name of the remote station.</td>
        </tr>
        <tr class="even">
            <td><strong>Issuer</strong></td>
            <td>Displays the Issuer associated with the patient.</td>
        </tr>
        <tr class="odd">
            <td><strong>Creation Date Time</strong></td>
            <td>Displays the date and time when the task was created.</td>
        </tr>
        <tr class="even">
            <td><strong>Requester</strong></td>
            <td>
                <ul>
                    <li><p>Name of the device requesting the study.</p></li>
                    <li><p>Displays the Imaging or Managing Organization name If it is an
                            automatic routing rule.</p></li>
                </ul>
            </td>
        </tr>
        <tr class="odd">
            <td><strong>Accession Number</strong></td>
            <td>Accession number of the study that is associated with the
                Order.</td>
        </tr>
        <tr class="even">
            <td><strong>Visit Number</strong></td>
            <td>Visit number associated with the study.</td>
        </tr>
        <tr class="odd">
            <td><strong>Last Modified Date</strong></td>
            <td>The time when the record was modified, such as paused, put on hold,
                or cancelled.</td>
        </tr>
        <tr class="even">
            <td><strong>Intent</strong></td>
            <td>Shows how actionable the task is. For example, if the task is
                planned, proposed, etc.</td>
        </tr>
        <tr class="odd">
            <td><strong>Note</strong></td>
            <td>The description of the event and errors, if any.</td>
        </tr>
        <tr class="even">
            <td><strong>Study Date Time</strong></td>
            <td>Date and time of the study.</td>
        </tr>
        <tr class="odd">
            <td><strong>Study Description</strong></td>
            <td>Description of the study.</td>
        </tr>
    </tbody>
</table>

## Accessing and Monitoring Mirth Log in OmegaAI
This section provides detailed instructions on how to access and monitor
the Mirth log within OmegaAI.

### Steps to Access and Monitor Mirth Logs

1.  **Accessing Mirth Logs**

    - Open the OmegaAI homepage.  

    - Click the Logs icon located on the left side navigation bar to access
      the DICOM Logs page, which appears by default.

    - Click blue DICOM icon, a list of log options will appear. 

    - Click Mirth. The Mirth log will be displayed.

2.  **Understanding the Mirth Homepage**

    - **Header**:

      - **Portfolio Name**: Displays as 'Mirth'.

      - **Numeric**: Shows the total number of records available in the
        log.

      - **Search Icon**: Use this to enter the name of the patient and
        access various types of information such as General Information,
        Insurance Information, Activity, and Study History.

      - **All Drop-Down Menu**: Allows you to filter searches by
        categories like Study, DICOM Query, Patient, Organization, User,
        and Help.

3.  **Using the Menu Pane**

    - **Column Operations**:

      - **Search and Filter Records**: Apply filters based on any column
        through search filters.

      - **Sorting Records**: Sort the records either in ascending or
        descending order by clicking the drop-down arrow associated with
        any column and selecting the desired sorting option.

        ![Communication and Organization Tools](./Images/4.png)

    - **Rearrange Columns**: Drag columns to rearrange their order in the
      grid. Note that the Status Indicator and the Status column cannot be
      moved.

    **Note**: Refer to the **Checking the DICOM Log** section for additional field descriptions, as the functionality and features are similar.
    
4.  **Monitoring Mirth Details**

    - View detailed information for each Mirth initative in respective columns: Status, Status Reason, Intent, Description, Study Instance UID, Patiet Name, Requester, etc. 

## Accessing and Monitoring Email Log in OmegaAI
This section provides detailed instructions on how to access and monitor
Email log within OmegaAI.

### Steps to Access and Monitor Email Log

1.  **Accessing Email Log**

    - Open the OmegaAI homepage.  

    - Click the Logs icon located on the left side navigation bar to access
      the DICOM Logs page, which appears by default.

    - Click blue DICOM icon, a list of log options will appear. 

    - Click Email. The Email log will be displayed.

2.  **Understanding the Email Homepage**

    - **Header**:

      - **Portfolio Name**: Displays as 'Email'.

      - **Numeric**: Shows the total number of records available in the
        log.

      - **Search Icon**: Use this to enter the name of the patient and
        access various types of information such as General Information,
        Insurance Information, Activity, and Study History.

      - **All Drop-Down Menu**: Allows you to filter searches by
        categories like Study, DICOM Query, Patient, Organization, User,
        and Help.

3.  **Using the Menu Pane**

    - **Column Operations**:

      - **Search and Filter Records**: Apply filters based on any column
        through search filters.

      - **Sorting Records**: Sort the records either in ascending or
        descending order by clicking the drop-down arrow associated with
        any column and selecting the desired sorting option.

        ![Communication and Organization Tools](./Images/4.png)

    - **Rearrange Columns**: Drag columns to rearrange their order in the
      grid. Note that the Status Indicator and the Status column cannot be
      moved.

    **Note**: Refer to the **Checking the DICOM Log** section for additional field descriptions, as the functionality and features are similar.

4.  **Monitoring Email Details**

    - View detailed information for each Email initative in respective columns: Status, Sender, Receiver, Trigger, Message, etc. 

## Accessing and Monitoring SMS Log in OmegaAI
This section provides detailed instructions on how to access and monitor
the SMS log within OmegaAI.

### Steps to Access and Monitor SMS Log

1.  **Accessing SMS Log**

    - Open the OmegaAI homepage.  

    - Click the Logs icon located on the left side navigation bar to access
      the DICOM Logs page, which appears by default.

    - Click blue DICOM icon, a list of log options will appear. 

    - Click SMS. The SMS log will be displayed.

2.  **Understanding the SMS Homepage**

    - **Header**:

      - **Portfolio Name**: Displays as 'SMS'.

      - **Numeric**: Shows the total number of records available in the
        log.

      - **Search Icon**: Use this to enter the name of the patient and
        access various types of information such as General Information,
        Insurance Information, Activity, and Study History.

      - **All Drop-Down Menu**: Allows you to filter searches by
        categories like Study, DICOM Query, Patient, Organization, User,
        and Help.

3.  **Using the Menu Pane**

    - **Column Operations**:

      - **Search and Filter Records**: Apply filters based on any column
        through search filters.

      - **Sorting Records**: Sort the records either in ascending or
        descending order by clicking the drop-down arrow associated with
        any column and selecting the desired sorting option.

        ![Communication and Organization Tools](./Images/4.png)

    - **Rearrange Columns**: Drag columns to rearrange their order in the
      grid. Note that the Status Indicator and the Status column cannot be
      moved.

    **Note**: Refer to the **Checking the DICOM Log** section for additional field descriptions, as the functionality and features are similar.

4.  **Monitoring SMS Log Details**

    - View detailed information for each SMS initative in respective columns: Status, Sender, Receiver, Trigger, Message, etc. 

## Accessing and Monitoring Notification Log in OmegaAI
This section provides detailed instructions on how to access and monitor
the Notification log within OmegaAI.

### Steps to Access and Monitor Notification Log

1.  **Accessing Notification Log**

    - Open the OmegaAI homepage.  

    - Click the Logs icon located on the left side navigation bar to access
      the DICOM Logs page, which appears by default.

    - Click blue DICOM icon, a list of log options will appear. 

    - Click Notification. The Notification log will be displayed.

2.  **Understanding the Notification Homepage**

    - **Header**:

      - **Portfolio Name**: Displays as 'Notification'.

      - **Numeric**: Shows the total number of records available in the
        log.

      - **Search Icon**: Use this to enter the name of the patient and
        access various types of information such as General Information,
        Insurance Information, Activity, and Study History.

      - **All Drop-Down Menu**: Allows you to filter searches by
        categories like Study, DICOM Query, Patient, Organization, User,
        and Help.

3.  **Using the Menu Pane**

    - **Column Operations**:

      - **Search and Filter Records**: Apply filters based on any column
        through search filters.

      - **Sorting Records**: Sort the records either in ascending or
        descending order by clicking the drop-down arrow associated with
        any column and selecting the desired sorting option.

        ![Communication and Organization Tools](./Images/4.png)

    - **Rearrange Columns**: Drag columns to rearrange their order in the
      grid. Note that the Status Indicator and the Status column cannot be
      moved.

    **Note**: Refer to the **Checking the DICOM Log** section for additional field descriptions, as the functionality and features are similar.

4.  **Monitoring Notification Log Details**

    - View detailed information for each Notification initative in respective columns: Status, Sender, Receiver, Trigger, Message, etc. 

## Accessing and Monitoring Audit Logs in OmegaAI
This section guides users on how to access and monitor Audit Logs within
OmegaAI, detailing the steps to navigate and configure the Audit Log
interface. Audit Logs record all activities performed by the system and
users, providing an overview of actions based on assigned roles and
privileges.

### Steps to Access and Monitor Audit Logs

1.  **Navigating to Audit Logs**

    - Start from the OmegaAI homepage.

    - Click on Logs icon on the left side navigation bar.

    - By default, the Logs page will open. Click the Task Log
      selector icon, then select Audit Log to switch to the Audit Log
      page.

2.  **Understanding the Audit Log Interface**

    - **Header Features**:

      - **Portfolio Name**: Labelled as **Audit Log**.

      - **Numeric**: Displays the total number of audit records present.

      - **Search Icon**: Use this to enter the name of a patient or any
        related term to retrieve specific information such as General
        Information, Insurance Information, Activity, and Study History.

      - **All Drop-Down Menu**: This feature supports advanced filtering
        options by categories like Study, DICOM Query, Patient,
        Organization, User, and Help.

3.  **Utilizing the Menu Pane**

    - **Search and Filter Records**: You can search for records or apply
      filters using the search filters based on any of the available
      columns.

    - **Sorting Records**: Records can be sorted in ascending or
      descending order. Select the desired sorting option by clicking
      the drop-down arrow associated with any column.

    - **Rearrange Columns**: Customize the arrangement of columns by
      dragging them to your preferred location within the grid. Note:
      The Status Indicator and the Status column are fixed and cannot be
      moved.

    **Note**: Refer to the **Checking the DICOM Log** section for additional field descriptions, as the functionality and features are similar.

4.  **Customizing the Audit Log Layout**

    - Click on the Audit Log selector icon, then select **Settings** to
      open the **Audit Log Settings** drawer.

    - **Customization Options**:

      - **COLUMNS**:

        - To add additional columns, click the Add icon. Empty columns
          will appear where you can select the required column from a
          displayed list.

        - To clear a column value, select the column and click the
          Cancel button.

        - To delete a column, click the Delete icon associated with that
          column.

      - **FILTERS**:

        - Add filters or search criteria to refine the data displayed in
          the Audit Log.

      - **SORT**:

        - Select the columns you wish to sort by and click **Save** to
          apply the settings or **Cancel** to discard any changes.

          ![Communication and Organization Tools](./Images/5.png)

## Accessing and Monitoring Activity History in OmegaAI
This section provides instructions on how to access and monitor the
Activity History page within OmegaAI, which displays a record of all
activities you have performed. It details navigation, usage of search
functionalities, and customization options to tailor the Activity
History view to user preferences.

### Steps to Access and Monitor Activity History

1.  **Accessing Activity History**

    - Open the OmegaAI homepage.

    - Click on 'Logs' on the left side navigation bar to open the default
      Task Log page.

    - Click the Logs selector icon and select 'Activity History' to
      switch to the Activity History page.

2.  **Navigating the Activity History Page**

    - **Header Features**:

      - **Portfolio Name**: Listed as 'Activity History'.

      - **Numeric**: Indicates the total number of activity records
        present.

      - **Search Icon**: Utilizes the Global search bar to perform
        searches across various categories. Enter search criteria in the
        text box to retrieve specific information about a patient,
        including General Information, Insurance Information, Activity,
        and Study History.

      - **All Drop-Down Menu**: This menu allows for extensive filtering
        capabilities by categories such as Study, DICOM Query, Patient,
        Organization, User, and Help.

3.  **Using the Menu Pane**

    - **Column Functions**:

      - **Search and Filter Records**: Apply filters or search for
        records using the search filters based on any of the columns.

      - **Sorting Records**: Sort the records in ascending or descending
        order by selecting the desired option from the drop-down arrow
        associated with any column.

      - **Rearrange Columns**: Adjust the layout by dragging columns to
        desired positions within the grid. Note that the Status
        Indicator and the Status column cannot be moved.

4.  **Customizing the Activity History Layout**

    - Click on the Activity History Log selector icon, then select
      "Settings".

    - **Customization Options**:

      - **COLUMNS**:

        - Add additional columns by clicking the Add icon. Select the
          desired column from a list that appears in empty column spaces.

        - Clear a column value by selecting the column and clicking the
          Cancel button.

        - Delete a column by clicking the Delete icon associated with that
          column.

      - **FILTERS**:

        - Add filters or search criteria to any column to refine the display
          of records.

      - **SORT**:

        - Select columns you wish to sort the Activity History log by and
          click **Save** to apply or **Cancel** to discard changes.


