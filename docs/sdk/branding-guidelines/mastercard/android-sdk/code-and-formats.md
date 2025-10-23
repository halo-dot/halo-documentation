# Code and Formats

## Status Code <a href="#status-code" id="status-code"></a>

`StatusCode` provides different status during `prepare()` and `play()` api invocation through `onPrepareListener` and `onCompleteListener` of sdk.

| StatusCode                        | Description                                                                                                                                                                                                                                    | Step to Resolve                                    | Method where it can occur                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| `SUCCESS`                         | Success event of `prepare()` and `play()`                                                                                                                                                                                                      |                                                    | `onPrepareListener.onPrepared()`, `onCompleteListener.onComplete()` |
| `SUCCESS_WITH_UPGRADE_FAILURE`    | Error occurred when remote upgrade has failed and embedded assets are used for playback                                                                                                                                                        |                                                    | `onCompleteListener.onComplete()`                                   |
| `ERROR_WHILE_PREPARING`           | Error occurred during resource preparation in `prepare()`                                                                                                                                                                                      | call `prepare()` with different `SonicType`        | `onPrepareListener.onPrepared()`                                    |
| `ERROR_WHILE_PREPARING_SOUND`     | Error occurred during resource preparation of sound in `prepare()` with `SonicType.SOUND_AND_ANIMATION`. If you avoid error and still call `play()` then it will play only animation.                                                          | call `prepare()` with `SonicType.ANIMATION_ONLY`   | `onPrepareListener.onPrepared()`                                    |
| `ERROR_WHILE_PREPARING_ANIMATION` | Error occurred during resource preparation of animation in `prepare()` with `SonicType.SOUND_AND_ANIMATION`. If you avoid error and still call `play()` then it will play only sound                                                           | call `prepare()` with `SonicType.SOUND_ONLY`       | `onPrepareListener.onPrepared()`                                    |
| `ERROR_WHILE_PREPARING_HAPTICS`   | Error occurred during resource preparation of haptics data for haptics feedback in `prepare()` with sonicType                                                                                                                                  | `onPrepareListener.onPrepared()`                   |                                                                     |
| `ERROR_ALREADY_PLAYING`           | Error occurred when sonic is already playing                                                                                                                                                                                                   |                                                    | `onCompleteListener.onComplete()`                                   |
| `ERROR_WHILE_PLAYING`             | Error occurred while playing sonic animation and sound or both in `play()`                                                                                                                                                                     | call `prepare()` with different `SonicType`        | `onCompleteListener.onComplete()`                                   |
| `ERROR_WHILE_PLAYING_SOUND`       | Error occurred while playing sonic sound in `play()`. If `prepare()` is invoked with `SonicType.SOUND_AND_ANIMATION` and failed with `ERROR_WHILE_PREPARING_SOUND`.                                                                            | call `prepare()` with a `SonicType.ANIMATION_ONLY` | `onCompleteListener.onComplete()`                                   |
| `ERROR_WHILE_PLAYING_ANIMATION`   | Error occurred while playing sonic animation in `play()`. If `prepare()` is invoked with `SonicType.SOUND_AND_ANIMATION` and failed with `ERROR_WHILE_PREPARING_ANIMATION`.                                                                    | call `prepare()` with `SonicType.SOUND_ONLY`       | `onCompleteListener.onComplete()`                                   |
| `ERROR_NOT_PREPARED`              | Error occurred when `play()` is called without invoking `prepare()` or `ERROR_WHILE_PREPARING` received in `prepare()`                                                                                                                         | call `prepare()` with different `SonicType`        | `onCompleteListener.onComplete()`                                   |
| `ERROR_WHILE_PLAYING_HAPTICS`     | Error occurred while playing haptics feedback in `play()`. If `prepare()` is invoked when (isHapticsSupportedForCue == true && isHapticsSupportedByDevice == true && isHapticsEnabled == true) and failed with `ERROR_WHILE_PREPARING_HAPTICS` | `onCompleteListener.onComplete()`                  |                                                                     |

\


## CopiedCountry Codes <a href="#country-codes" id="country-codes"></a>

To initialize sonic merchant country code needs to be provided and this information can be referred from the below grid.

`Country Code` should be referred from Country Code column.

