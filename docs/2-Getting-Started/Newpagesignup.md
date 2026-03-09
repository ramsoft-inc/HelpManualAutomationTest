---
sidebar_position: 3
title: New Signup and Signin Guide
tags:
  - New Login
  - New Signup
  - Security
---
 
# Enhanced Login Security: Moving from PIN to Password

## Overview

OmegaAI and Blume now use **secure password-based authentication**, replacing the earlier **6-digit PIN** system.
This update aligns with **HITRUST password complexity standards**, strengthening account protection and safeguarding sensitive clinical data.

|**User Type**|**Update Summary**|
| :- | :- |
|**New Users**|Must create a secure alphanumeric password during sign-up.|
|**Existing Users**|Can continue using their 6-digit PIN for now, but are encouraged to switch to a password.|

### **1. Sign-Up Flow**

**Page**: **Sign-Up (Blume / OmegaAI)**


**Key Change:**
The PIN entry field has been replaced with a **Password** field. All new users must create a password that meets the complexity standards below.

## Password Requirements

|**Minimum Length**|8 characters|
| :- | :- |
|**Character Rules**|Must include at least one uppercase and one lowercase letter|
|**Special Criteria**|Must include at least one number or special character                       (e.g.,!, @, #, $)|
|**Examples**|**Recommended**: Radiology@123, SecureLogin#2025  **Not Recommended**: abcdef, 12345678|




**Additional Notes:**

- A **password strength indicator** will display **Weak**, **Good**, or **Strong** as you type.
- You can click the **eye icon** to view characters while entering your password.
- **New users cannot proceed** until all password requirements are met.
- After confirming your password, click **Continue** to complete sign-up.

### **2. Sign-In Flow**

**Page**:**Sign-In (Blume / OmegaAI)**


|**User Type**|**Sign-In Method**|**Details**|
| :- | :- | :- |
|**New Users**|Email/Username + Password                 (in case of Login via email)|Login uses the new password-based authentication.|
|**Existing Users**|Email/Username + PIN|Continue signing in with the existing 6-digit PIN for now.|
|**After Upgrade**|Email/Username + Password|Once updated, future logins require only a password.|






### **3. Forgot / Reset Password Flow**

**Page**:**Forgot Password (Blume / OmegaAI)**


The password reset process replaces the previous PIN reset flow.

|**Step**|**Action**|
| :- | :- |
|**1**|Click **Forgot Password** on the login page.|
|**2**|Enter your **registered email** to receive a verification code.|
|**3**|Enter the **verification code** to confirm your identity.|
|**4**|Create a **new password** (8 characters long) that meets HITRUST's complexity requirements (alphanumeric characters and special characters).|
|**5**|Confirm and **save** your new password.|


**Notes:**

- A **password strength validation** tool ensures compliance with security standards.
- Once changed, your password will be required for all future logins.

### **4. Changing PIN to Password (Existing Users)**

Applicable for existing users who previously used PIN-based authentication.

|**Step**|**Action**|
| :- | :- |
|**1**|Go to: • *Blume:* **Settings → Account Security** • *OmegaAI:* **Profile → Security Settings**|
|**2**|Select **Change PIN / Password**.|
|**3**|Enter your **existing 6-digit PIN** for verification.|
|**4**|Create a **new alphanumeric password** (8 characters long) that meets HITRUST standards.|
|**5**|Confirm and **save** the new password.|


**Outcome:**
After saving, users will sign in with their **password** instead of a PIN.

### **5. User Impact Summary**

|**User Type**|**Login Method**|**Action Required**|
| :- | :- | :- |
|**New Users**|Password|Must create a password during sign-up.|
|**Existing Users (PIN-based)**|PIN|Can continue using PIN or update to password at any time.|

### **6. Additional Notes**

|**Area**|**Details**|
| :- | :- |
|**Security Compliance**|Both Blume and OmegaAI now validate password strength during sign-up and reset.|
|**Transition Support**|The authentication backend currently supports both PIN and password logins.|
|**Recommendation**|All users are strongly encouraged to switch to password-based login for enhanced security and compliance with HITRUST standards.|



