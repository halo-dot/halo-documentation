# Step 3: Integrations (Optional)

## React Native Integration

React Native serves as a bridge to construct native views, grounded in React's declarative UI framework, thereby enabling integration with Visa Sensory Branding's native SDKs for both iOS and Android platforms.&#x20;

Currently, there are two methodologies available to encapsulate native views for embedding into a React Native application:&#x20;

* • _Native Components_: refer to the official documentation https://reactnative.dev/docs/native-components-android&#x20;
* • _Fabric Native Components_: refer to the official documentation https://reactnative.dev/docs/the-new-architecture/pillars-fabric-components&#x20;

Developers are advised to select a method that aligns with their React Native version and the status of their ongoing project.&#x20;

## Flutter Integration

Flutter's "Platform Views" allow you to embed native views in a Flutter app, it supports two modes: hybrid composition and virtual displays:

* Hybrid composition appends the native \`android.view.View\` to the view hierarchy. Therefore, keyboard handling, and accessibility work out of the box.&#x20;
* Virtual displays render the \`android.view.View instance\` to a texture, so it's not embedded within the Android Activity's view hierarchy. Certain platform interactions such as keyboard handling and accessibility features might not work.&#x20;

The Visa Sensory Branding SDK is compliant with accessibility standards. For optimal accessibility support, we suggest using the hybrid composition method. Consult the official documentation below for a detailed guide on how to integrate the Android native view: https://docs.flutter.dev/platform-integration/android/platform-views



