import { generatePackingSlipPDF } from '/dev-server/src/lib/packingSlipGenerator';
import fs from 'fs';
(globalThis as any).navigator = { userAgent: 'node' };
let captured: Blob | null = null;
(globalThis as any).URL.createObjectURL = (b: Blob) => { captured = b; return 'blob:x'; };
(globalThis as any).URL.revokeObjectURL = () => {};
(globalThis as any).document = { createElement: () => ({ style:{}, click(){}, setAttribute(){} }), body: { appendChild(){}, removeChild(){} } };
const rows = Array.from({length: 14}, (_,i)=>({itemName: i%3===0? '20FT Flatbed Utility Trailer With Extra Long Description Name':'Cargo Trailer 7x14', vin: i%4===0? '': '2C9UT2028R1234'+i, stockNumber: 'STK-10'+i, jobNumber:'JOB-000'+i, quantity:1, unitPrice: 12345.5, totalPrice: 12345.5}));
const quote: any = { salesOrderNumber:'SO-0007', quoteNumber:'QUO-0021', vendorName:'Northern Outline Ltd.', contactPersonName:'John Smith', vendorAddress:'123 Main St\nEdmonton, AB T5A 1A1', createdAt:new Date().toISOString(), items:[] };
const settings: any = { businessName:'FM Fabrications', businessAddress:'55 Industrial Rd\nLeduc, AB', businessPhone:'780-555-1234', businessEmail:'sales@fmfab.ca', logoUrl:null, layout:null, thankYouNote:null };
for (const [name, includePrices] of [['prices', true], ['noprices', false]] as const) {
  captured = null;
  await generatePackingSlipPDF(quote, settings, { includePrices, rows });
  fs.writeFileSync(`/tmp/qa/${name}.pdf`, Buffer.from(await captured!.arrayBuffer()));
}
console.log('ok');
