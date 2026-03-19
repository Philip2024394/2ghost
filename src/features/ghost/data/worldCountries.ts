export type Country = {
  name: string;
  flag: string;
  code: string;
};

export const WORLD_COUNTRIES: Country[] = [
  { name: "Indonesia", flag: "🇮🇩", code: "ID" },
  { name: "Malaysia", flag: "🇲🇾", code: "MY" },
  { name: "Singapore", flag: "🇸🇬", code: "SG" },
  { name: "Philippines", flag: "🇵🇭", code: "PH" },
  { name: "Thailand", flag: "🇹🇭", code: "TH" },
  { name: "Vietnam", flag: "🇻🇳", code: "VN" },
  { name: "Japan", flag: "🇯🇵", code: "JP" },
  { name: "South Korea", flag: "🇰🇷", code: "KR" },
  { name: "China", flag: "🇨🇳", code: "CN" },
  { name: "India", flag: "🇮🇳", code: "IN" },
  { name: "Pakistan", flag: "🇵🇰", code: "PK" },
  { name: "Bangladesh", flag: "🇧🇩", code: "BD" },
  { name: "Sri Lanka", flag: "🇱🇰", code: "LK" },
  { name: "United Arab Emirates", flag: "🇦🇪", code: "AE" },
  { name: "Saudi Arabia", flag: "🇸🇦", code: "SA" },
  { name: "Qatar", flag: "🇶🇦", code: "QA" },
  { name: "Kuwait", flag: "🇰🇼", code: "KW" },
  { name: "Bahrain", flag: "🇧🇭", code: "BH" },
  { name: "Turkey", flag: "🇹🇷", code: "TR" },
  { name: "Egypt", flag: "🇪🇬", code: "EG" },
  { name: "Morocco", flag: "🇲🇦", code: "MA" },
  { name: "Nigeria", flag: "🇳🇬", code: "NG" },
  { name: "South Africa", flag: "🇿🇦", code: "ZA" },
  { name: "Kenya", flag: "🇰🇪", code: "KE" },
  { name: "Ghana", flag: "🇬🇭", code: "GH" },
  { name: "United Kingdom", flag: "🇬🇧", code: "GB" },
  { name: "Ireland", flag: "🇮🇪", code: "IE" },
  { name: "Germany", flag: "🇩🇪", code: "DE" },
  { name: "France", flag: "🇫🇷", code: "FR" },
  { name: "Netherlands", flag: "🇳🇱", code: "NL" },
  { name: "Belgium", flag: "🇧🇪", code: "BE" },
  { name: "Spain", flag: "🇪🇸", code: "ES" },
  { name: "Italy", flag: "🇮🇹", code: "IT" },
  { name: "Portugal", flag: "🇵🇹", code: "PT" },
  { name: "Sweden", flag: "🇸🇪", code: "SE" },
  { name: "Norway", flag: "🇳🇴", code: "NO" },
  { name: "Denmark", flag: "🇩🇰", code: "DK" },
  { name: "Finland", flag: "🇫🇮", code: "FI" },
  { name: "Switzerland", flag: "🇨🇭", code: "CH" },
  { name: "Austria", flag: "🇦🇹", code: "AT" },
  { name: "Poland", flag: "🇵🇱", code: "PL" },
  { name: "Ukraine", flag: "🇺🇦", code: "UA" },
  { name: "Russia", flag: "🇷🇺", code: "RU" },
  { name: "United States", flag: "🇺🇸", code: "US" },
  { name: "Canada", flag: "🇨🇦", code: "CA" },
  { name: "Mexico", flag: "🇲🇽", code: "MX" },
  { name: "Brazil", flag: "🇧🇷", code: "BR" },
  { name: "Argentina", flag: "🇦🇷", code: "AR" },
  { name: "Colombia", flag: "🇨🇴", code: "CO" },
  { name: "Peru", flag: "🇵🇪", code: "PE" },
  { name: "Chile", flag: "🇨🇱", code: "CL" },
  { name: "Australia", flag: "🇦🇺", code: "AU" },
  { name: "New Zealand", flag: "🇳🇿", code: "NZ" },
];

export function findCountry(nameOrCode: string): Country | undefined {
  const q = nameOrCode.toLowerCase();
  return WORLD_COUNTRIES.find(
    (c) => c.name.toLowerCase() === q || c.code.toLowerCase() === q
  );
}

export function countryFlag(nameOrCode: string): string {
  return findCountry(nameOrCode)?.flag ?? "🌍";
}
