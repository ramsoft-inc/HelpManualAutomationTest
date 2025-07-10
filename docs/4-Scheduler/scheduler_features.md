---
sidebar_position: 5 
title: Scheduler Features
---

# Scheduler Features

The following are the features of the Scheduler: 

1. Double click on Appointment card from the scheduler would open the study page. 

2. Patient name cannot be edited or removed in the Appointment drawer, when you open an existing appointment for viewing or editing. The patient name field would be a read only field. 

3. The Appointment status will be automatically moved to Completed status, if the workflow status is directly updated to Completed / Verified / To be Amended / Dictated / Transcribed / Signed / Faxed statuses. 

4. The appointment status cannot be changed to Requested status from the scheduler. The option will be not visible if the user tries to change the appointment status from the drop down. 

5. Only the Workflow status is Ordered can be dragged and dropped to scheduler or parking bay: 

   * If the Workflow status is not equal to Ordered, they should not be allowed to drag and drop into the scheduler or parking bay. 

   * For the Scheduler, We will show the toast message saying “Appointment cannot be scheduled for this study. Check its Workflow/Study status”. 

   * For the Parking bay, We will show the toast message saying “Appointment cannot be moved to parking bay for this study. Check its Workflow/Study status”. 

