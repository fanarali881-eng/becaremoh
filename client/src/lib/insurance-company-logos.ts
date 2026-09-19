const insuranceCompanyLogoMap: Record<string, string> = {
  "تكافل الراجحي": "/images/a1/c1.svg",
  "التعاونية": "/images/a1/c2.svg",
  "ولاء": "/images/a1/c3.svg",
  "ولاء للتأمين": "/images/a1/c3.svg",
  "الصقر للتأمين": "/images/a1/c4.svg",
  "سلامة": "/images/a1/c5.svg",
  "ميدغلف": "/images/a1/c6.svg",
  "أسيج": "/images/a1/c7.svg",
  "الجزيرة تكافل": "/images/a1/c8.svg",
  "أليانز": "/images/a1/c9.svg",
  "أمانة": "/images/a1/c10.svg",
  "أمانة للتأمين": "/images/a1/c10.svg",
  "الدرع العربي": "/images/a1/c11.svg",
  "جي آي جي": "/images/a1/c12.svg",
  "الإتحاد للتأمين": "/images/a1/c13.svg",
  "الاتحاد للتأمين التعاوني": "/images/a1/c14.svg",
  "العربية للتأمين": "/images/a1/c15.svg",
  "أكسا": "/images/a1/c16.svg",
  "ملاذ للتأمين": "/images/a1/c17.svg",
};

/**
 * Returns a deploy-owned logo path. An empty string intentionally means that
 * no verified local asset exists, allowing the UI to render a text fallback
 * instead of requesting an expired third-party URL.
 */
export function getInsuranceCompanyLogo(companyName: string): string {
  return insuranceCompanyLogoMap[companyName.trim()] ?? "";
}
