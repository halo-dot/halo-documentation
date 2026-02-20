---
id: create-android-app
title: Create Android App
sidebar_class_name: hidden
sidebar_display: none
tags:
  - sdk
  - guides
---

As your **Coding Partner**, I'll guide you through creating a simple Android app using **Kotlin** and **Jetpack Compose** (the modern standard for Android UI).

This guide assumes you have **Android Studio** installed.

---

#### Quick Start Guide

##### 1. Project Overview

We will create a single-screen app to demonstrate the usage of the SDK:<br/>
Using Kotlin Compose to create a simple input (amount and reference) and a button to start a transaction.

* The user enters an amount and a transaction reference into a **TextField**.
* A **Button** validates the input and starts a transaction.
* A **Text** label displays a success or error message.
  
Tested on Android Studio Panda 1 | 2025.3.1

---

##### 2. Implementation Steps

###### Step 1: Create the Project

1. Open Android Studio and select **New Project**.
2. Choose **Empty Activity** (now provides support for Jetpack Compose) or **Empty Compose Activity**.
3. Name your app (e.g., "HaloInputApp") and ensure the language is **Kotlin**.
4. Wait for the Gradle sync to finish (watch the bar at the bottom).

###### Step 2: Add the UI

Open `MainActivity.kt`. You will see a `Greeting` function. Replace it with this concise version of your goal:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
        MaterialTheme {
            Surface {
                SimpleInputApp() // implemented below
            }
        }
    }
}

```

###### Step 3. The Code (MainActivity.kt)

In a Jetpack Compose project, your UI is defined in Kotlin functions. Replace your `setContent` block or create a new Composable function:

```kotlin
import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*
import androidx.compose.ui.*
import androidx.compose.ui.unit.dp

@Composable
fun SimpleInputApp() {
    // 1. State variables to hold input and messages
    var userInput by remember { mutableStateOf("") }
    var resultMessage by remember { mutableStateOf("") }
    var isError by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // 2. The Input Field
        TextField(
            value = userInput,
            onValueChange = { userInput = it },
            label = { Text("Enter Secret Code") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 3. The Submit Button
        Button(
            onClick = {
                if (userInput == "1234") {
                    resultMessage = "Success! Access Granted."
                    isError = false
                } else {
                    resultMessage = "Failed! Incorrect Code."
                    isError = true
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Submit")
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 4. Message Display
        if (resultMessage.isNotEmpty()) {
            Text(
                text = resultMessage,
                color = if (isError) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.headlineSmall
            )
        }
    }
}

```

---

###### Step 4: Run the App

1. Connect an Android device via USB or start an Emulator.
2. Click the **Run** button (green play icon) in the top toolbar.

---