---
sidebar_position: 1
title: What is OAI Link?
---

# What is OAI Link?

OmegaAI Link is the Daemon device that runs as a service on the
dedicated machine which sends and receives images from traditional DICOM
stations that do not support DICOM web.

**Note**: Download code for Link Installer is written on Auth API.

## Link Hardware Requirements

The OmegaAI Link requires the following hardware to function as
intended.

<table>
    <thead>
        <tr class="header">
            <th><strong>Operating System</strong></th>
            <th><strong>Minimum</strong></th>
            <th><strong>Recommended</strong></th>
        </tr>
    </thead>
    <tbody>
        <tr class="odd">
            <td><strong>OS</strong></td>
            <td>Microsoft Windows 10 or 11 (64 Bit)</td>
            <td>Microsoft Server 2016 or newer (64 Bit) Standard or Datacenter Edition</td>
        </tr>
        <tr class="even">
            <td><strong>CPU</strong></td>
            <td>4 cores</td>
            <td>i7 or better</td>
        </tr>
        <tr class="odd">
            <td><strong>RAM</strong></td>
            <td>16 GB</td>
            <td>16 GB</td>
        </tr>
        <tr class="even">
            <td><strong>Drives</strong></td>
            <td>
                <p>OS & Application 100 GB</p>
                <p>Cache 500 GB</p>
            </td>
            <td>1 TB recommended (SSD or equivalent IOPS)</td>
        </tr>
        <tr class="odd">
            <td><strong>LAN</strong></td>
            <td>1 Gbps with Static IP and appropriate DNS record</td>
            <td>1 Gbps with Static IP and appropriate DNS record</td>
        </tr>
    </tbody>
</table>

**Dedicated System Resources**:

Any server or computer utilized for RamSoft OmegaAI Link should be
reserved for the sole purpose of running the solution. Installing other
software or utilizing the resource for other purposes can have
unforeseen impacts, in which case RamSoft cannot guarantee optimal
functionality.

## How to Install OmegaAI Link

OmegaAI Link installer can be downloaded on the managing organization's
screen. This action can only be performed by the user who is given
privilege on behalf of the respective organization.

**Follow the below steps to download OmegaAI Link**

1.  Login to OmegaAI.

2.  Navigate to the managing Organization screen by clicking
    Organization from the left navigation bar.

3.  Go to the device tab.

    ![OmegaAI Link](./Images/1.png)

4.  To add a new device, click + icon (more details in section, **How to
    Manage Devices in Correlation with OAI Link**).

    ![OmegaAI Link](./Images/2.png)

5.  Enter Device Name, AE Title, IP Address/Hostname, and port number.
    (i.e., qa-rispacs, qa-rispacs, qa-rispacs, 104 for Ramsoft
    Powerserver 6.0).

6.  Click the **Download** button.

**Note**: the link has a set 60 minute expiration.

7.  Execute the downloaded EXE as administrator.

8.  The OmegaAI Link installation process begins as shown below.

    ![OmegaAI Link](./Images/3.png)

9.  After successful login you will see the device name under the device
    tab of the managing organization tab.

10. Whenever there is a new version of OmegaAI Link available, OmegaAI
    automatically updates as per the new version (i.e., no manual intervention required).

The below diagram further outlines the installation process of the
OmegaAI Link.

![OmegaAI Link](./Images/4.png)

**Note**: In case any errors arise, check the logs under the directory
"C:\OmegaAILink".

If you are unable to install, please check if service exists or not.
If service exists then you may need to delete the OmegaAI Link Service
and thus follow the uninstallation process (found in **How to Uninstall OAI
Link**).

## How to Uninstall OAI Link

To uninstall OmegaAI Link follow the below steps:

- Delete Service

- sc.exe stop RamSoft OmegaAI Link Service

- sc.exe delete RamSoft OmegaAI Link Service

>

- Delete Installation Folder

- It is stored on location C:\Program Files\RamSoft.OmegaAILink

## OAI Link Caching

The OmegaAI Link will be used for caching purposes for more efficiency
in the overall process. As it is a costly and time-consuming process to
fetch data from the server every time, the OAI Link will now be used to
make it to the lightweight web server and store the pixel data while we
receive it.

**How is the local link identified?**

The IP address is used to verify the link. To ensure further, the public
IP is used to identify the local Links as all links should have the same
public IP address.

**How is pixel data stored on the local disk?**

To ensure that the PHI data is secure at all the time, before storing
the local data in the cache it will undergo encoding.

**Note**: AESGCM algorithm is used to encode the pixel data.

**How does the link server run?**

From the initial commencing phase of the link, the secure web server
will also run. The server will also have attached a domain certificate
(HTTPS).

**How can you identify the sub-domain of the Local Link?**

The main domain name would be, omegaailink.com.
`(OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com)`. Whereas the
Link-id, can be found in the DICOM server configuration file (page
6).

### Activate Custom Domain in Local Machine

