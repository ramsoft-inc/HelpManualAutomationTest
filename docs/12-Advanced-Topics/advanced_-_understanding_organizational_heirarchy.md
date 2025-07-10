---
sidebar_position: 1
title: Understanding Organizational Hierarchy
tags:
  - Organization Type
  - Master Organization
  - Managing Organization
  - Imaging
  - Organization
  - Referring Organization
  - Study Management
  - Device Installation
  - Workflow Automation
  - RIS Configurations
  - HealthcareResources
---

# Understanding Organizational Hierarchy

This section of the OmegaAI help manual provides information on
different types of organizations within the system, their specific
capabilities, and how studies are managed and linked to these
organizations. It also discusses the importance of correct
organizational settings during the initial setup and considerations for
changes post-implementation.

## Current Organization Types in OmegaAI

### Master Organization

The Master Organization represents the topmost level in any
organizational hierarchy in OmegaAI. It holds capabilities over the
entire system, tailored to ensure broad management and configurational
oversight.

**Capabilities:**

- **Role Configuration:** Manage and configure roles across the entire
  organization.

- **Workflow Automation:** Automate processes and workflows to
  streamline operations.

- **Status Customizations:** Customize and manage various statuses
  within the system to reflect unique organizational processes.

- **RIS Configurations:** Configure and manage Radiology Information
  System settings tailored to organizational needs.

### Managing Organization

A Managing Organization operates at any level within the hierarchy but
beneath the Master Organization. It plays a pivotal role in user
management and operational control within its scope.

**Capabilities:**

- **Managing Users:** Oversee user roles, permissions, and activities
  within the organization.

- **Stamping for Incoming Studies:** Utilize organizational credentials
  to mark imaging studies.

- **Healthcare Resource Management:** Accept and manage healthcare
  resources necessary for operational functionality.

- **Device Installation:** Install and configure devices using Link and
  FHIR technologies.

### Imaging Organization

An Imaging Organization is a specific type of Managing Organization
focused primarily on receiving and handling imaging studies.

**Special Role:**

- **Study Reception:** Acts as the receiving point for studies
  transmitted through the OAI Link, ensuring studies are managed and
  cataloged appropriately.

### Referring Organization

A Referring Organization generally exists outside the customer's
organizational hierarchy but can be linked to a managing organization
within it.

**Unique Characteristic:**

- **External Linking:** Though external, it can be linked for the
  purpose of referring or accessing studies and resources.

## Understanding Study Relationships to Organizations

### Study Management in Organizational Context

- **Managing Organization:** Typically, the study is managed by the
  Master Organization by default. However, it can also be set as the
  organization from which the study is imported or linked.

- **Imaging Organization:** This indicates the origin of the study,
  typically aligned with the managing organization of the device from
  which the study was received.

- **Scheduling Considerations:** When scheduling resources, it is
  crucial to ensure that the healthcare resources are defined under the
  same managing organization that will host the imaging device. This
  alignment is necessary for the system to accurately recognize and
  manage the imaging organization.

**Note**: Any changes to the Organization Type after initial setup
should be performed with care to ensure optimal system performance and
compliance with operational requirements.
