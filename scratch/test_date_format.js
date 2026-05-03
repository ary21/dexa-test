
const d1 = new Date('2026-05-03');
const d2 = new Date('2026-05-03T00:00:00');

console.log('ISO (UTC):', d1.toISOString());
console.log('Local with T00:', d2.toISOString());
console.log('Local string:', d2.toString());
