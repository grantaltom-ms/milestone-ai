// TODO: replace with Supabase query
export const bulletinItems = [
  {
    label: 'Due today',
    title: 'June delinquency review queue',
    detail: 'Review candidates before creating POV drafts.',
  },
  {
    label: 'Event',
    title: 'Portfolio check-in',
    detail: 'Conor and Andrew to review open items this week.',
  },
  {
    label: 'Birthday',
    title: 'Team birthday reminder',
    detail: 'Add staff birthday source before wiring real data.',
  },
];

// TODO: replace with AppFolio / vacancy tracker query
export const vacancySummary = {
  totalVacant: 18,
  readyToRent: 7,
  inProgress: 11,
};

// TODO: replace with Supabase delinquency review queue
export const reviewCandidates = [
  { tenant: 'Aleara Hatvany', property: 'Ascona', unit: '206', manager: 'Mae Santos' },
  { tenant: 'Jordan Smith', property: 'Galer Crest', unit: '14', manager: 'Conor Murphy' },
  { tenant: 'Maria Lopez', property: 'Queen Anne Flats', unit: '302', manager: 'Andrew Riviere' },
];

// TODO: replace with Supabase POV notice register
export const noticeDrafts = [
  { tenant: 'Aleara Hatvany', property: 'Ascona', unit: '206', status: 'Draft' },
  { tenant: 'Jordan Smith', property: 'Galer Crest', unit: '14', status: 'Approved' },
  { tenant: 'Maria Lopez', property: 'Queen Anne Flats', unit: '302', status: 'Voided' },
];
