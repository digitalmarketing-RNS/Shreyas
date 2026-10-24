import type { ComboboxOption } from "../combobox";

/**
 * Invented sample records for the /design/forms gallery: Indian names in several scripts, rupee
 * amounts, +91 numbers and Indian cities. None of it is real.
 */

export const GALLERY_TODAY = "2026-10-06";
/** 1:30 pm IST on the gallery's "today". */
export const GALLERY_NOW = "2026-10-06T08:00:00.000Z";
export const INSTITUTION = "Sahyadri College of Engineering";

export const COUNSELLORS: ComboboxOption[] = [
  { value: "anjali-rao", label: "Anjali Rao", description: "Admissions · Pune campus" },
  { value: "ravi-kumar", label: "Ravi Kumar", description: "Admissions · Pune campus" },
  { value: "meera-pillai", label: "Meera Pillai", description: "Outreach · Kochi" },
  { value: "arjun-mehta", label: "Arjun Mehta", description: "Admissions · Ahmedabad" },
  { value: "priya-nair", label: "Priya Nair", description: "Scholarships · Kochi" },
  { value: "neha-joshi", label: "नेहा जोशी", description: "Admissions · Nagpur" },
  { value: "harpreet-kaur", label: "ਹਰਪ੍ਰੀਤ ਕੌਰ", description: "Outreach · Ludhiana" },
  { value: "lakshmi-s", label: "லட்சுமி சுப்ரமணியன்", description: "Admissions · Chennai" },
  { value: "ishaan-b", label: "ঈশান বন্দ্যোপাধ্যায়", description: "Hostel desk · Kolkata" },
  { value: "zoya-siddiqui", label: "زویا صدیقی", description: "Admissions · Lucknow" },
  { value: "farhan-qureshi", label: "Farhan Qureshi", description: "Fees desk · Hyderabad" },
  { value: "kavya-reddy", label: "Kavya Reddy", description: "Admissions · Hyderabad", disabled: true },
  { value: "jose-fernandes", label: "José Fernandes", description: "Outreach · Panaji" },
];

export const PROGRAMMES: ComboboxOption[] = [
  { value: "btech-cse", label: "B.Tech Computer Science", group: "Engineering" },
  { value: "btech-ece", label: "B.Tech Electronics and Communication", group: "Engineering" },
  { value: "btech-mech", label: "B.Tech Mechanical", group: "Engineering" },
  { value: "btech-civil", label: "B.Tech Civil", group: "Engineering" },
  { value: "bba", label: "BBA", group: "Management" },
  { value: "mba", label: "MBA", group: "Management" },
  { value: "mba-hr", label: "MBA Human Resources", group: "Management" },
  { value: "bsc-nursing", label: "B.Sc Nursing", group: "Health sciences" },
  { value: "bpharm", label: "B.Pharm", group: "Health sciences" },
  { value: "ba-eco", label: "BA Economics", group: "Arts and humanities" },
  { value: "ba-eng", label: "BA English", group: "Arts and humanities" },
  { value: "bcom", label: "B.Com", group: "Commerce" },
  { value: "bcom-hons", label: "B.Com (Honours)", group: "Commerce" },
  { value: "mcom", label: "M.Com", group: "Commerce" },
];

const FIRST = ["Aarav", "Diya", "Kabir", "Saanvi", "Vihaan", "Ira", "Reyansh", "Myra", "Advait", "Anika", "Rohan", "Tara", "Dev", "Nisha", "Yash"];
const LAST = ["Sharma", "Iyer", "Banerjee", "Gill", "Patel", "Menon", "Deshmukh", "Khan", "Reddy", "Bose"];
const CITIES = ["Pune", "Nagpur", "Indore", "Kochi", "Mysuru", "Jaipur", "Bhopal", "Guwahati", "Surat", "Coimbatore"];

/** About 150 leads for the async search demo. */
export const LEAD_DIRECTORY: ComboboxOption[] = FIRST.flatMap((first, i) =>
  LAST.map((last, j) => ({
    value: `lead-${10400 + i * 10 + j}`,
    label: `${first} ${last}`,
    description: `#${10400 + i * 10 + j} · ${CITIES[(i + j) % CITIES.length]}`,
  })),
);

export const STAGES = [
  { value: "new", label: "New enquiry", dotClassName: "bg-chart-1" },
  { value: "contacted", label: "Contacted", dotClassName: "bg-chart-2" },
  { value: "interested", label: "Interested", dotClassName: "bg-chart-3" },
  { value: "campus-visit", label: "Campus visit booked", dotClassName: "bg-chart-4" },
  { value: "applied", label: "Application submitted", dotClassName: "bg-chart-5" },
  { value: "enrolled", label: "Enrolled", dotClassName: "bg-chart-6" },
  { value: "lost", label: "Not interested", dotClassName: "bg-chart-8" },
];

/** A plain sentence repeated to any length, for counters. */
export function remarkOfLength(length: number): string {
  const base =
    "Spoke to the father on the phone. They want the hostel fee structure and the scholarship form before the campus visit on Saturday. ";
  let text = "";
  while (text.length < length) text += base;
  return text.slice(0, length);
}

/** Simulated server search: 500 ms, cancellable, "Ira" style prefix or contains match. */
export function searchLeads(query: string, signal: AbortSignal): Promise<ComboboxOption[]> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      const term = query.toLowerCase();
      resolve(LEAD_DIRECTORY.filter((lead) => lead.label.toLowerCase().includes(term) || (lead.description ?? "").includes(term)).slice(0, 20));
    }, 500);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
