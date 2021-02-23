const countriesToCorrect = new Map([
  ['Bosnia And Herzegovina', 'Bosnia and Herzegovina'],
  ["Côte D'ivoire", "Côte d'Ivoire"],
  ['Federal Republic Of Yugoslavia', 'Federal Republic of Yugoslavia'],
  ['Guinea Bissau', 'Guinea-Bissau'],
  ['Holy See (Vatican City State)', 'Holy See'],
  ['Isle Of Man', 'Isle of Man'],
  ['Republic Of North Macedonia', 'Republic of North Macedonia'],
  ['Serbia And Montenegro', 'Serbia and Montenegro'],
  ['Svalbard And Jan Mayen', 'Svalbard and Jan Mayen'],
  ['The Democratic Republic Of Congo', 'Democratic Republic of Congo'],
  ['Trinidad And Tobago', 'Trinidad and Tobago'],
]);
export default function correctCountryName(countryName: string): string {
  const properCountryName = countriesToCorrect.get(countryName);
  return properCountryName || countryName;
}
