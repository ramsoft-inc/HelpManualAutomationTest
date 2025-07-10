---
sidebar_position: 8
title: Table of Worklist Fields
---

# Table of Worklist Fields

The following table describes the columns/fields available in the
worklist:

| Column/Field | Description |
|---|---|
| # of Frames | The number of frames contained in an image |
| # of Images | The number of images contained in a study |
| # of Instances | The number of DICOM instances (objects) associated with the study |
| # of Reports | The number of reports available for a study |
| Accession # | Accession number of the study or order depending on the system |
| Assigning Authority | Issuer (or the default issuer of the organization) |
| Account # | A unique account number assigned to each patient |
| Account Status | The status of the patient's account |
| Age at Study | The age of the patient at the time the study was performed |
| Anatomic Focus | <p>An anatomic identifier more specific than a body part, often indicating an organ or organ system.</p><p>For example: Brain, Liver, Pancreas, Aorta, or Knee</p> |
| Primary Prior Authorization # | <p>Display the prior authorization code for the primary insurance payer.</p><p>The value should populate once the manual prior authorization code is filled out in the Prior Authorization Drawer.</p> |
| Date of Birth | Patient birth date |
| Birth Sex | Gender assigned at birth |
| Body Part | The part of the body examined. This is a more general anatomic identifier than Anatomic Focus. For example, abdomen or chest |
| CDS ID | The clinical decision support (downS) ID |
| Smoking Status | Smoking status of the patient |
| Appointment Cancellation Reason | Reason why the appointment was cancelled |
| Clinical Notes | Information such as observations, diagnoses, or recommendations by a clinician |
| Custom Field 1 | Any desired additional information |
| Custom Field 2 | Any desired additional information |
| Date/Time Addendum | The date and time the addendum was created |
| Date/Time Last Updated | The date and time the study was last updated |
| Date/Time Ordered | The date and time the study was ordered |
| Date/Time Read | The date and time the study was read |
| Date/Time Received | The date and time the study was received |
| Date/Time Signed | The date and time the study was signed |
| Date/Time Transcribed | The date and time the study was transcribed |
| Date/Time Verified | The date and time the study was verified |
| Status To Scheduled | The time stamp when status is Scheduled |
| Scheduled Date/Time | The appointment date time |
| Department | The department to which the study belongs |
| Eligibility | The eligibility for a patient's insurance coverage. |
| Ethnicity | Ethnicity of the patient. |
| Exam Duration | The time taken for the patient to be medically examined. |
| Filler Order # | The order number pertaining to the application. This is a permanent identification for an order and related observations. |
| Financial Class | The various modes of payment options available to patients. |
| Gender | The patient's declared gender. |
| Healthcare Service | The location where the study is scheduled to be performed. |
| History | A brief description of the patient's medical history or symptom. |
| Home Phone | Home phone number of the patient. |
| Imaging Organization | Organization where the imaging service is performed. |
| Insurance Copay | The amount the patient is responsible for paying, either in % or $. |
| Insurance Expiry | Date when Insurance expires. |
| Insurance Status | The status indicates if the Insurance is eligible, pending, etc. |
| Languages | The patient's fluent language(s) |
| Laterality | The patient's position relative to the imaging beam. |
| Managing Organization | Name of the managing organization. |
| Modality | The modality type used to perform the study. |
| Object Type | Includes all types of objects, such as images, videos (including DICOM videos), dictation, reports, and objects that are stored but not viewed, that is, Radiation Therapy objects. |
| Order Appropriateness | Appropriate use criteria for image ordering. |
| Order Custom Field 1 | Optional information about the order. |
| Order Custom Field 2 | Optional information about the order. |
| Order Custom Memo | Optional detailed information about the order. |
| Order Date/Time | Date and time the order was created. |
| Patient Address | The address of the patient. |
| Patient Balance | The balance or the outstanding amount. |
| Patient Cell Phone | Cell phone number of the patient. |
| Patient Contact Method | The mode or method to contact the patient. Example, via phone, cell, or email. |
| Patient Email | Patient's email ID. |
| Patient ID | The ID or the Medical Record Number (MRN) of the patient. |
| Patient Location | Patient's location, as specified in the Visit section. |
| Patient Name | Patient's name |
| Patient State/Province | The state or province of the patient, denoted with a two-letter acronym. For example, CA for California or ON for Ontario. |
| Payer | Entity responsible for payment |
| Performing Physician | Performing physician assigned to the study. |
| Performing Physician NPI/ID | The National Provider Identifier (NPI) of the performing physician. |
| Performing Technologist | The performing technologist assigned to the study. |
| Pharmaceutical | Used to specify administered contrast agents, radio pharmaceuticals, medications, or other clinically relevant agents and/or challenges encountered with use of the agent(s) during the imaging procedure. |
| Placer Order # | The order number found in the request raised by the physician. |
| Primary Prior Authorization # | <p>Display the prior authorization code for the primary insurance payer.</p><p>The value should populated once the manual prior authorization code is filled out in the Prior Authorization Drawer.</p> |
| Priority | Status establishing the importance or urgency associated with the order. |
| Procedure | The required medical procedure. |
| Race | Race of the patient. |
| Reading Organization | The organization responsible for the study interpretation. |
| Reading Physician | The reading physician assigned to the study. For example, a Radiologist or Urologist interpreting a study. |
| Reading Physician NPI/ID | The National Provider Identifier (NPI) of the reading physician. |
| Reason For Exam | The reason for the exam. |
| Referring Organization | The organization that has referred the patient. |
| Referring Physician | The referring physician assigned to the study. For example, the primary care physician or specialist caring for the patient. **Note**: 🟨 Yellow folder icon indicates that physician is part of OAI. ⬜ Grey folder icon indicates that physician is not part of OAI. |
| Referring Physician NPI/ID | The National Provider Identifier (NPI) of the referring physician. |
| Requested Appointment Date/Time | The date and time the appointment was requested. |
| Requested Procedure ID | The identification number of the requested procedure. |
| SSN | The Social Security Number (SSN) of the patient. |
| Special Arrangement | Any special arrangements the patient may require prior to or during the examination. |
| Study Date/Time | Date and time of the study. |
| Study Description | Description of the study. |
| Study ID | An AI assigned to the study (medical record number). |
| Study Status | The current status of the study in the Workflow. The list of study statuses in the Study Search grid are based on the Managing organization. Therefore, the Study Status field is grayed out until a managing organization is selected. Once you have selected a managing organization, the Study Status becomes active. Study statuses can now only be created, edited, or deleted at the master organization level. Child organizations will automatically inherit these statuses, ensuring uniformity and eliminating potential conflicts|
| Study UID | The study's unique ID (UID). |
| Time At Status | This refers to the study duration in a specific status. The maximum time allowed for this field is 99 hours 59 seconds (99:59). If the study is in the same status for more than or equal to 100 hours (99 hours 59 seconds), the <em>Time At Status</em> field displays INFINITE. |
| Time Zone | The timezone associated with the organization. |
| Transcription Organization | The organization performing the transcription. |
| Transcriptionist | The Transcriptionist assigned to the study. |
| View | The view specified in the Study Info View field. |
| Visit # | The number assigned to the visit. |
| Visit Class | The class or visit category, such as short stay, virtual, or ambulatory. |
