/**
 * Invented sample data for the /design gallery: Indian names in several scripts, Indian cities,
 * rupee amounts in paise, +91 numbers. Times are pre-formatted the way the server formats them
 * (en-IN, Asia/Kolkata), so client specimens never format in the browser.
 */

/** "Now" for every gallery specimen: 06 Oct 2026, 2:30 pm IST. */
export const GALLERY_NOW = "2026-10-06T09:00:00.000Z";

export const INSTITUTION = "Lakeview College";

export const MEMBERSHIPS = [
  { id: "org-lakeview", name: "Lakeview College", role: "Admin", trial: false },
  { id: "org-lakeview-school", name: "Lakeview Public School", role: "Counsellor" },
  { id: "org-deccan", name: "Deccan Commerce College, Hyderabad", role: "Counsellor" },
  { id: "org-sahyadri", name: "Sahyadri School of Nursing", role: "Admin", suspended: true },
];

export const MANY_MEMBERSHIPS = [
  ...MEMBERSHIPS,
  { id: "org-brahmaputra", name: "Brahmaputra Institute of Technology, Guwahati", role: "Support staff" },
  { id: "org-gomti", name: "Gomti Valley Public School, Lucknow", role: "Support staff" },
  { id: "org-malabar", name: "Malabar Arts and Science College, Kochi", role: "Support staff" },
  { id: "org-aravalli", name: "Aravalli Polytechnic, Jaipur", role: "Support staff" },
  { id: "org-kaveri", name: "Kaveri School of Design, Bengaluru", role: "Support staff" },
  { id: "org-narmada", name: "Narmada Junior College, Pune", role: "Support staff", trial: true },
];

export const ME = { name: "Priya Nair", email: "priya.nair@lakeview.edu.in", role: "Counsellor" };

export const PEOPLE = {
  priya: { id: "p-priya", name: "Priya Nair" },
  vikram: { id: "p-vikram", name: "Vikram Shah" },
  asha: { id: "p-asha", name: "Asha Menon" },
  farhan: { id: "p-farhan", name: "Farhan Qureshi" },
  aditi: { id: "p-aditi", name: "अदिति शर्मा" },
  srinivas: { id: "p-srinivas", name: "ಶ್ರೀನಿವಾಸ್ ಗೌಡ" },
  soumitra: { id: "p-soumitra", name: "সৌমিত্র দত্ত" },
  zainab: { id: "p-zainab", name: "زینب خان" },
  gurpreet: { id: "p-gurpreet", name: "ਗੁਰਪ੍ਰੀਤ ਕੌਰ" },
  tamilselvi: { id: "p-tamilselvi", name: "தமிழ்செல்வி ராஜன்" },
};

export const LEADS = [
  { name: "Ananya Rao", course: "B.Tech Computer Science", city: "Pune", phone: "+919876543210", stage: "Counselling done" },
  { name: "Arjun Mehta", course: "BBA", city: "Jaipur", phone: "+919812345678", stage: "Applied" },
  { name: "Ravi Kumar", course: "B.Sc Nursing", city: "Kochi", phone: "+919445566778", stage: "New enquiry" },
  { name: "ફાલ્ગુની પટેલ", course: "B.Com", city: "Ahmedabad", phone: "+919723456789", stage: "Interested" },
  { name: "Meera Iyer", course: "MBA 2027 intake", city: "Bengaluru", phone: "+918023456781", stage: "Applied" },
];
