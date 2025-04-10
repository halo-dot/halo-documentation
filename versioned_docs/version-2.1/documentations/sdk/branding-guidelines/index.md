# Branding Guidelines

In order to determine which scheme brand success flow to execute, your app will need to inspect the HaloTransactionResult object result sent back through the IHaloCallbacks.onHaloTransactionResult callback. This object has a HaloTransactionReceipt which an association field.

When the card tapped is a Visa card, the association field will have the value "Visa" and otherwise "MasterCard" for Mastercard cards.

Success animations are only shown if the transaction disposition is Approved.