| Country                        | Country Code |
| ------------------------------ | ------------ |
| AMERICAN SAMOA                 | ASM          |
| AUSTRALIA                      | AUS          |
| BANGLADESH                     | BGD          |
| BHUTAN                         | BTN          |
| BRUNEI DARUSSALAM              | BRN          |
| CAMBODIA                       | KHM          |
| CHINA                          | CHN          |
| COOK ISLANDS                   | COK          |
| FIJI                           | FJI          |
| FRENCH POLYNESIA               | PYF          |
| GUAM                           | GUM          |
| HONG KONG                      | HKG          |
| INDIA                          | IND          |
| INDONESIA                      | IDN          |
| JAPAN                          | JPN          |
| KIRIBATI                       | KIR          |
| KOREA$ REPUBLIC OF             | KOR          |
| LAO PEOPLE’S DEMOCRATIC REPUB  | LAO          |
| MACAO                          | MAC          |
| MALAYSIA                       | MYS          |
| MALDIVES                       | MDV          |
| MARSHALL ISLANDS               | MHL          |
| MICRONESIA$FEDERATED STATES OF | FSM          |
| MONGOLIA                       | MNG          |
| MYANMAR                        | MMR          |
| NEPAL                          | NPL          |
| NEW CALEDONIA                  | NCL          |
| NEW ZEALAND                    | NZL          |
| NORTHERN MARIANA ISLANDS       | MNP          |
| PALAU                          | PLW          |
| PAPUA NEW GUINEA               | PNG          |
| PHILIPPINES                    | PHL          |
| SAMOA                          | WSM          |
| SINGAPORE                      | SGP          |
| SOLOMON ISLANDS                | SLB          |
| SRI LANKA                      | LKA          |
| TAIWAN                         | TWN          |
| THAILAND                       | THA          |
| TONGA                          | TON          |
| U.S. MINOR OUTLYING ISLANDS    | UMI          |
| VANUATU                        | VUT          |
| VIET NAM                       | VNM          |
| WALLIS AND FUTUNA              | WLF          |
| CANADA                         | CAN          |
| SAINT PIERRE AND MIQUELON      | SPM          |
| ALAND ISLANDS                  | ALA          |
| ALBANIA                        | ALB          |
| ANDORRA                        | AND          |
| ARMENIA                        | ARM          |
| AUSTRIA                        | AUT          |
| AZERBAIJAN                     | AZE          |
| BELARUS                        | BLR          |
| BELGIUM                        | BEL          |
| BOSNIA AND HERZEGOVINA         | BIH          |
| BULGARIA                       | BGR          |
| CROATIA                        | HRV          |
| CYPRUS                         | CYP          |
| CZECH REPUBLIC                 | CZE          |
| DENMARK                        | DNK          |
| ESTONIA                        | EST          |
| FALKLAND ISLANDS (MALVINAS)    | FLK          |
| FAROE ISLANDS                  | FRO          |
| FINLAND                        | FIN          |
| FRANCE                         | FRA          |
| FRENCH GUIANA                  | GUF          |
| GEORGIA                        | GEO          |
| GERMANY                        | DEU          |
| GIBRALTAR                      | GIB          |
| GREECE                         | GRC          |
| GREENLAND                      | GRL          |
| GUADELOUPE                     | GLP          |
| GUERNSEY                       | GGY          |
| HOLY SEE (VATICAN CITY STATE)  | VAT          |
| HUNGARY                        | HUN          |
| ICELAND                        | ISL          |
| IRELAND                        | IRL          |
| ISLE OF MAN                    | IMN          |
| ISRAEL                         | ISR          |
| ITALY                          | ITA          |
| JERSEY                         | JEY          |
| KAZAKHSTAN                     | KAZ          |
| KOSOVO                         | BRB          |
| KYRGYZSTAN                     | KGZ          |
| LATVIA                         | LVA          |
| LIECHTENSTEIN                  | LIE          |
| LITHUANIA                      | LTU          |
| LUXEMBOURG                     | LUX          |
| MACEDONIA                      | MKD          |
| MALTA                          | MLT          |
| MARTINIQUE                     | MTQ          |
| MAYOTTE                        | MYT          |
| MOLDOVA$ REPUBLIC OF           | MDA          |
| MONACO                         | MCO          |
| MONTENEGRO                     | MNE          |
| NETHERLANDS                    | NLD          |
| NORWAY                         | NOR          |
| POLAND                         | POL          |
| PORTUGAL                       | PRT          |
| REUNION                        | REU          |
| ROMANIA                        | ROU          |
| RUSSIAN FEDERATION             | RUS          |
| SAINT BARTHELEMY               | BLM          |
| SAINT MARTIN FRENCH PART       | MAF          |
| SAN MARINO                     | SMR          |
| SERBIA                         | SRB          |
| SLOVAKIA                       | SVK          |
| SLOVENIA                       | SVN          |
| SPAIN                          | ESP          |
| SWEDEN                         | SWE          |
| SWITZERLAND                    | CHE          |
| TAJIKISTAN                     | TJK          |
| TURKEY                         | TUR          |
| TURKMENISTAN                   | TKM          |
| UKRAINE                        | UKR          |
| UNITED KINGDOM                 | GBR          |
| UZBEKISTAN                     | UZB          |
| ANGUILLA                       | AIA          |
| ANTIGUA AND BARBUDA            | ATG          |
| ARGENTINA                      | ARG          |
| ARUBA                          | ABW          |
| BAHAMAS                        | BHS          |
| BARBADOS                       | BRB          |
| BELIZE                         | BLZ          |
| BERMUDA                        | BMU          |
| BOLIVIA$PLURINATIONAL STATE OF | BOL          |
| BONAIRE$SAINT EUSTATIUS & SABA | BES          |
| BRAZIL                         | BRA          |
| CAYMAN ISLANDS                 | CYM          |
| CHILE                          | CHL          |
| COLOMBIA                       | COL          |
| COSTA RICA                     | CRI          |
| CUBA                           | CUB          |
| CURACAO                        | CUW          |
| DOMINICA                       | DMA          |
| DOMINICAN REPUBLIC             | DOM          |
| ECUADOR                        | ECU          |
| EL SALVADOR                    | SLV          |
| GRENADA                        | GRD          |
| GUATEMALA                      | GTM          |
| GUYANA                         | GUY          |
| HAITI                          | HTI          |
| HONDURAS                       | HND          |
| JAMAICA                        | JAM          |
| MEXICO                         | MEX          |
| MONTSERRAT                     | MSR          |
| NETHERLANDS ANTILLES           | ANT          |
| NICARAGUA                      | NIC          |
| PANAMA                         | PAN          |
| PARAGUAY                       | PRY          |
| PERU                           | PER          |
| PUERTO RICO                    | PRI          |
| SAINT KITTS AND NEVIS          | KNA          |
| SAINT LUCIA                    | LCA          |
| SINT MAARTEN (DUTCH PART)      | SXM          |
| ST. VINCENT AND THE GRENADINES | VCT          |
| SURINAME                       | SUR          |
| TRINIDAD AND TOBAGO            | TTO          |
| TURKS AND CAICOS ISLANDS       | TCA          |
| URUGUAY                        | URY          |
| VIRGIN ISLANDS$ BRITISH        | VGB          |
| VIRGIN ISLANDS$ U.S.           | VIR          |
| AFGHANISTAN                    | AFG          |
| ALGERIA                        | DZA          |
| ANGOLA                         | AGO          |
| BAHRAIN                        | BHR          |
| BENIN                          | BEN          |
| BOTSWANA                       | BWA          |
| BRITISH INDIAN OCEAN TERRITORY | IOT          |
| BURKINA FASO                   | BFA          |
| BURUNDI                        | BDI          |
| CAMEROON                       | CMR          |
| CAPE VERDE                     | CPV          |
| CENTRAL AFRICAN REPUBLIC       | CAF          |
| CHAD                           | TCD          |
| CONGO                          | COG          |
| CONGO$ DEMOCRATIC REPUBLIC OF  | COD          |
| COTE D’IVOIRE                  | CIV          |
| DJIBOUTI                       | DJI          |
| EGYPT                          | EGY          |
| EQUATORIAL GUINEA              | GNQ          |
| ETHIOPIA                       | ETH          |
| GABON                          | GAB          |
| GAMBIA                         | GMB          |
| GHANA                          | GHA          |
| GUINEA                         | GIN          |
| GUINEA-BISSAU                  | GNB          |
| IRAQ                           | IRQ          |
| JORDAN                         | JOR          |
| KENYA                          | KEN          |
| KUWAIT                         | KWT          |
| LEBANON                        | LBN          |
| LESOTHO                        | LSO          |
| LIBERIA                        | LBR          |
| MADAGASCAR                     | MDG          |
| MALAWI                         | MWI          |
| MALI                           | MLI          |
| MAURITANIA                     | MRT          |
| MAURITIUS                      | MUS          |
| MOROCCO                        | MAR          |
| MOZAMBIQUE                     | MOZ          |
| NAMIBIA                        |              |
| NIGER                          | NER          |
| NIGERIA                        | NGA          |
| OMAN                           | OMN          |
| PAKISTAN                       | PAK          |
| PALESTINIAN TERRITORY$OCCUPIED | PSE          |
| QATAR                          | QAT          |
| REPUBLIC OF SOUTH SUDAN        | SSD          |
| RWANDA                         | RWA          |
| SAUDI ARABIA                   | SAU          |
| SENEGAL                        | SEN          |
| SEYCHELLES                     | SYC          |
| SIERRA LEONE                   | SLE          |
| SOMALIA                        | SOM          |
| SOUTH AFRICA                   | ZAF          |
| SWAZILAND                      | SWZ          |
| TANZANIA$ UNITED REPUBLIC OF   | TZA          |
| TOGO                           | TGO          |
| TUNISIA                        | TUN          |
| UGANDA                         | UGA          |
| UNITED ARAB EMIRATES           | ARE          |
| YEMEN                          | YEM          |
| ZAMBIA                         | ZMB          |
| ZIMBABWE                       | ZWE          |
| UNITED STATES                  | USA          |
