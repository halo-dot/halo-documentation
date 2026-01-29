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

## Supported SDKs <a href="#supported-sdks" id="supported-sdks"></a>

| **Version**           | **Status**           |
| :-------------------: | -------------------- |
| 2.0.x                 | DEPRECATED           |
| 2.1.x                 |  ACTIVE              |
| 4.x.x                 |  ACTIVE **BASELINE** |

## Operating Systems <a href="#operating-systems" id="operating-systems"></a>

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
|                                 | Version 15            |  ACTIVE              |                                           |
|                                 | Version 16            |  ACTIVE              |                                           |
|               iOS               | Not applicable        | NOT SUPPORTED        |                                           |
|            Harmony OS           | Not supported         | In development       |                                           |

## Devices Supported <a href="#devices-supported" id="devices-supported"></a>

Google-certified device

All devices that are currently compatible for the Halo Dot Solution are defined and managed in the [Google Play Console Device Catalogue](https://play.google.com/console/u/0/developers/7094180247634818303/app/4974352686746815262/devices).

In addition to being compatible with our solution, we will need your device to grant the below permissions:

* Location
* Bluetooth
* Camera
* Microphone
* Storage

## SCRP Devices Supported <a href="#scrp-devices-supported" id="scrp-devices-supported"></a>

|   | **Manufacturer** | **Model** | **Supported EMVco Kernels**                  | **PCI Listed** |
| - | ---------------- | --------- | -------------------------------------------- | -------------- |
| 1 | Wiseasy          | R1        | Mastercard, Visa, American Express, Discover |                |

The [Acceptance Process to Update COTS platform to Baseline](https://synthesis-software.atlassian.net/wiki/x/J4A0\_/) page identifies and process for making updates to the COTS. This also describes the frequency of Changes to the system baseline and how they are implemented on an ad hoc basis. The depreciation of operating systems and devices are communicated according to the [non-functional](https://synthesis-software.atlassian.net/wiki/spaces/H/pages/2411921411/Communication+Schedule#Manual-Communication-Channels) communication in the Halo communication schedule.


## Supported Card Type

<p class="noShadow">
- ![visa](https://cdn.prod.website-files.com/63f8ad30f40a41f7b046d567/64904eee03db594661e1e7e3_visa-logo.svg)
- ![Mastercard](https://cdn.prod.website-files.com/63f8ad30f40a41f7b046d567/64904eee6bfb3ab3c036d1b7_Mastercard.svg)
- ![Amex](https://cdn.prod.website-files.com/63f8ad30f40a41f7b046d567/64904eee81ed6b3bdc49e89d_Amex.svg)
- ![Discover](https://cdn.prod.website-files.com/63f8ad30f40a41f7b046d567/64904eee4af603717c6f273b_Discover.svg)
- ![GooglePay](https://cdn.prod.website-files.com/63f8ad30f40a41f7b046d567/64904eee08036a558138db64_Google_pay.svg)
- ![ApplePay](https://cdn.prod.website-files.com/63f8ad30f40a41f7b046d567/64904eeecd9e7bbd6e87737e_Apple_pay.svg)
- ![Samsungpat](https://cdn.prod.website-files.com/63f8ad30f40a41f7b046d567/64904eef5ee9e1391db5d595_Samsung_pay.svg)
</p>