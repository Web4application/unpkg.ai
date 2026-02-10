import { calculateTip } from 'https://unpkg.ai/esm/calculateTip(amount:number,percentage:number,people?:number):{tip:number,total:number,perPerson:number}.js';

const result = calculateTip(85.50, 18, 4);
console.log(result); // { tip: 15.39, total: 100.89, perPerson: 25.22 }
