# SDK Error Codes

|Error Code| Description|
|-----|-----------------|
|0|OK|
|1|Declined|
|2|Declined Offline|
|65|Single Tap And Pin|
|100|Unauthorised|
|101|Forbidden|
|102|Invalid Api Key|
|103|Invalid JSON|
|104|Invalid Request|
|105|Blocked User|
|106|Request Signature Invalid|
|107|Request Signature Missing|
|108|Device Key Missing|
|109|Device Key Invalid|
|110|Replayed Message|
|111|Request Signing Key Missing|
|112|Request Signing Key Invalid|
|113|Request Encryption Key Missing|
|114|Request Encryption Key Invalid|
|115|Device Not Attested|
|116|Device Failed Attestation|
|117|JWT Invalid|
|118|JWT Expired|
|119|Id Already Exists|
|120|Phone Number Not Verified|
|121|Email Not Verified|
|122|Data Not Found|
|123|Transaction Does Not Belong To Merchant|
|124|Duplicate Merchant Reference|
|125|Receipt Signature Invalid|
|126|Invalid Algorithm|
|127|Site Identifier Invalid|
|128|Site Identifier Missing|
|129|Error With External Request|
|130|Email Already Exists|
|131|Phone Already Exists|
|132|Max Login Retries Exceeded|
|133|Integrator Not Approved|
|134|Data Error|
|135|User Invalid|
|136|Unknown Device Installation Id|
|137|Request Encryption Unsupported Curve|
|138|Secure Card Reader Not Supported|
|139|Blocked Device|
### 200
|Error Code| Description|
|-----|-----------------|
|200|Database Integrity Failed|
|201|Database Error|
|202|Decrypt Request Error|
|203|Unknown Error|
|204|Crypto Error|
|205|Dukpt Transaction Counter Overflow|
|208|Invalid Payment Provider|
|209|Declined By Payment Provider|
|210|Failed To Submit To All Payment Providers|
|211|Invalid Pin Data|
|212|Refund Too Late|
|213|Refund Already Processed|
|214|Missing Pfs Server Key|

### 300 Device Error Codes
|Error Code| Description|
|-----|-----------------|
|300|NFC Disabled|
|301|Invalid System State|
|302|Invalid Currency|
|303|Invalid Android Version|
|304|Error Parsing JWT|
|305|Network Error|
|306|Response Signature Missing|
|307|Response Signature Invalid|
|308|Server Requested Config Clear|
|309|Error Deserialising|
|310|Safety Net Attestation Error|
|311|Google Play Unavailable|
|312|Time Drift Too Great|
|313|Attestation In Progress|
|314|Rooted Device|
|315|Instrumented Device|
|316|Debugged Device|
|317|Cancelled Transaction|
|318|Card Tap Timeout Expired|
|319|Transaction Error|
|320|TEE Attestation Error|
|321|Error Validating Pin Key|
|322|Integrity Check Failed|
|323|Use Of Nfc State Before Connect|
|324|Failed To Import Server Signing Cert|
|325|Failed To Import Server Encryption Key|
|326|Not Implemented|
|327|Missing Sensors|
|328|Microphone Was Unmuted|
|329|Null Attestation Handle|
|330|Cryptography Error|
|399|System Not Initialised|

### 400
|Error Code| Description|
|-----|-----------------|
|401|Camera Permission Not Granted|
|402|Accessibility Service Blocks Pin|
|403|Developer Options Enabled|
|404|Missing Attestation Nonce|
|405|Config Fetch Error|
|406|Missing Entropy|
|410|Invalid Transaction Reference|
|411|Missing Secure Card Reader Implementation|
|412|Failed To Get Random Bytes|
|413|Missing Data Kek|
|414|Pin Error|

### 500 Secure Card Reader Errors
|Error Code| Description|
|-----|-----------------|
|500|Bluetooth Connect Permissions Not Granted|
|501|Bluetooth Scan Permission Not Granted|
|502|Bluetooth Unavailable|
|503|Bluetooth Scan In Progress|
|504|Bluetooth Pair Failed|
|505|Secure Card Reader Command Failed|
|506|Bluetooth Device Unavailable|
|507|Secure Card Reader Timeout|
|508|Secure Card Reader Config Invalid|
|509|Bluetooth Not Enabled|
|510|Secure Card Reader Pin Error|
|511|Secure Card Reader Plugin Not Available For Device|
|512|Secure Card Reader Transaction In Progress|
|513|Bluetooth Fine Location Permissions Not Granted|
|514|Bluetooth Pair Timeout|
|515|Secure Card Reader Key Load Error|
|516|Secure Card Reader Low Battery|
|517|Secure Card Reader Disconnected|
|518|Secure Card Reader Firmware Update Required|
|519|Secure Card Reader Firmware Update In Progress|
|520|Secure Card Reader Security Mechanism Disabled|
|521|Secure Card Reader Tamper Flag Set|
