---
description: >-
  This README provides guidance on the installation and execution of the
  Halo.SDK with a host Android application.
---

# Halo System Baseline

Introduction&#x20;

The Halo Dot Solution is an Android Application that enables the process tap on phone with capable Android Devices. This page describes the minimum requirements for the installation and execution of the Halo Dot solution. The Halo Dot Solution maintains a system baseline based on:

* Operating systems
* Devices supported
* SCRP devices supported

### Operating Systems <a href="#operating-systems" id="operating-systems"></a>

**Operating System Baseline**

Android version 10

|              **OS**             | **Version**           | **Status**           | **Reason for deprecation**                |
| :-----------------------------: | --------------------- | -------------------- | ----------------------------------------- |
| <p> </p><p> </p><p> Android</p> | version 6 Marshmallow | DEPRECATED           | Version does not receive security patches |
|                                 | version 7 Nougat      | DEPRECATED           | Version does not receive security patches |
|                                 | version 8 Oreo        | DEPRECATED           | Version does not receive security patches |
|                                 | version 9 Pie         | DEPRECATED           | Version does not receive security patches |
|                                 | Version 10            |  ACTIVE **BASELINE** |                                           |
|                                 | Version 11            |  ACTIVE              |                                           |
|                                 | Version 12            |  ACTIVE              |                                           |
|                                 | Version 13            |  ACTIVE              |                                           |
|                                 | Version 14            |  ACTIVE              |                                           |
|               iOS               | Not applicable        | NOT SUPPORTED        |                                           |
|            Harmony OS           | Not supported         | In development       |                                           |

### Devices Supported <a href="#devices-supported" id="devices-supported"></a>

Google-certified device

All devices that are currently compatible for the Halo Dot Solution are defined and managed in the [Google Play Console Device Catalogue](https://play.google.com/console/u/0/developers/7094180247634818303/app/4974352686746815262/devices).

### SCRP Devices Supported <a href="#scrp-devices-supported" id="scrp-devices-supported"></a>

|   | **Manufacturer** | **Model** | **Supported EMVco Kernels**                  | **PCI Listed** |
| - | ---------------- | --------- | -------------------------------------------- | -------------- |
| 1 | Wiseasy          | R1        | Mastercard, Visa, American Express, Discover |                |

The [Acceptance Process to Update COTS platform to Baseline](https://synthesis-software.atlassian.net/wiki/x/J4A0\_/) page identifies and process for making updates to the COTS. This also describes the frequency of Changes to the system baseline and how they are implemented on an ad hoc basis. The depreciation of operating systems and devices are communicated according to the [non-functional](https://synthesis-software.atlassian.net/wiki/spaces/H/pages/2411921411/Communication+Schedule#Manual-Communication-Channels) communication in the Halo communication schedule.
