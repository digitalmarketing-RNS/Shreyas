/**
 * Country codes and number handling for PhoneInput (components.md PhoneInput; decisions.md
 * section 3, Phone). The value leaves as E.164 ("+919876543210").
 *
 * The browser checks only the digit count: exactly 10 national digits for India, 4 to 14 elsewhere.
 * The server validates with libphonenumber-js ("max" metadata). The type of a number (mobile or
 * landline) is never guessed from its first digit.
 */

import { formatPhone } from "@/lib/format";

export type Country = { iso: string; name: string; code: string };

// ISO 3166 code | name | calling code (without "+"). A to Z by name.
const TABLE = `AF|Afghanistan|93
AL|Albania|355
DZ|Algeria|213
AS|American Samoa|1
AD|Andorra|376
AO|Angola|244
AI|Anguilla|1
AG|Antigua and Barbuda|1
AR|Argentina|54
AM|Armenia|374
AW|Aruba|297
AU|Australia|61
AT|Austria|43
AZ|Azerbaijan|994
BS|Bahamas|1
BH|Bahrain|973
BD|Bangladesh|880
BB|Barbados|1
BY|Belarus|375
BE|Belgium|32
BZ|Belize|501
BJ|Benin|229
BM|Bermuda|1
BT|Bhutan|975
BO|Bolivia|591
BA|Bosnia and Herzegovina|387
BW|Botswana|267
BR|Brazil|55
IO|British Indian Ocean Territory|246
VG|British Virgin Islands|1
BN|Brunei|673
BG|Bulgaria|359
BF|Burkina Faso|226
BI|Burundi|257
KH|Cambodia|855
CM|Cameroon|237
CA|Canada|1
CV|Cape Verde|238
KY|Cayman Islands|1
CF|Central African Republic|236
TD|Chad|235
CL|Chile|56
CN|China|86
CO|Colombia|57
KM|Comoros|269
CG|Congo - Brazzaville|242
CD|Congo - Kinshasa|243
CK|Cook Islands|682
CR|Costa Rica|506
CI|Côte d’Ivoire|225
HR|Croatia|385
CU|Cuba|53
CW|Curaçao|599
CY|Cyprus|357
CZ|Czechia|420
DK|Denmark|45
DJ|Djibouti|253
DM|Dominica|1
DO|Dominican Republic|1
EC|Ecuador|593
EG|Egypt|20
SV|El Salvador|503
GQ|Equatorial Guinea|240
ER|Eritrea|291
EE|Estonia|372
SZ|Eswatini|268
ET|Ethiopia|251
FK|Falkland Islands|500
FO|Faroe Islands|298
FJ|Fiji|679
FI|Finland|358
FR|France|33
GF|French Guiana|594
PF|French Polynesia|689
GA|Gabon|241
GM|Gambia|220
GE|Georgia|995
DE|Germany|49
GH|Ghana|233
GI|Gibraltar|350
GR|Greece|30
GL|Greenland|299
GD|Grenada|1
GP|Guadeloupe|590
GU|Guam|1
GT|Guatemala|502
GG|Guernsey|44
GN|Guinea|224
GW|Guinea-Bissau|245
GY|Guyana|592
HT|Haiti|509
HN|Honduras|504
HK|Hong Kong|852
HU|Hungary|36
IS|Iceland|354
IN|India|91
ID|Indonesia|62
IR|Iran|98
IQ|Iraq|964
IE|Ireland|353
IM|Isle of Man|44
IL|Israel|972
IT|Italy|39
JM|Jamaica|1
JP|Japan|81
JE|Jersey|44
JO|Jordan|962
KZ|Kazakhstan|7
KE|Kenya|254
KI|Kiribati|686
XK|Kosovo|383
KW|Kuwait|965
KG|Kyrgyzstan|996
LA|Laos|856
LV|Latvia|371
LB|Lebanon|961
LS|Lesotho|266
LR|Liberia|231
LY|Libya|218
LI|Liechtenstein|423
LT|Lithuania|370
LU|Luxembourg|352
MO|Macao|853
MG|Madagascar|261
MW|Malawi|265
MY|Malaysia|60
MV|Maldives|960
ML|Mali|223
MT|Malta|356
MH|Marshall Islands|692
MQ|Martinique|596
MR|Mauritania|222
MU|Mauritius|230
YT|Mayotte|262
MX|Mexico|52
FM|Micronesia|691
MD|Moldova|373
MC|Monaco|377
MN|Mongolia|976
ME|Montenegro|382
MS|Montserrat|1
MA|Morocco|212
MZ|Mozambique|258
MM|Myanmar (Burma)|95
NA|Namibia|264
NR|Nauru|674
NP|Nepal|977
NL|Netherlands|31
NC|New Caledonia|687
NZ|New Zealand|64
NI|Nicaragua|505
NE|Niger|227
NG|Nigeria|234
NU|Niue|683
KP|North Korea|850
MK|North Macedonia|389
MP|Northern Mariana Islands|1
NO|Norway|47
OM|Oman|968
PK|Pakistan|92
PW|Palau|680
PS|Palestinian Territories|970
PA|Panama|507
PG|Papua New Guinea|675
PY|Paraguay|595
PE|Peru|51
PH|Philippines|63
PL|Poland|48
PT|Portugal|351
PR|Puerto Rico|1
QA|Qatar|974
RE|Réunion|262
RO|Romania|40
RU|Russia|7
RW|Rwanda|250
WS|Samoa|685
SM|San Marino|378
ST|São Tomé and Príncipe|239
SA|Saudi Arabia|966
SN|Senegal|221
RS|Serbia|381
SC|Seychelles|248
SL|Sierra Leone|232
SG|Singapore|65
SX|Sint Maarten|1
SK|Slovakia|421
SI|Slovenia|386
SB|Solomon Islands|677
SO|Somalia|252
ZA|South Africa|27
KR|South Korea|82
SS|South Sudan|211
ES|Spain|34
LK|Sri Lanka|94
BL|St Barthélemy|590
SH|St Helena|290
KN|St Kitts and Nevis|1
LC|St Lucia|1
MF|St Martin|590
PM|St Pierre and Miquelon|508
VC|St Vincent and the Grenadines|1
SD|Sudan|249
SR|Suriname|597
SE|Sweden|46
CH|Switzerland|41
SY|Syria|963
TW|Taiwan|886
TJ|Tajikistan|992
TZ|Tanzania|255
TH|Thailand|66
TL|Timor-Leste|670
TG|Togo|228
TK|Tokelau|690
TO|Tonga|676
TT|Trinidad and Tobago|1
TN|Tunisia|216
TR|Türkiye|90
TM|Turkmenistan|993
TC|Turks and Caicos Islands|1
TV|Tuvalu|688
VI|US Virgin Islands|1
UG|Uganda|256
UA|Ukraine|380
AE|United Arab Emirates|971
GB|United Kingdom|44
US|United States|1
UY|Uruguay|598
UZ|Uzbekistan|998
VU|Vanuatu|678
VA|Vatican City|39
VE|Venezuela|58
VN|Vietnam|84
WF|Wallis and Futuna|681
EH|Western Sahara|212
YE|Yemen|967
ZM|Zambia|260
ZW|Zimbabwe|263`;