Please follow the below steps to activate a custom domain in your local
machine.

1.  Please open the editor (notepad) as administrator and open the [host
    file](https://devnet.kentico.com/articles/what-is-the-hosts-file-and-how-to-use-it):
    C:\Windows\System32\drivers\etc\hosts

    ![OmegaAI Link](./Images/5.png)

    **Link-id:** Can be found in DICOM server configuration file.

    ![OmegaAI Link](./Images/6.png)

    **Location**: C:\ProgramFiles\RamSoft.OmegaAILink\DICOMServerConfig.json

    ![OmegaAI Link](./Images/7.png)

    **Organization-Name:** Organization name will contain only alphanumeric characters, all other characters will be replaced with **“-”**.

2.  Once the configuration is saved, restart the RamSoft OmegaAI Link
    Service.

3.  Add client ID to Launch darkly feature flag.

4.  To test domain on browser use the following:
    `https://OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com<u>/DICOMcache</u>`

5.  Once Link Caching has been successfully configured, the following
    message will be displayed:

    ![OmegaAI Link](./Images/8.png)

**Notes**: It is recommended for all testing environments to first bind
the domain with your local IP address. You may use 127.0.0.1 as your IP
address.

**Example**: 127.0.0.1
`OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com`

- Only one space should exist between IP and Link here:
  192.168.XX.XX
  `OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com`

- OMEGAAILINK must be in upper case and Organization Name should follow
  the same letter case as entered in OmegaAI (for the Link Name).

  > As seen here: `192.168.XX.XX OMEGAAILINK-{link-id}-{organization-name}.omegaailink.com`

## Data Communication & Security

### Data Communication

OmegaAI Link receives data from configured modalities using DICOM
standards TCP/IP Port. This is all configured at the time of
installation.

**Modalities**

Modalities from the hospital facilities will send data over TCP/IP
protocol unencrypted via port (configurable in OmegaAI).

**Note**: This must be LAN to LAN communication, which should suffice if
all communications are local.

Moreover, DICOM TLS can be incorporated for OmegaAI Link upon client
request.

### Data Security

For enhanced security, the received data is transferred to the OmegaAI
server using secured "https:" protocol. This process calls out secured
API on OmegaAI server which in turn is authenticated by OAuth 2.0
standard.

**Encryption**

Encryption in transit is applied using **TLS v1.2** when communicating on
premise to Azure.

**Stand-Alone Device**

As OmegaAI Link is a stand-alone device, encryption at rest cannot be
standardized at the disk or operating system level.

**Note**: OS disk is encrypt and decrypt.

## How to Manage Devices in Correlation with OAI Link

The Device section allows you to view a list of DICOM Web and DICOM
proxies that are integrated with the organization.

Adding a new device involves two steps; adding the device and adding a
DICOM station to connect the device to OmegaAI.

### Adding New DICOM Device

1.  Click Organization from the left navigation bar.

2.  Click **Device**. The Device page opens.

3.  Enter the following details:

- **Device Type**: By default, the device type is OmegaAI Link. This
  field cannot be edited.

- **Name:** Name of respective machine/device.

- **AE Title:** Application Entity Title is the link identity.

- **Port:** Port number of the respective device.

4.  Click **Download** to download and install OmegaAI Link.

The new device is added to the list of devices.

![OmegaAI Link](./Images/9.png)

### Adding DICOM Station

DICOM stations use the Transmission Control Protocol (TCP) to connect to
the OmegaAI Link device, which connects to OmegaAI.

1.  As soon as a device is created, a panel opens adjacent to the list
    of devices. Click **+** in the panel.

2.  Perform the following in the General section:

    ![OmegaAI Link](./Images/10.png)

- **DICOM Stations**: Enter the name of the DICOM station that you want
  to add.

- **AE Title** (mandatory field): Enter the title of the Application
  Entity (AE).

- **IP Address/Hostname**: Enter the IP Address of the station that will
  be used for DICOM communication.

If the IP Address is dynamic, enter the name of the machine.

- **Port** (mandatory for DICOM send and optional for receive): Enter
  the port number of the station that will be used for DICOM communication.

- **Enable TLS**: Select this checkbox to encrypt the DICOM
  communication.

- **Is Archive Server**: Select this checkbox if it is an archive
  server.

- **Need IOCM Notification**: Select this if Imaging Object Change Management (IOCM) notification is required.

- **DICOM Station Description**: Enter the description of the DICOM
  station.

- **Export**: Click to export the DIOCM station configuration to JSON
  format. You can update or edit the exported configuration.

- **Import**: After modifying the configuration details,
  click **Import** to upload it.

- **Active**: Click **Active**ΓÇ»to set the DICOM station to active.

- **Enable Heartbeat**: Select this button to enable heartbeat.

- **Test Connection**: After you have completed all the details for the
  DICOM station, click this button to test the connection.

- **Status**: This field is automatically populated. It indicates the
  status of the DIOCM status based on the heartbeat.

  Depending on the status, this field displays the following values:

  - **Active**: Indicates that the DIOCM station is active.

  - **Unknown**: Indicates that the DIOCM station is unknown.

  - **Offline**: Indicates that the DIOCM station is offline.

  If the DICOM station is offline, the system will not attempt to actively
  perform DICOM-send.

3.  Select the following options in the DICOM Stations Features section,
    as required:

- **Enable Heartbeat**: Select this button to enable heartbeat.

- **Send to device DICOM stations**: Select this checkbox to allow
  OmegaAI to send studies to the DICOM station.

- **Query/Retrieve:** Select this checkbox to allow the DICOM station to service DICOM queries or retrieve studies.

- **Sending Original Patient ID and Issuer**: Select this checkbox to preserve and send the original Patient ID and Issuer of Patient ID DICOM tag.

  **Note**: This refers to the information that was originally received.

### Understanding DICOM Heartbeat

The DICOM heartbeat is a utility that prevents the DICOM station from
sending studies to a station that is offline.

**Note**: It sends a DICOM ping to the remote station every 10 minutes
to verify whether the station is up or not.

DICOM heartbeat consists of three statuses,

- **Online**

If the DICOM heartbeat is enabled, and the station is up and responding
to the pings, then the status of the station appears as Online and a
green indicator is displayed.

- **Offline**

If the DICOM heartbeat is enabled and the DICOM pings fail, the status
of the station appears as Offline and a red indicator is displayed.

- **Unknown**

If the DICOM heartbeat is not enabled for a station, its status will
appear as Unknown.

### DICOM Query Echo & Search

DICOM Query Echo is used to verify the connection status (i.e. Online,
Offline, Unknown, etc.), whereas DICOM Query Search is utilized to
search studies and retrieve DICOM objects from other DICOM devices
(i.e., remote stations).

### DICOM Query Echo

To query successfully, we need to first ensure that the target
device/station is online. This can be done by using Echo (click **TEST
CONNECTION** button to verify device status) in the Organization Device
detail page.

![OmegaAI Link](./Images/11.png)

Follow the below steps to navigate to the Organization Device detail
page.

1.  Click Organization from the left navigation bar.

2.  Click **Device**. The Device page opens.

### Perform DICOM Query Search

Please follow the below steps to perform DICOM Query Search.

1.  Click the dropdown arrow in the Search bar.

2.  Select DICOM Query. A panel appears.

    ![OmegaAI Link](./Images/12.png)

3.  Enter the following details in the panel:

        - **Organization**\[Mandatory\]: Enter the name of the organization the

    DICOM objects belongs to. This field displays possible matches to the
    text as you type.

          **Note**: You must be associated with the organization

    that you are searching in.

        - **Device:** Enter the device name. This is also a search as you type

    field.

        - **Search Fields**: Use these fields to further narrow down your search

    criteria.

          Click **More** to add more fields. All the columns associated with studies are displayed.

          You can search for fields by typing in the Search bar.

          Click **Delete** to remove a field from the search criteria.

4.  **Note**: You cannot search for DICOM objects with specifying the
    organization and device name.

5.  **Patient**: Use to search for specific patient(s).

6.  **Organization**: Use to search for specific organization(s).

7.  **Device**: Use to search for DICOM objects that are in other DICOM
    devices.

8.  Click **Search** to search or click **Cancel** to discard.

9.  Click Save. After saving, all matching records are displayed.

10. Click the Study avatar associated with the study or studies in the
    result.

11. Click **RETRIEVE STUDY**.

        The **RETRIEVE STUDY** button becomes active only after you

    select a study.

        After a few seconds, the circular arrow-shaped icon is

    replaced with **TRACK**.

        **Note**:**Track** indicates that the study retrieval process is in progress.

12. Click **TRACK** to view the progress in the Task Log page.

#### Send a Study

Send study can be utilized by users to send a study to a remote
device/station. Also known as **DICOM Transmit** or **DICOM Store
Push**.

**Note**: Study can be anonymized.

#### Send Studies to other Devices

1.  From the worklist, click once on desired study. The Omega dial is
    displayed.

    ![OmegaAI Link](./Images/13.png)

2.  Click **Send Study**. The Send Study panel opens.

    ![OmegaAI Link](./Images/14.png)

3.  Enter the following information:

    - **Priority**: Select one of the following pre-configured
      options: **High, Medium, or Low**.

    - **Imaging Organization**: Type the name of the imaging organization to
      which you want to send the image. As soon as you start typing,
      matching organizations are displayed.

    - **Destination (Device)**: All the devices associated with the imaging
      organization you have selected are available. Select the appropriate
      device.

    **Note**: You can select only one device.

4.  Click **SEND** to send the study or **CANCEL** to discard.

    If you click **Send**, a message stating that transmission has been successful is displayed and the studies are added to the queue.

    **Note**: You can check the progress and status of the transmission in the Task Log.