export const COUNTRIES: readonly Country[] = TABLE.split("\n").map((line) => {
  const [iso, name, code] = line.split("|");
  return { iso, name, code };
});

const BY_ISO = new Map(COUNTRIES.map((country) => [country.iso, country]));

/** Codes shared by several countries, and the country a pasted number goes to by default. */
export const MAIN_COUNTRY: Record<string, string> = {
  "1": "US",
  "7": "RU",
  "39": "IT",
  "44": "GB",
  "212": "MA",
  "262": "RE",
  "590": "GP",
};

const CODES = [...new Set(COUNTRIES.map((country) => country.code))];

export const DEFAULT_COUNTRY = "IN";

export function countryByIso(iso: string): Country {
  return BY_ISO.get(iso) ?? (BY_ISO.get(DEFAULT_COUNTRY) as Country);
}

/** India first, then the institution's pinned countries (up to 5), then every country A to Z. */
export function orderedCountries(pinned: readonly string[] = []): Country[] {
  const head = [DEFAULT_COUNTRY, ...pinned.filter((iso) => iso !== DEFAULT_COUNTRY && BY_ISO.has(iso)).slice(0, 5)];
  const seen = new Set(head);
  return [...head.map((iso) => countryByIso(iso)), ...COUNTRIES.filter((country) => !seen.has(country.iso))];
}

/** "+91 India", so the closed select shows the code first. */
export function countryOptionLabel(country: Country): string {
  return `+${country.code} ${country.name}`;
}

export function digitsOnly(text: string): string {
  return text.replace(/\D/g, "");
}

/**
 * Reads what was typed or pasted into the number field. Spaces, dashes, brackets and a leading 0
 * are fine. A pasted "+91…", "0091…" or "91" followed by 10 digits is read as India; any other
 * "+…" or "00…" number switches the country by its code. Shared codes (+1, +7, +44) keep the
 * current country when it has that code, and otherwise pick the main one.
 */
export function normalisePhone(text: string, currentIso: string): { iso: string; national: string } {
  const trimmed = text.trim();
  const digits = digitsOnly(trimmed);
  const international = trimmed.startsWith("+") ? digits : trimmed.startsWith("00") ? digits.slice(2) : null;

  if (international !== null && international.length > 0) {
    for (const length of [3, 2, 1]) {
      const code = international.slice(0, length);
      if (!CODES.includes(code)) continue;
      const current = countryByIso(currentIso);
      const iso = current.code === code ? current.iso : (MAIN_COUNTRY[code] ?? COUNTRIES.find((c) => c.code === code)!.iso);
      return { iso, national: stripTrunkZero(international.slice(length)) };
    }
    return { iso: currentIso, national: international };
  }

  if (currentIso === "IN" && digits.length === 12 && digits.startsWith("91")) {
    return { iso: "IN", national: digits.slice(2) };
  }
  return { iso: currentIso, national: stripTrunkZero(digits) };
}

function stripTrunkZero(digits: string): string {
  return digits.replace(/^0+/, "");
}

/** The browser's only check: the number of national digits. */
export function phoneDigitError(national: string, iso: string, countryName = countryByIso(iso).name): string | null {
  if (!national) return null;
  if (iso === "IN") return national.length === 10 ? null : "Enter a 10-digit mobile number.";
  if (national.length < 4 || national.length > 14) {
    return `This doesn't look like a valid number for ${withArticle(countryName)}.`;
  }
  return null;
}

const NEEDS_THE = new Set([
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Netherlands",
  "Philippines",
  "Bahamas",
  "Maldives",
  "Gambia",
  "Czechia",
  "Central African Republic",
  "Dominican Republic",
  "Comoros",
  "Seychelles",
  "Marshall Islands",
  "Solomon Islands",
  "Cayman Islands",
  "Falkland Islands",
  "Faroe Islands",
  "Cook Islands",
  "British Virgin Islands",
  "US Virgin Islands",
  "Turks and Caicos Islands",
  "Northern Mariana Islands",
  "Palestinian Territories",
]);

function withArticle(name: string): string {
  return NEEDS_THE.has(name) ? `the ${name}` : name;
}

export function toE164(iso: string, national: string): string | null {
  if (!national) return null;
  return `+${countryByIso(iso).code}${national}`;
}

/**
 * The national number as shown after blur. India: "98765 43210". Staff screens group the other
 * countries the shared formatter knows (UAE, Singapore, UK and Australian mobiles, +1); public
 * pages leave them as typed digits (public script budget).
 */
export function formatNational(national: string, iso: string, { staff = false }: { staff?: boolean } = {}): string {
  if (iso === "IN" && national.length === 10) return `${national.slice(0, 5)} ${national.slice(5)}`;
  if (!staff || !national) return national;
  const code = countryByIso(iso).code;
  const formatted = formatPhone(`+${code}${national}`);
  const prefix = `+${code} `;
  return formatted.startsWith(prefix) ? formatted.slice(prefix.length) : national;
}

/** Splits a stored E.164 value back into country and national number. */
export function splitE164(value: string | null | undefined, fallbackIso = DEFAULT_COUNTRY): { iso: string; national: string } {
  if (!value) return { iso: fallbackIso, national: "" };
  return normalisePhone(value, fallbackIso);
}
